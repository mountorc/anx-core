/**
 * 触发事件处理工具
 */

/**
 * 触发事件到后端
 * @param {Object} eventData - 事件数据
 * @returns {Promise} - 处理结果
 */
export function triggerEvent(eventData) {
  console.log('=== Trigger Event ===');
  console.log('Event data:', eventData);
  
  return new Promise((resolve, reject) => {
    try {
      // 构建完整的事件数据
      const fullEventData = {
        ...eventData,
        timestamp: new Date().toISOString(),
        source: 'view'
      };
      
      console.log('Sending event to backend:', fullEventData);
      
      // 向父窗口发送事件
      if (window.parent && window.parent !== window) {
        console.log('Sending event to parent window');
        window.parent.postMessage(fullEventData, '*');
      }
      
      // 触发全局事件
      console.log('Dispatching global event');
      window.dispatchEvent(new CustomEvent('triggerEvent', {
        detail: fullEventData
      }));
      
      // 模拟后端调用
      console.log('Simulating backend call');
      setTimeout(() => {
        console.log('Event processed successfully');
        resolve({ success: true, message: 'Event triggered successfully' });
      }, 500);
      
    } catch (error) {
      console.error('Error triggering event:', error);
      reject(error);
    }
  });
}

/**
 * 处理按钮点击事件
 * @param {Object} buttonData - 按钮数据
 * @param {HTMLElement} buttonElement - 按钮元素
 * @returns {Promise} - 处理结果
 */
export function handleButtonClick(buttonData, buttonElement) {
  console.log('=== Handle Button Click ===');
  console.log('Button data:', buttonData);
  console.log('Button element:', buttonElement);
  
  // 构建事件数据
  const eventData = {
    type: 'TRIGGER_EVENT',
    eventType: 'tap',
    buttonId: buttonData.buttonId,
    label: buttonData.label,
    tapSet: buttonData.tapSet,
    node: buttonData.node
  };
  
  // 添加点击反馈
  if (buttonElement) {
    console.log('Adding click feedback');
    buttonElement.disabled = true;
    buttonElement.classList.add('loading');
  }
  
  // 触发事件
  return triggerEvent(eventData)
    .then(result => {
      console.log('Button click handled successfully:', result);
      
      // 恢复按钮状态
      if (buttonElement) {
        setTimeout(() => {
          console.log('Restoring button state');
          buttonElement.disabled = false;
          buttonElement.classList.remove('loading');
        }, 500);
      }
      
      return result;
    })
    .catch(error => {
      console.error('Error handling button click:', error);
      
      // 恢复按钮状态
      if (buttonElement) {
        setTimeout(() => {
          console.log('Restoring button state after error');
          buttonElement.disabled = false;
          buttonElement.classList.remove('loading');
        }, 500);
      }
      
      throw error;
    });
}

module.exports = {
  triggerEvent,
  handleButtonClick
};