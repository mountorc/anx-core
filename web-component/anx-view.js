let buttonTap;
let triggerDeal;
let fileUploadUtils;
let postCore;

window.buttonTap = function(element) {
  if (buttonTap) {
    buttonTap(element);
  } else {
    setTimeout(() => {
      if (buttonTap) {
        buttonTap(element);
      }
    }, 1000);
  }
};

window.handleFileChange = function(event, cardKey, kind, maxSize, maxCount, preview) {
  if (fileUploadUtils) {
    fileUploadUtils.handleFileChange(event, cardKey, kind, maxSize, maxCount, preview);
  } else {
    setTimeout(() => {
      if (fileUploadUtils) {
        fileUploadUtils.handleFileChange(event, cardKey, kind, maxSize, maxCount, preview);
      }
    }, 1000);
  }
};

window.removeFile = function(cardKey, kind, index) {
  if (fileUploadUtils) {
    fileUploadUtils.removeFile(cardKey, kind, index);
  } else {
    setTimeout(() => {
      if (fileUploadUtils) {
        fileUploadUtils.removeFile(cardKey, kind, index);
      }
    }, 1000);
  }
};

function getUuidVisitorFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('uuid_visitor');
}

window.updateNodeData = function(element) {
  const cardKey = element.getAttribute('data-card-key');
  const field = element.getAttribute('data-field');
  const value = element.value;
  const uuid_visitor = getUuidVisitorFromURL();
  
  if (postCore) {
    postCore.sendNodeDataUpdate(cardKey, field, value);
    postCore.dispatchNodeDataChanged(cardKey, field, value);
  } else {
    const event = new CustomEvent('nodeDataChanged', {
      detail: {
        cardKey: cardKey,
        field: field,
        value: value,
        uuid_visitor: uuid_visitor
      }
    });
    window.dispatchEvent(event);
  }
};

window.updateCheckboxData = function(element) {
  const cardKey = element.getAttribute('data-card-key');
  const field = element.getAttribute('data-field');
  const uuid_visitor = getUuidVisitorFromURL();
  
  const checkboxes = document.querySelectorAll('[data-card-key="' + cardKey + '"][data-field="' + field + '"]');
  const values = [];
  checkboxes.forEach(function(cb) {
    if (cb.checked) {
      values.push(cb.getAttribute('data-option-value'));
    }
  });
  
  if (postCore) {
    postCore.sendNodeDataUpdate(cardKey, field, values);
    postCore.dispatchNodeDataChanged(cardKey, field, values);
  } else {
    const event = new CustomEvent('nodeDataChanged', {
      detail: {
        cardKey: cardKey,
        field: field,
        value: values,
        uuid_visitor: uuid_visitor
      }
    });
    window.dispatchEvent(event);
  }
};

window.handleTapSet = function(tapSet, node, button) {
  setTimeout(() => {
    console.log('Tap set processed');
  }, 1500);
};

window.anxNodeUpdate = function(cardKey, field, value) {
  const uuid_visitor = getUuidVisitorFromURL();
  
  if (postCore) {
    postCore.sendNodeDataUpdate(cardKey, field, value);
    postCore.dispatchNodeDataChanged(cardKey, field, value);
  } else {
    const event = new CustomEvent('nodeDataChanged', {
      detail: {
        cardKey: cardKey,
        field: field,
        value: value,
        uuid_visitor: uuid_visitor
      }
    });
    window.dispatchEvent(event);
  }
};

window.anxGetNodeValue = function(cardKey) {
  return [];
};

(async () => {
  try {
    const utils = await import('../examples/frontend/src/utils/utils.js');
    buttonTap = utils.buttonTap;
    triggerDeal = utils.triggerDeal;
    window.buttonTap = buttonTap;
  } catch (error) {
    console.error('ANXView: Error loading utils:', error);
  }
})();

