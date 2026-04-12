// ANXView Web Component
// 动态导入工具函数
let buttonTap;
let triggerDeal;
let fileUploadUtils;
let postCore;

// 添加全局buttonTap占位符
window.buttonTap = function(element) {
  console.log('ANXView: buttonTap placeholder called, waiting for utils to load...');
  // 检查工具函数是否加载完成
  if (buttonTap) {
    buttonTap(element);
  } else {
    // 延迟执行
    setTimeout(() => {
      if (buttonTap) {
        buttonTap(element);
      } else {
        console.error('ANXView: buttonTap not loaded after delay');
      }
    }, 1000);
  }
};

// 添加全局文件上传函数占位符
window.handleFileChange = function(event, cardKey, kind, maxSize, maxCount, preview) {
  console.log('ANXView: handleFileChange placeholder called, waiting for fileUpload utils to load...');
  if (fileUploadUtils) {
    fileUploadUtils.handleFileChange(event, cardKey, kind, maxSize, maxCount, preview);
  } else {
    setTimeout(() => {
      if (fileUploadUtils) {
        fileUploadUtils.handleFileChange(event, cardKey, kind, maxSize, maxCount, preview);
      } else {
        console.error('ANXView: handleFileChange not loaded after delay');
      }
    }, 1000);
  }
};

window.removeFile = function(cardKey, kind, index) {
  console.log('ANXView: removeFile placeholder called, waiting for fileUpload utils to load...');
  if (fileUploadUtils) {
    fileUploadUtils.removeFile(cardKey, kind, index);
  } else {
    setTimeout(() => {
      if (fileUploadUtils) {
        fileUploadUtils.removeFile(cardKey, kind, index);
      } else {
        console.error('ANXView: removeFile not loaded after delay');
      }
    }, 1000);
  }
};

// 添加全局节点数据更新函数占位符
window.updateNodeData = function(element) {
  console.log('ANXView: updateNodeData placeholder called');
  const cardKey = element.getAttribute('data-card-key');
  const field = element.getAttribute('data-field');
  const value = element.value;
  
  // 使用postCore发送消息
  if (postCore) {
    postCore.sendNodeDataUpdate(cardKey, field, value);
    postCore.dispatchNodeDataChanged(cardKey, field, value);
  } else {
    // 备用方案：直接发送事件
    const event = new CustomEvent('nodeDataChanged', {
      detail: {
        cardKey: cardKey,
        field: field,
        value: value
      }
    });
    window.dispatchEvent(event);
  }
};

// 添加全局复选框数据更新函数占位符
window.updateCheckboxData = function(element) {
  console.log('ANXView: updateCheckboxData placeholder called');
  const cardKey = element.getAttribute('data-card-key');
  const field = element.getAttribute('data-field');
  
  // 获取当前所有选中的值
  const checkboxes = document.querySelectorAll('[data-card-key="' + cardKey + '"][data-field="' + field + '"]');
  const values = [];
  checkboxes.forEach(function(cb) {
    if (cb.checked) {
      values.push(cb.getAttribute('data-option-value'));
    }
  });
  
  // 使用postCore发送消息
  if (postCore) {
    postCore.sendNodeDataUpdate(cardKey, field, values);
    postCore.dispatchNodeDataChanged(cardKey, field, values);
  } else {
    // 备用方案：直接发送事件
    const event = new CustomEvent('nodeDataChanged', {
      detail: {
        cardKey: cardKey,
        field: field,
        value: values
      }
    });
    window.dispatchEvent(event);
  }
};

// 处理tap事件
window.handleTapSet = function(tapSet, node, button) {
  console.log('ANXView: handleTapSet called:', tapSet);
  console.log('Node:', node);
  
  // 模拟处理过程
  setTimeout(() => {
    console.log('Tap set processed');
    // 可以在这里添加实际的处理逻辑
    // 例如导航、API调用等
  }, 1500);
};


// 定义全局的节点更新函数
window.anxNodeUpdate = function(cardKey, field, value) {
  console.log('ANXView: anxNodeUpdate called:', cardKey, field, value);
  // 使用postCore发送消息
  if (postCore) {
    postCore.sendNodeDataUpdate(cardKey, field, value);
    postCore.dispatchNodeDataChanged(cardKey, field, value);
  } else {
    // 备用方案：直接发送事件
    const event = new CustomEvent('nodeDataChanged', {
      detail: {
        cardKey: cardKey,
        field: field,
        value: value
      }
    });
    window.dispatchEvent(event);
  }
};

// 定义全局的获取节点值函数
window.anxGetNodeValue = function(cardKey) {
  console.log('ANXView: anxGetNodeValue called:', cardKey);
  // 这里返回空数组作为默认值
  return [];
};

// 异步加载工具函数
(async () => {
  try {
    const utils = await import('../utils/utils.js');
    buttonTap = utils.buttonTap;
    triggerDeal = utils.triggerDeal;
    // 替换占位符
    window.buttonTap = buttonTap;
    console.log('ANXView: Utils loaded successfully, buttonTap replaced');
  } catch (error) {
    console.error('ANXView: Error loading utils:', error);
  }
})();

