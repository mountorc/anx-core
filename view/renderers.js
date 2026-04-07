/**
 * 组件渲染器
 */
const { renderBox } = require('./kinds/box.js');
const { renderBoard } = require('./kinds/board.js');
const { renderTable } = require('./kinds/table.js');
const { renderText } = require('./kinds/text.js');
const { renderInput } = require('./kinds/input.js');
const { renderTextarea } = require('./kinds/textarea.js');
const { renderButton } = require('./kinds/button.js');
const { renderForm } = require('./kinds/form.js');
const { renderNavigation } = require('./kinds/navigation.js');
const { renderDate } = require('./kinds/date.js');
const { renderOptions } = require('./kinds/options.js');
const { renderCheckbox } = require('./kinds/checkbox.js');
const { renderList } = require('./kinds/list.js');
const { renderDefault } = require('./kinds/default.js');
const { renderFile } = require('./kinds/file.js');
const { handleButtonClick, triggerEvent } = require('./utils/trigger.js');

/**
 * 渲染节点
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的HTML
 */
function renderNode(node) {
  if (!node || !node.config || !node.config.kind) {
    return '<div class="anx-error">Invalid node</div>';
  }

  let renderedContent = '';
  
  switch (node.config.kind) {
    case 'box':
      renderedContent = renderBox(node);
      break;
    case 'board':
      renderedContent = renderBoard(node, renderNode);
      break;
    case 'table':
      renderedContent = renderTable(node);
      break;
    case 'text':
      renderedContent = renderText(node);
      break;
    case 'input':
      renderedContent = renderInput(node);
      break;
    case 'textarea':
      renderedContent = renderTextarea(node);
      break;
    case 'button':
      renderedContent = renderButton(node);
      break;
    case 'form':
      renderedContent = renderForm(node, renderNode);
      break;
    case 'navigation':
      renderedContent = renderNavigation(node);
      break;
    case 'date':
      renderedContent = renderDate(node);
      break;
    case 'options':
      renderedContent = renderOptions(node);
      break;
    case 'checkbox':
      renderedContent = renderCheckbox(node);
      break;
    case 'list':
      renderedContent = renderList(node);
      break;
    case 'file':
    case 'image':
    case 'images':
      renderedContent = renderFile(node);
      break;
    default:
      renderedContent = renderDefault(node);
      break;
  }
  
  // 添加全局触发事件函数
  if (node.config.kind === 'button') {
    renderedContent += `
      <script>
        // 全局触发事件函数
        window.handleButtonClick = function(buttonData, buttonElement) {
          console.log('=== Global handleButtonClick called ===');
          console.log('Button data:', buttonData);
          console.log('Button element:', buttonElement);
          
          return new Promise((resolve, reject) => {
            try {
              // 构建事件数据
              const eventData = {
                type: 'TRIGGER_EVENT',
                eventType: 'tap',
                buttonId: buttonData.buttonId,
                label: buttonData.label,
                tapSet: buttonData.tapSet,
                node: buttonData.node,
                timestamp: new Date().toISOString(),
                source: 'view'
              };
              
              console.log('Sending event to backend:', eventData);
              
              // 向父窗口发送事件
              if (window.parent && window.parent !== window) {
                console.log('Sending event to parent window');
                window.parent.postMessage(eventData, '*');
              }
              
              // 触发全局事件
              console.log('Dispatching global event');
              window.dispatchEvent(new CustomEvent('triggerEvent', {
                detail: eventData
              }));
              
              // 模拟后端调用
              console.log('Simulating backend call');
              setTimeout(() => {
                console.log('Event processed successfully');
                
                // 恢复按钮状态
                if (buttonElement) {
                  setTimeout(() => {
                    console.log('Restoring button state');
                    buttonElement.disabled = false;
                    buttonElement.classList.remove('loading');
                  }, 500);
                }
                
                resolve({ success: true, message: 'Event triggered successfully' });
              }, 500);
              
            } catch (error) {
              console.error('Error handling button click:', error);
              
              // 恢复按钮状态
              if (buttonElement) {
                setTimeout(() => {
                  console.log('Restoring button state after error');
                  buttonElement.disabled = false;
                  buttonElement.classList.remove('loading');
                }, 500);
              }
              
              reject(error);
            }
          });
        };
        
        window.triggerEvent = function(eventData) {
          console.log('=== Global triggerEvent called ===');
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
        };
      </script>
    `;
  }
  
  return renderedContent;
}

module.exports = {
  renderNode
};
