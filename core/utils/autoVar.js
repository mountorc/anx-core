/**
 * autoVar.js - 自动变量处理工具
 */

// 类型标记常量
const TYPE_NUMBER = 1;
const TYPE_STRING = 2;
const TYPE_JSON = 3;

// WASM 实例
let wasmInstance = null;
// 确保 WASM 模块已加载
if (!wasmInstance) {
  loadWasm();
}
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
      const wasmPath = path.join(__dirname, '../../examples/frontend/src/utils/wasm/rust.wasm');
      wasmBuffer = fs.readFileSync(wasmPath);
    } else {
      // 浏览器环境
      const wasmUrl = '/src/utils/wasm/rust.wasm';
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
function getValue(nick, data,autoSet) {
  if (!wasmInstance) {
    console.warn('WASM 实例未加载');
    return null;
  }

  const getValueFn = wasmInstance.exports.get_value;
  const memory = wasmInstance.exports.memory;
  
  if (!getValueFn || !memory) {
    console.warn('WASM 模块未导出 get_value 或 memory');
    return null;
  }

  try {
    const dataStr = JSON.stringify(data);
    const dataBytes = new TextEncoder().encode(dataStr);
    const nickBytes = new TextEncoder().encode(nick);
    
    // 内存偏移量
    let offset = 1000; // 从较大的偏移量开始，避免覆盖
    const nickOffset = offset;
    const dataOffset = nickOffset + nickBytes.length + 1;
    const outOffset = dataOffset + dataBytes.length + 10;
    const outLenOffset = outOffset + 200; // 预留足够空间

    // 写入 nick 到内存
    const memView = new Uint8Array(memory.buffer);
    memView.set(nickBytes, nickOffset);
    
    // 写入 data 到内存
    memView.set(dataBytes, dataOffset);
    
    // 初始化输出长度为0
    new DataView(memory.buffer).setUint32(outLenOffset, 0, true);
    
    // 调用 WASM 函数
    const result = getValueFn(
      nickOffset, nickBytes.length,
      dataOffset, dataBytes.length,
      outOffset, outLenOffset
    );
    
    // 读取结果
    let returnValue;
    if (result > 0) {
      // 数字类型
      returnValue = result;
    } else if (result < 0) {
      // 字符串类型（长度为负的绝对值）
      const strLen = -result;
      const strBytes = memView.subarray(outOffset, outOffset + strLen);
      returnValue = new TextDecoder().decode(strBytes);
    } else {
      // 其他类型或错误
      returnValue = null;
    }
    
    return returnValue;
  } catch (error) {
    console.error('执行 getValue 函数失败:', error);
    return null;
  }
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
    // 调用 getValue 函数
    let res=getValue(nick, data);
    if(res==undefined){
        let cardKey=autoSet?.cardKey;
        if(cardKey){
          res=getCardData(cardKey,nick);
        }
    }
    return res;
  } catch (error) {
    console.error('autoVar 函数执行失败:', error);
    return null;
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
