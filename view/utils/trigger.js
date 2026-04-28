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
      const fullEventData = {
        ...eventData,
        timestamp: new Date().toISOString(),
        source: 'view'
      };

      console.log('Sending event to backend:', fullEventData);

      fetch('http://localhost:7887/api/trigger-card-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullEventData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('=== Backend response:', data);
          resolve(data);
        })
        .catch(error => {
          console.error('=== Error calling backend:', error);
          reject(error);
        });

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(fullEventData, '*');
      }

      window.dispatchEvent(new CustomEvent('triggerEvent', {
        detail: fullEventData
      }));

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

      // 如果返回的是 running 状态，不恢复按钮状态（由轮询处理）
      if (result && result.status === 'running') {
        console.log('Task is running, keeping button disabled');
      } else {
        // 恢复按钮状态
        if (buttonElement) {
          setTimeout(() => {
            console.log('Restoring button state');
            buttonElement.disabled = false;
            buttonElement.classList.remove('loading');
          }, 500);
        }
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