(async () => {
  try {
    const fileUploadModule = await import('../examples/frontend/src/utils/fileUpload.js');
    fileUploadUtils = fileUploadModule;
    window.handleFileChange = fileUploadModule.handleFileChange;
    window.removeFile = fileUploadModule.removeFile;
    window.triggerFileInput = fileUploadModule.triggerFileInput;
  } catch (error) {
    console.error('ANXView: Error loading file upload utils:', error);
  }
})();

(async () => {
  try {
    const postCoreModule = await import('../examples/frontend/src/utils/postCore.js');
    postCore = postCoreModule;
  } catch (error) {
    console.error('ANXView: Error loading postCore utils:', error);
  }
})();

class ANXView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.nodesStructure = null;
    this.visualizationHTML = '';
    this.uuidPage = '';
    
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
        flex: 1;
      }
      
      .node-visualization {
        min-height: 100%;
        height: 100%;
        overflow-y: auto;
      }
      
      .form-layout {
        display: flex;
        height: 100%;
      }
      
      .form-left {
        flex: 1;
        overflow-y: auto;
      }
      
      .form-right {
        width: 500px;
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
      
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
      }
    `;
    
    this.template = document.createElement('template');
    this.template.innerHTML = `
      <style>${this.styles}</style>
      <style id="visualizationCSS"></style>
      <div class="visual-section" id="visualSection">
        <div class="visual-output">
          <div class="node-visualization" id="visualizationContainer">
            <div id="htmlContainer"></div>
          </div>
          <div class="no-data" id="noData">No node data available</div>
          <div class="loading" id="loading">Loading...</div>
        </div>
      </div>
    `;
    
    this.shadowRoot.appendChild(this.template.content.cloneNode(true));
    
    this.visualizationContainer = this.shadowRoot.getElementById('visualizationContainer');
    this.htmlContainer = this.shadowRoot.getElementById('htmlContainer');
    this.noData = this.shadowRoot.getElementById('noData');
    this.loading = this.shadowRoot.getElementById('loading');
    this.visualSection = this.shadowRoot.getElementById('visualSection');
    this.visualizationCSS = this.shadowRoot.getElementById('visualizationCSS');
  }
  
  static get observedAttributes() {
    return ['uuid-page', 'nodes-structure', 'visualization-html'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'uuid-page' && newValue && newValue !== oldValue) {
      this.uuidPage = newValue;
      this.loadPageByUuid(newValue);
    } else if (name === 'nodes-structure' && newValue) {
      try {
        this.nodesStructure = JSON.parse(newValue);
        this.updateVisibility();
      } catch (error) {
        console.error('Error parsing nodes-structure:', error);
      }
    } else if (name === 'visualization-html') {
      this.visualizationHTML = newValue;
      this.renderHTML();
    }
  }
  
  connectedCallback() {
    this.setupEventListeners();
    
    if (buttonTap) {
      window.buttonTap = buttonTap;
    }
    
    this.uuidPage = this.getAttribute('uuid-page') || '';
    if (this.uuidPage) {
      this.loadPageByUuid(this.uuidPage);
    }
    
    this.updateVisibility();
    this.renderHTML();
  }
  
  disconnectedCallback() {
    this.cleanupEventListeners();
    if (window.buttonTap) delete window.buttonTap;
    if (window.handleFileChange) delete window.handleFileChange;
    if (window.removeFile) delete window.removeFile;
    if (window.updateNodeData) delete window.updateNodeData;
    if (window.updateCheckboxData) delete window.updateCheckboxData;
    if (window.handleTapSet) delete window.handleTapSet;
    if (window.anxNodeUpdate) delete window.anxNodeUpdate;
    if (window.anxGetNodeValue) delete window.anxGetNodeValue;
  }
  
  setupEventListeners() {
    window.addEventListener('triggerEvent', this.handleTriggerEvent.bind(this));
    window.addEventListener('nodeDataChanged', this.handleNodeDataChanged.bind(this));
  }
  
  cleanupEventListeners() {
    window.removeEventListener('triggerEvent', this.handleTriggerEvent);
    window.removeEventListener('nodeDataChanged', this.handleNodeDataChanged);
  }
  
  handleTriggerEvent(event) {
    console.log('ANXView: triggerEvent received:', event.detail);
    if (event.detail && event.detail.node && event.detail.node.config) {
      const cardKey = event.detail.node.config.key || event.detail.node.config.id;
      const uuid_visitor = getUuidVisitorFromURL();
      if (cardKey) {
        this.triggerDeal(cardKey, null, null, uuid_visitor);
      }
    }
  }
  
  handleNodeDataChanged(event) {
    console.log('ANXView: nodeDataChanged received:', event.detail);
    const { cardKey, field, value } = event.detail;
    this.updateNodeDataInBackend(cardKey, field, value);
    this.dispatchViewReload();
  }
  
  dispatchViewReload() {
    window.dispatchEvent(new CustomEvent('reloadAnxView', {
      detail: {
        uuid_visitor: getUuidVisitorFromURL()
      }
    }));
  }
  
  async updateNodeDataInBackend(cardKey, field, value) {
    try {
      if (postCore) {
        const result = await postCore.updateNodeDataToBackend(cardKey, field, value);
        console.log('ANXView: Node data updated successfully:', result);
      } else {
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
  
  triggerDeal(cardKey) {
    console.log('ANXView: triggerDeal called with cardKey:', cardKey);
  }
  
  async loadPageByUuid(uuidPage) {
    if (!uuidPage) {
      console.warn('ANXView: uuid-page is empty');
      return;
    }
    
    this.loading.style.display = 'flex';
    this.visualizationContainer.style.display = 'none';
    this.noData.style.display = 'none';
    
    const uuid_visitor = getUuidVisitorFromURL() || 'default-visitor';
    
    try {
      const response = await fetch('http://localhost:7887/api/getView', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uuid_page: uuidPage,
          uuid_visitor: uuid_visitor
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          if (result.css) {
            this.visualizationCSS.textContent = result.css;
          }
          
          if (result.html) {
            this.visualizationHTML = result.html;
          }
          
          if (result.nodes) {
            this.nodesStructure = result.nodes;
          }
          
          this.updateVisibility();
          this.renderHTML();
        } else {
          console.error('ANXView: Failed to load page:', result.error);
          this.noData.textContent = result.error || 'Failed to load page';
          this.loading.style.display = 'none';
          this.noData.style.display = 'flex';
        }
      } else {
        console.error('ANXView: Server error:', response.statusText);
        this.noData.textContent = 'Server error: ' + response.statusText;
        this.loading.style.display = 'none';
        this.noData.style.display = 'flex';
      }
    } catch (error) {
      console.error('ANXView: Network error:', error);
      this.noData.textContent = 'Network error: ' + error.message;
      this.loading.style.display = 'none';
      this.noData.style.display = 'flex';
    }
  }
  
  updateVisibility() {
    this.loading.style.display = 'none';
    
    if (this.nodesStructure || this.visualizationHTML) {
      this.visualizationContainer.style.display = 'block';
      this.noData.style.display = 'none';
    } else {
      this.visualizationContainer.style.display = 'none';
      this.noData.style.display = 'flex';
    }
  }
  
  renderHTML() {
    if (this.htmlContainer && this.visualizationHTML) {
      this.htmlContainer.innerHTML = '';
      
      try {
        this.htmlContainer.innerHTML = this.visualizationHTML;
        
        const scripts = this.htmlContainer.querySelectorAll('script');
        scripts.forEach(script => {
          try {
            const newScript = document.createElement('script');
            for (let i = 0; i < script.attributes.length; i++) {
              const attr = script.attributes[i];
              newScript.setAttribute(attr.name, attr.value);
            }
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
            setTimeout(() => {
              try {
                document.body.removeChild(newScript);
              } catch (e) {
                console.warn('ANXView: Error removing script:', e);
              }
            }, 0);
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

customElements.define('anx-view', ANXView);