// 异步加载文件上传工具函数
(async () => {
  try {
    const fileUploadModule = await import('../utils/fileUpload.js');
    fileUploadUtils = fileUploadModule;
    // 替换占位符
    window.handleFileChange = fileUploadModule.handleFileChange;
    window.removeFile = fileUploadModule.removeFile;
    window.triggerFileInput = fileUploadModule.triggerFileInput;
    console.log('ANXView: File upload utils loaded successfully from fileUpload.js');
  } catch (error) {
    console.error('ANXView: Error loading file upload utils:', error);
  }
})();

// 异步加载postCore工具函数
(async () => {
  try {
    const postCoreModule = await import('../utils/postCore.js');
    postCore = postCoreModule;
    console.log('ANXView: PostCore utils loaded successfully from postCore.js');
  } catch (error) {
    console.error('ANXView: Error loading postCore utils:', error);
  }
})();

class ANXView extends HTMLElement {
  constructor() {
    super();
    // 创建Shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // 初始化属性
    this.nodesStructure = null;
    this.visualizationHTML = '';
    
    // 定义样式
    this.styles = `
      .visual-section {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
      }
      
      .visual-output {
        overflow-y: auto;
        min-height: 0;
        height: 100%;
      }
      
      .node-visualization {
        min-height: 100%;
        height: 100%;
        overflow-y: auto;
      }
      
      /* 左右布局 */
      .form-layout {
        display: flex;
        height: 100%;
      }
      
      .form-left {
        flex: 1;
        overflow-y: auto;
      }
      
      .form-right {
        width: 300px;
        border-left: 1px solid #ddd;
        background-color: #f9f9f9;
        overflow-y: auto;
      }
      
      .no-data {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #999;
        font-style: italic;
      }
    `;
    
    // 定义模板
    this.template = document.createElement('template');
    this.template.innerHTML = `
      <style>${this.styles}</style>
      <div class="visual-section">
        <div class="visual-output">
          <div class="node-visualization" id="visualizationContainer">
            <div id="htmlContainer"></div>
          </div>
          <div class="no-data" id="noData">No node data available</div>
        </div>
      </div>
    `;
    
    // 克隆模板内容到Shadow DOM
    this.shadowRoot.appendChild(this.template.content.cloneNode(true));
    
    // 获取DOM元素
    this.visualizationContainer = this.shadowRoot.getElementById('visualizationContainer');
    this.htmlContainer = this.shadowRoot.getElementById('htmlContainer');
    this.noData = this.shadowRoot.getElementById('noData');
  }
  
  // 定义可观察的属性
  static get observedAttributes() {
    return ['nodes-structure', 'visualization-html'];
  }
  
