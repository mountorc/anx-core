/**
 * postCore.js - 处理与core的通信
 */

/**
 * 发送消息到父窗口
 * @param {string} type - 消息类型
 * @param {Object} data - 消息数据
 */
export function sendMessageToParent(type, data) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: type,
      ...data,
      log: {
        timestamp: new Date().toISOString(),
        action: type.toLowerCase().replace('_', '_'),
        details: data
      }
    }, '*');
    console.log('postCore: Message sent to parent:', type, data);
  }
}

/**
 * 发送节点数据更新消息
 * @param {string} cardKey - 节点卡键
 * @param {string} field - 字段名
 * @param {any} value - 字段值
 */
export function sendNodeDataUpdate(cardKey, field, value) {
  sendMessageToParent('UPDATE_NODE_DATA', {
    cardKey: cardKey,
    field: field,
    value: value
  });
}

/**
 * 触发全局事件
 * @param {string} eventName - 事件名称
 * @param {Object} data - 事件数据
 */
export function dispatchGlobalEvent(eventName, data) {
  window.dispatchEvent(new CustomEvent(eventName, {
    detail: {
      ...data,
      log: {
        timestamp: new Date().toISOString(),
        action: eventName.toLowerCase().replace('changed', '_update'),
        details: data
      }
    }
  }));
  console.log('postCore: Global event dispatched:', eventName, data);
}

/**
 * 发送节点数据变化事件
 * @param {string} cardKey - 节点卡键
 * @param {string} field - 字段名
 * @param {any} value - 字段值
 */
export function dispatchNodeDataChanged(cardKey, field, value) {
  dispatchGlobalEvent('nodeDataChanged', {
    cardKey: cardKey,
    field: field,
    value: value
  });
}

/**
 * 与后端API通信
 * @param {string} endpoint - API端点
 * @param {Object} data - 请求数据
 * @returns {Promise<Object>} - 响应数据
 */
export async function communicateWithBackend(endpoint, data) {
  try {
    const response = await fetch(`http://localhost:7887${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      //console.log('postCore: Backend communication successful:', endpoint, result);
      return result;
    } else {
      //console.error('postCore: Backend communication error:', endpoint, response.statusText);
      throw new Error(`Backend error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('postCore: Network error:', endpoint, error);
    throw error;
  }
}

/**
 * 更新节点数据到后端
 * @param {string} cardKey - 节点卡键
 * @param {string} field - 字段名
 * @param {any} value - 字段值
 * @returns {Promise<Object>} - 响应数据
 */
export async function updateNodeDataToBackend(cardKey, field, value) {
  return communicateWithBackend('/api/update-node-data', {
    cardKey: cardKey,
    field: field,
    value: value
  });
}
