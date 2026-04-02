/**
 * 核心节点可视化处理模块
 */

const { renderNode } = require('./renderers.js');

/**
 * 生成节点的可视化HTML
 * @param {Object} node - 节点结构
 * @returns {string} - 生成的HTML
 */
function generateNodeVisualization(node) {
  const html = renderNode(node);
  const js = generateVisualizationJS();
  const css = `<style>${generateVisualizationCSS()}</style>`;
  return css + html + js;
}

/**
 * 生成可视化交互的JavaScript
 * @returns {string} - 生成的JavaScript
 */
function generateVisualizationJS() {
  return `
<script>
(function() {
  // 更新节点数据
  window.updateNodeData = function(element) {
    const cardKey = element.getAttribute('data-card-key');
    const field = element.getAttribute('data-field');
    const value = element.value;
    
    // 记录字段修改日志
    console.log('[View Log] Field updated:', {
      timestamp: new Date().toISOString(),
      cardKey: cardKey,
      field: field,
      value: value,
      action: 'field_update'
    });
    
    // 调用父窗口的更新函数（如果在iframe中）
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'UPDATE_NODE_DATA',
        cardKey: cardKey,
        field: field,
        value: value,
        log: {
          timestamp: new Date().toISOString(),
          action: 'field_update',
          details: { cardKey, field, value }
        }
      }, '*');
    }
    
    // 同时触发全局事件
    window.dispatchEvent(new CustomEvent('nodeDataChanged', {
      detail: { 
        cardKey, 
        field, 
        value,
        log: {
          timestamp: new Date().toISOString(),
          action: 'field_update',
          details: { cardKey, field, value }
        }
      }
    }));
  };
  
  // 更新复选框数据
  window.updateCheckboxData = function(element) {
    const cardKey = element.getAttribute('data-card-key');
    const field = element.getAttribute('data-field');
    const optionValue = element.getAttribute('data-option-value');
    const isChecked = element.checked;
    
    // 获取当前所有选中的值
    const checkboxes = document.querySelectorAll('[data-card-key="' + cardKey + '"][data-field="' + field + '"]');
    const values = [];
    checkboxes.forEach(function(cb) {
      if (cb.checked) {
        values.push(cb.getAttribute('data-option-value'));
      }
    });
    
    // 记录字段修改日志
    console.log('[View Log] Checkbox updated:', {
      timestamp: new Date().toISOString(),
      cardKey: cardKey,
      field: field,
      optionValue: optionValue,
      isChecked: isChecked,
      selectedValues: values,
      action: 'checkbox_update'
    });
    
    // 调用父窗口的更新函数（如果在iframe中）
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'UPDATE_NODE_DATA',
        cardKey: cardKey,
        field: field,
        value: values,
        log: {
          timestamp: new Date().toISOString(),
          action: 'checkbox_update',
          details: { cardKey, field, optionValue, isChecked, selectedValues: values }
        }
      }, '*');
    }
    
    // 同时触发全局事件
    window.dispatchEvent(new CustomEvent('nodeDataChanged', {
      detail: { 
        cardKey, 
        field, 
        value: values,
        log: {
          timestamp: new Date().toISOString(),
          action: 'checkbox_update',
          details: { cardKey, field, optionValue, isChecked, selectedValues: values }
        }
      }
    }));
  };
  
  // 处理tap事件
  window.handleTapSet = function(tapSet, data, element) {
    if (!tapSet || typeof tapSet !== 'object') return;

    Object.keys(tapSet).forEach(actionType => {
      const actionConfig = tapSet[actionType];
      handleAction(actionType, actionConfig, data, null, element);
    });
  };
  
  // 处理trigger事件
  window.handleTriggerSet = function(triggerSet, data, element) {
    if (!triggerSet || typeof triggerSet !== 'object') return {};

    const handlers = {};

    Object.keys(triggerSet).forEach(triggerType => {
      const actionConfig = triggerSet[triggerType];
      const eventType = mapTriggerTypeToEvent(triggerType);
      
      if (eventType) {
        const handler = (event) => {
          Object.keys(actionConfig).forEach(actionType => {
            handleAction(actionType, actionConfig[actionType], data, event, element);
          });
        };

        element.addEventListener(eventType, handler);
        handlers[triggerType] = handler;
      }
    });

    return handlers;
  };
  
  // 映射trigger类型到事件类型
  function mapTriggerTypeToEvent(triggerType) {
    const eventMap = {
      input: 'input',
      focus: 'focus',
      blur: 'blur',
      submit: 'submit',
      tap: 'click',
      longtap: 'contextmenu', // Using contextmenu as long tap alternative
      doubletap: 'dblclick',
      cancel: 'cancel',
      clear: 'input'
    };

    return eventMap[triggerType] || null;
  }
  
  // 处理action
  function handleAction(actionType, actionConfig, data, event, element) {
    switch (actionType) {
      case 'navigateTo':
        handleNavigateTo(actionConfig, data, event);
        break;
      case 'navigateBack':
        handleNavigateBack(actionConfig, event);
        break;
      case 'updateData':
        handleUpdateData(actionConfig, data, event);
        break;
      case 'setTimeout':
        handleSetTimeout(actionConfig, data, event, element);
        break;
      case 'requestSet':
        handleRequestSet(actionConfig, data, event);
        break;
      default:
        console.warn('Unknown action type: ' + actionType);
    }
  }
  
  // 处理导航
  function handleNavigateTo(config, data, event) {
    if (!config.path) return;

    let path = config.path;
    const params = new URLSearchParams();

    if (config.paramMap && typeof config.paramMap === 'object') {
      Object.keys(config.paramMap).forEach(targetParam => {
        const sourceField = config.paramMap[targetParam];
        const value = getDataValue(data, sourceField);
        if (value !== undefined) {
          params.set(targetParam, value);
        }
      });
    }

    const queryString = params.toString();
    if (queryString) {
      path = path + '?' + queryString;
    }

    window.location.href = path;
  }
  
  // 处理返回导航
  function handleNavigateBack(config, event) {
    window.history.back();
  }
  
  // 处理数据更新
  function handleUpdateData(config, data, event) {
    if (!config.tableName) return;

    // This is a placeholder implementation
    // In a real application, this would update the data in a dataset
    console.log('Updating data:', {
      tableName: config.tableName,
      paramMap: config.paramMap,
      uniqueMap: config.uniqueMap,
      data
    });
  }
  
  // 处理延时
  function handleSetTimeout(config, data, event, element) {
    if (!config.delay) return;

    setTimeout(() => {
      if (config.action) {
        handleAction(config.action.type, config.action.config, data, event, element);
      }
    }, config.delay);
  }
  
  // 处理请求
  function handleRequestSet(config, data, event) {
    console.log('Starting handleRequestSet...');
    console.log('Config:', config);
    console.log('Data:', data);
    console.log('Event:', event);
    
    if (!config.url) {
      console.warn('No URL provided in config');
      return;
    }

    const method = config.method || 'GET';
    const params = {};

    console.log('Processing paramMap...');
    if (config.paramMap && typeof config.paramMap === 'object') {
      Object.keys(config.paramMap).forEach(targetParam => {
        const sourceField = config.paramMap[targetParam];
        const value = getDataValue(data, sourceField);
        console.log('Param:', targetParam, 'Source:', sourceField, 'Value:', value);
        if (value !== undefined) {
          params[targetParam] = value;
        }
      });
    }

    let url = config.url;
    let fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Building request...');
    if (method === 'GET') {
      const queryString = new URLSearchParams(params).toString();
      if (queryString) {
        url = url + '?' + queryString;
      }
    } else {
      fetchOptions.body = JSON.stringify(params);
    }

    console.log('Preparing to send request...');
    console.log('Final request:', {
      url: url,
      method: method,
      params: params,
      options: fetchOptions
    });
    
    console.log('Sending request now...');
    fetch(url, fetchOptions)
      .then(response => {
        console.log('Response received:', response);
        return response.json();
      })
      .then(responseData => {
        console.log('Request response data:', responseData);
      })
      .catch(error => {
        console.error('Request error:', error);
      });
  }
  
  // 获取数据值
  function getDataValue(data, fieldPath) {
    if (!data || !fieldPath) return undefined;

    const parts = fieldPath.split('.');
    let value = data;

    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }

    return value;
  }
})();
</script>
  `;
}