  // 属性变化时的处理
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'nodes-structure' && newValue) {
      try {
        this.nodesStructure = JSON.parse(newValue);
        //console.log('ANXView: nodesStructure updated:', this.nodesStructure);
        this.updateVisibility();
      } catch (error) {
        console.error('Error parsing nodes-structure:', error);
      }
    } else if (name === 'visualization-html') {
      this.visualizationHTML = newValue;
      //console.log('ANXView: visualizationHTML updated:', this.visualizationHTML);
      this.renderHTML();
    }
  }
  
  // 连接到DOM时的处理
  connectedCallback() {
    console.log('ANXView: connected to DOM');
    //console.log('ANXView: initial nodesStructure:', this.nodesStructure);
    //console.log('ANXView: initial visualizationHTML:', this.visualizationHTML);
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 将 buttonTap 函数暴露到全局作用域
    if (buttonTap) {
      window.buttonTap = buttonTap;
      console.log('ANXView: buttonTap exposed to global scope');
    } else {
      console.warn('ANXView: buttonTap not loaded yet');
    }
    
    // 初始渲染
    this.updateVisibility();
    this.renderHTML();
  }
  
  // 从DOM断开时的处理
  disconnectedCallback() {
    console.log('ANXView: disconnected from DOM');
    // 清理事件监听器
    this.cleanupEventListeners();
    // 清理全局变量
    if (window.buttonTap) {
      delete window.buttonTap;
      console.log('ANXView: buttonTap removed from global scope');
    }
    // 清理文件上传相关全局函数
    if (window.handleFileChange) {
      delete window.handleFileChange;
      console.log('ANXView: handleFileChange removed from global scope');
    }
    if (window.removeFile) {
      delete window.removeFile;
      console.log('ANXView: removeFile removed from global scope');
    }
    // 清理节点数据更新相关全局函数
    if (window.updateNodeData) {
      delete window.updateNodeData;
      console.log('ANXView: updateNodeData removed from global scope');
    }
    if (window.updateCheckboxData) {
      delete window.updateCheckboxData;
      console.log('ANXView: updateCheckboxData removed from global scope');
    }
    if (window.handleTapSet) {
      delete window.handleTapSet;
      console.log('ANXView: handleTapSet removed from global scope');
    }
    if (window.anxNodeUpdate) {
      delete window.anxNodeUpdate;
      console.log('ANXView: anxNodeUpdate removed from global scope');
    }
    if (window.anxGetNodeValue) {
      delete window.anxGetNodeValue;
      console.log('ANXView: anxGetNodeValue removed from global scope');
    }
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // 监听来自可视化内容的事件
    window.addEventListener('triggerEvent', this.handleTriggerEvent.bind(this));
    window.addEventListener('nodeDataChanged', this.handleNodeDataChanged.bind(this));
  }
  
  // 清理事件监听器
  cleanupEventListeners() {
    window.removeEventListener('triggerEvent', this.handleTriggerEvent);
    window.removeEventListener('nodeDataChanged', this.handleNodeDataChanged);
  }
  
  // 处理触发事件
  handleTriggerEvent(event) {
    console.log('ANXView: triggerEvent received:', event.detail);
    // 可以在这里处理触发事件
    if (event.detail && event.detail.node && event.detail.node.config) {
      const cardKey = event.detail.node.config.key || event.detail.node.config.id;
      if (cardKey) {
        this.triggerDeal(cardKey);
      }
    }
  }
  
  // 处理节点数据变化
  handleNodeDataChanged(event) {
    console.log('ANXView: nodeDataChanged received:', event.detail);
    
    const { cardKey, field, value } = event.detail;
    
    // 同步到后端
    this.updateNodeDataInBackend(cardKey, field, value);
  }
  
  // 同步节点数据到后端
  async updateNodeDataInBackend(cardKey, field, value) {
    console.log('ANXView: Updating node data in backend:', cardKey, field, value);
    
    try {
      if (postCore) {
        const result = await postCore.updateNodeDataToBackend(cardKey, field, value);
        console.log('ANXView: Node data updated successfully:', result);
      } else {
        // 备用方案：直接调用fetch
        const response = await fetch('http://localhost:7887/api/update-node-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cardKey: cardKey,
            field: field,
            value: value
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('ANXView: Node data updated successfully:', result);
        } else {
          console.error('ANXView: Error updating node data:', response.statusText);
        }
      }
    } catch (error) {
      console.error('ANXView: Network error updating node data:', error);
    }
  }
  
  // 触发处理函数
  triggerDeal(cardKey) {
    console.log('ANXView: triggerDeal called with cardKey:', cardKey);
    // 这里可以添加处理逻辑
  }
  
  // 更新可见性
  updateVisibility() {
    if (this.nodesStructure) {
      this.visualizationContainer.style.display = 'block';
      this.noData.style.display = 'none';
    } else {
      this.visualizationContainer.style.display = 'none';
      this.noData.style.display = 'flex';
    }
  }
  
  // 渲染HTML
  renderHTML() {
    if (this.htmlContainer && this.visualizationHTML) {
      // 清空容器
      this.htmlContainer.innerHTML = '';
      
      try {
        // 检查是否有resultSet配置
        console.log('ANXView: nodesStructure:', this.nodesStructure);
        const hasResultSet = this.nodesStructure && this.nodesStructure.config && this.nodesStructure.config.resultSet;
        const showType = hasResultSet ? this.nodesStructure.config.resultSet.showType : null;
        console.log('ANXView: hasResultSet:', hasResultSet);
        console.log('ANXView: showType:', showType);
        
        // 强制使用左右布局进行测试
        const useRightLayout = showType=='right'?true:false;
        
        // 根据resultSet配置决定布局
        if (useRightLayout) {
          // 左右布局
          const layoutHTML = `
            <div class="form-layout">
              <div class="form-left">
                ${this.visualizationHTML}
              </div>
              <div class="form-right">
                <h3 style="padding: 15px; margin: 0; border-bottom: 1px solid #ddd;">结果区域</h3>
                <div style="padding: 15px;">
                  <p>结果将显示在这里</p>
                </div>
              </div>
            </div>
          `;
          this.htmlContainer.innerHTML = layoutHTML;
          console.log('ANXView: Applied right layout');
        } else {
          // 默认布局
          this.htmlContainer.innerHTML = this.visualizationHTML;
          console.log('ANXView: Applied default layout');
        }
        
        // 执行脚本标签
        const scripts = this.htmlContainer.querySelectorAll('script');
        scripts.forEach(script => {
          try {
            // 创建新的脚本元素
            const newScript = document.createElement('script');
            
            // 复制属性
            for (let i = 0; i < script.attributes.length; i++) {
              const attr = script.attributes[i];
              newScript.setAttribute(attr.name, attr.value);
            }
            
            // 设置脚本内容
            newScript.textContent = script.textContent;
            
            // 执行脚本
            document.body.appendChild(newScript);
            
            // 执行完后移除脚本标签
            setTimeout(() => {
              try {
                document.body.removeChild(newScript);
              } catch (e) {
                console.warn('ANXView: Error removing script:', e);
              }
            }, 0);
            
            console.log('ANXView: Script executed successfully');
          } catch (scriptError) {
            console.error('ANXView: Error executing script:', scriptError);
          }
        });
      } catch (error) {
        console.error('ANXView: Error rendering HTML:', error);
        this.htmlContainer.innerHTML = '<div class="error">Error rendering visualization</div>';
      }
    }
  }
}

// 注册自定义元素
customElements.define('anx-view', ANXView);
