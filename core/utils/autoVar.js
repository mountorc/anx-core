/**
 * autoVar.js - 自动变量处理工具
 */

const { getCardData } = require('./card.js');
// 类型标记常量
const TYPE_NUMBER = 1;
const TYPE_STRING = 2;
const TYPE_JSON = 3;

// WASM 实例
let wasmInstance = null;
loadWasm();
/*
async function getValue(nick, data, autoSet) {
  if (!wasmInstance) {
    console.debug('WASM 实例未加载，自动加载...');
    await loadWasm();
  }
    */
/**
 * 加载 WASM 模块
 * @returns {Promise} - 加载结果
 */
async function loadWasm() {
  try {
    let wasmBuffer;
    
    // 检查是否在 Node.js 环境中
    if (typeof window === 'undefined') {
      // Node.js 环境
      const fs = require('fs');
      const path = require('path');
      const wasmPath = path.join(__dirname, '../wasm/autoVar.wasm');
      wasmBuffer = fs.readFileSync(wasmPath);
    } else {
      // 浏览器环境
      const wasmUrl = '/core/wasm/autoVar.wasm';
      const response = await fetch(wasmUrl);
      wasmBuffer = await response.arrayBuffer();
    }
    
    const wasmModule = await WebAssembly.instantiate(wasmBuffer);
    
    wasmInstance = wasmModule.instance;
    console.debug("WASM 实例化成功，导出函数：" + Object.keys(wasmInstance.exports));
    
    return wasmInstance;
  } catch (error) {
    console.error('WASM 加载失败:', error);
    throw error;
  }
}

/**
 * 获取 WASM 实例
 * @returns {Object|null} - WASM 实例
 */
function getWasmInstance() {
  return wasmInstance;
}

/**
 * 执行 WASM 函数获取值
 * @param {string} nick - 变量路径
 * @param {Object} data - 数据源
 * @returns {*} - 获取的值
 */
function getValue(nick, data, autoSet) {
  if (!wasmInstance) {
    console.warn('WASM 实例未加载');
    return undefined;
  }

  const { get_value: getValueFn, memory } = wasmInstance.exports;
  
  if (!getValueFn || !memory) {
    console.warn('WASM 模块未导出 get_value 或 memory');
    return undefined;
  }

  try {
    const dataBytes = new TextEncoder().encode(JSON.stringify(data));
    const nickBytes = new TextEncoder().encode(nick);
    
    const nickOffset = 1000;
    const dataOffset = nickOffset + nickBytes.length + 1;
    const outOffset = dataOffset + dataBytes.length + 10;

    let memView = new Uint8Array(memory.buffer);
    memView.set(nickBytes, nickOffset);
    memView.set(dataBytes, dataOffset);
    
    const result = getValueFn(nickOffset, nickBytes.length, dataOffset, dataBytes.length, outOffset, outOffset + 200);
    
    if (result > 0) {
      return result;
    } else if (result < 0) {
      const strLen = -result;
      memView = new Uint8Array(memory.buffer);
      const strBytes = new Uint8Array(strLen);
      for (let i = 0; i < strLen; i++) {
        strBytes[i] = memView[outOffset + i];
      }
      return new TextDecoder().decode(strBytes);
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}

/**
 * 使用 JavaScript 解析路径获取值
 * @param {string} nick - 路径字符串，如 "res.url"
 * @param {Object} data - 数据源对象
 * @returns {*} - 获取的值
 */
function getValueByPath(nick, data) {
  if (!nick || !data) return undefined;
  const keys = nick.split('.');
  let result = data;
  for (const key of keys) {
    if (result === null || result === undefined) return undefined;
    result = result[key];
  }
  return result;
}

/**
 * 全局 autoVar 函数，提供向后兼容
 * @param {string} nick - 要获取的值的路径
 * @param {Object} data - 数据源
 * @param {boolean} autoSet - 自动设置标志（未使用）
 * @returns {*} - 获取的值
 */
function autoVar(nick, data, autoSet) {
  try {
    // 如果 nick 是单引号包裹的字符串，直接返回去掉引号的内容
    if (nick && typeof nick === 'string') {
      const singleQuoteMatch = nick.match(/^'(.*)'$/);
      if (singleQuoteMatch) {
        return singleQuoteMatch[1];
      }
    }
    
    let res = getValue(nick, data, autoSet);
    if (res == undefined) {
      const cardKey = autoSet?.cardKey;
      if (cardKey) {
        res = getCardData(cardKey, nick);
      }
    }
    return res;
  } catch (error) {
    return "err:"+error;
  }
}

/**
 * 解析包含变量的文本模板
 * @param {string} text - 文本模板，包含 ${} 或 {{}} 格式的变量
 * @param {Object} data - 用于替换变量的数据
 * @returns {string} - 解析后的文本
 */
async function ParseText(text, data) {
  try {
    // 确保 WASM 模块已加载
    if (!wasmInstance) {
      await loadWasm();
    }
    
    const parseTextFn = wasmInstance.exports.parse_text;
    const memory = wasmInstance.exports.memory;
    
    if (!parseTextFn || !memory) {
      console.warn('WASM 模块未导出 parse_text 或 memory');
      return text;
    }
    
    const textBytes = new TextEncoder().encode(text);
    const dataStr = JSON.stringify(data);
    const dataBytes = new TextEncoder().encode(dataStr);
    
    // 内存偏移量
    const textOffset = 4096;
    const dataOffset = textOffset + textBytes.length + 1;
    const outOffset = dataOffset + dataBytes.length + 10;
    const outLenOffset = outOffset + 2000; // 预留足够空间
    
    // 写入 text 到内存
    const memView = new Uint8Array(memory.buffer);
    memView.set(textBytes, textOffset);
    
    // 写入 data 到内存
    memView.set(dataBytes, dataOffset);
    
    // 初始化输出长度为0
    new DataView(memory.buffer).setUint32(outLenOffset, 0, true);
    
    // 调用 WASM 函数
    const resultLen = parseTextFn(
      textOffset, textBytes.length,
      dataOffset, dataBytes.length,
      outOffset, outLenOffset
    );
    
    // 读取结果
    if (resultLen > 0) {
      const resultBytes = memView.subarray(outOffset, outOffset + resultLen);
      return new TextDecoder().decode(resultBytes);
    }
    
    return text;
  } catch (error) {
    console.error('ParseText 函数执行失败:', error);
    return text;
  }
}

// 导出模块
module.exports = {
  loadWasm,
  getWasmInstance,
  getValue,
  autoVar,
  ParseText
};