/**
 * 生成所有可视化模块的CSS
 * @returns {string} - 生成的CSS
 */
function generateVisualizationCSS() {
  return `
    .node-visualization {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .box-visualization {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    
    .box-header {
      background-color: #f5f5f5;
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .box-header h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }
    
    .box-content {
      padding: 15px;
    }
    
    .box-data-item {
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background-color: white;
      color: #333;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .box-data-item:last-child {
      margin-bottom: 0;
    }
    
    .table-visualization {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    
    .table-header {
      background-color: #f5f5f5;
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .table-header h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }
    
    .table-content {
      padding: 15px;
    }
    
    .anx-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .anx-table th,
    .anx-table td {
      padding: 10px;
      border: 1px solid #e0e0e0;
      text-align: left;
    }
    
    .anx-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    .list-visualization {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    
    .list-title {
      background-color: #f5f5f5;
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }
    
    .list-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .list-table th,
    .list-table td {
      padding: 10px;
      border: 1px solid #e0e0e0;
      text-align: left;
    }
    
    .list-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    .list-empty {
      padding: 20px;
      text-align: center;
      color: #999;
      font-style: italic;
    }
    
    .form-visualization {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    
    .form-title {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .input-visualization,
    .textarea-visualization,
    .date-visualization,
    .text-visualization {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .input-label,
    .textarea-label,
    .date-label,
    .text-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    
    .text-visualization {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .text-content {
      padding: 10px 12px;
      border: none;
      background-color: transparent;
      color: #333;
      font-size: 14px;
    }
    
    .input-visualization input,
    .textarea-visualization textarea,
    .date-visualization input {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 100%;
      font-size: 14px;
      transition: border-color 0.2s ease;
    }
    
    .input-visualization input:focus,
    .textarea-visualization textarea:focus,
    .date-visualization input:focus {
      outline: none;
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
    
    .button-visualization {
      display: flex;
      justify-content: flex-end;
    }
    
    .button-visualization button {
      padding: 10px 16px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }
    
    .button-visualization button:hover {
      background-color: #218838;
    }
    
    .options-visualization {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .options-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    
    .options-visualization select {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 100%;
      font-size: 14px;
    }
    
    .checkbox-visualization {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .checkbox-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .checkbox-item label {
      font-size: 14px;
      color: #333;
      cursor: pointer;
    }
    
    .navigation-visualization {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    
    .navigation-visualization ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .navigation-visualization li {
      padding: 10px 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .navigation-visualization li:hover {
      background-color: #e0e0e0;
    }
    
    .default-visualization {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }
    
    .default-visualization h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
      font-size: 18px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    
    .node-info p {
      margin: 8px 0;
      color: #666;
    }
    
    .node-options {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    
    .node-options h4 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #333;
      font-size: 14px;
    }
    
    .node-options ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }
    
    .node-options li {
      margin: 5px 0;
    }
    
    .node-value {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    
    .node-value h4 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #333;
      font-size: 14px;
    }
    
    .no-data {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #999;
      font-style: italic;
    }
    
    /* File upload styles */
    .anx-file-component {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .anx-file-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    
    .anx-file-description {
      font-size: 12px;
      color: #666;
    }
    
    .anx-upload-area {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .anx-upload-area:hover {
      border-color: #409eff;
      background-color: #f5f9ff;
    }
    
    .anx-upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .anx-upload-icon {
      font-size: 32px;
    }
    
    .anx-upload-text {
      font-size: 14px;
      color: #666;
    }
    
    .anx-image-preview {
      position: relative;
      display: inline-block;
    }
    
    .anx-preview-image {
      max-width: 100px;
      max-height: 100px;
      border-radius: 4px;
    }
    
    .anx-remove-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #ff4d4f;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .anx-remove-btn:hover {
      background-color: #ff7875;
    }
    
    .anx-images-upload {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .anx-upload-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }
    
    .anx-image-preview-item {
      position: relative;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .anx-upload-item {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .anx-upload-item:hover {
      border-color: #409eff;
      background-color: #f5f9ff;
    }
    
    .anx-file-upload {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .anx-file-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f9f9f9;
    }
    
    .anx-file-icon {
      font-size: 24px;
    }
    
    .anx-file-name {
      flex: 1;
      font-size: 14px;
      color: #333;
    }
  `;
}

module.exports = {
  generateNodeVisualization,
  generateVisualizationCSS
};
