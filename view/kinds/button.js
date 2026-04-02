/**
 * Button 组件渲染器
 */

/**
 * 渲染 Button 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderButton(node) {
  const config = node.config;
  const label = config.title || config.label || 'Button';
  const hasTapSet = node.tapSet || config.tapSet;
  const tapSet = node.tapSet || config.tapSet;
  const buttonId = `button-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 调试日志
  console.log('=== Button Render Debug ===');
  console.log('Button ID:', buttonId);
  console.log('Button label:', config.title || config.label || 'Button');
  console.log('config.tapSet:', config.tapSet);
  console.log('node.tapSet:', node.tapSet);
  console.log('hasTapSet:', hasTapSet);
  console.log('Button color:', hasTapSet ? 'blue' : 'green');
  console.log('=== End Button Render Debug ===');

  let buttonHtml = `
    <div class="button-visualization">
      <button id="${buttonId}" class="anx-button" onclick="console.log('直接点击事件触发');">
        <span class="button-text">${label}</span>
        <span class="button-loader" style="display: none;">⟳</span>
      </button>
    </div>
  `;

  // 无论是否有tapSet，都添加点击事件
  buttonHtml += `
    <style>
      .anx-button {
        position: relative;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        background-color: ${hasTapSet ? '#409eff' : '#28a745'};
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
        overflow: hidden;
        z-index: 1000;
      }
      
      .anx-button:hover {
        background-color: ${hasTapSet ? '#66b1ff' : '#218838'};
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .anx-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .anx-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      .button-loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      
      .button-text {
        transition: opacity 0.3s ease;
      }
      
      .anx-button.loading .button-text {
        opacity: 0;
      }
      
      .anx-button.loading .button-loader {
        display: inline;
      }
    </style>
    <script>
      console.log('=== Button script start ===');
      console.log('Button ID:', '${buttonId}');
      console.log('Button label:', '${label}');
      console.log('Button has tapSet:', ${hasTapSet ? 'true' : 'false'});
      
      // 确保DOM加载完成后再绑定事件
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          bindButtonEvents('${buttonId}', '${label}', ${JSON.stringify(tapSet)}, ${JSON.stringify(node)});
        });
      } else {
        bindButtonEvents('${buttonId}', '${label}', ${JSON.stringify(tapSet)}, ${JSON.stringify(node)});
      }
      
      function bindButtonEvents(buttonId, label, tapSet, node) {
        console.log('Binding events for button:', buttonId);
        const button = document.getElementById(buttonId);
        console.log('Button element found:', button);
        
        if (button) {
          console.log('Adding click event listener...');
          // 移除可能存在的事件监听器
          button.removeEventListener('click', handleButtonClick);
          // 添加新的事件监听器
          button.addEventListener('click', handleButtonClick);
          console.log('Click event listener added');
        } else {
          console.error('Button element not found:', buttonId);
          // 尝试延迟查找
          setTimeout(() => {
            const delayedButton = document.getElementById(buttonId);
            console.log('Delayed button find:', delayedButton);
            if (delayedButton) {
              console.log('Adding click event listener after delay...');
              delayedButton.addEventListener('click', handleButtonClick);
              console.log('Click event listener added after delay');
            }
          }, 1000);
        }
        
        function handleButtonClick() {
          console.log('=== Button click handler triggered ===');
          console.log('button tap ' + this.textContent);
          console.log('Button element:', this);
          console.log('Button ID:', buttonId);
          console.log('Button label:', label);
          console.log('Button has tapSet:', tapSet ? 'true' : 'false');
          
          // 记录按钮点击日志
          const clickLog = {
            timestamp: new Date().toISOString(),
            action: 'button_click',
            details: {
              buttonId: buttonId,
              label: label,
              tapSet: tapSet
            }
          };
          
          console.log('[View Log] Button clicked:', clickLog);
          console.log('点击成功');
          
          // 向core发送trigger事件请求
          const triggerEventData = {
            type: 'TRIGGER_EVENT',
            eventType: 'tap',
            buttonId: buttonId,
            label: label,
            tapSet: tapSet,
            node: node,
            log: clickLog
          };
          
          console.log('Sending trigger event to core:', triggerEventData);
          
          // 向父窗口发送trigger事件
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(triggerEventData, '*');
            console.log('Trigger event sent to parent');
          }
          
          // 同时触发全局事件
          window.dispatchEvent(new CustomEvent('triggerEvent', {
            detail: triggerEventData
          }));
          console.log('Global trigger event dispatched');
          
          // 添加点击反馈
          console.log('Adding click feedback...');
          this.disabled = true;
          this.classList.add('loading');
          
          // 调用tap事件处理函数
          console.log('Calling handleTapSet...');
          console.log('window.handleTapSet exists:', typeof window.handleTapSet === 'function');
          
          if (window.handleTapSet && tapSet) {
            try {
              console.log('Executing handleTapSet...');
              window.handleTapSet(tapSet, node, this);
              // 模拟处理完成，恢复按钮状态
              setTimeout(() => {
                console.log('Restoring button state...');
                this.disabled = false;
                this.classList.remove('loading');
              }, 1000);
            } catch (error) {
              console.error('Error handling tap event:', error);
              this.disabled = false;
              this.classList.remove('loading');
            }
          } else {
            console.warn('handleTapSet function not available or no tapSet');
            // 没有tapSet时，直接恢复按钮状态
            setTimeout(() => {
              console.log('Restoring button state...');
              this.disabled = false;
              this.classList.remove('loading');
            }, 500);
          }
        }
      }
      console.log('=== Button script end ===');
    </script>
  `;

  return buttonHtml;
}

module.exports = {
  renderButton
};
