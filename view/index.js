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
  return html;
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
    
    // 调用父窗口的更新函数（如果在iframe中）
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'UPDATE_NODE_DATA',
        cardKey: cardKey,
        field: field,
        value: value
      }, '*');
    }
    
    // 同时触发全局事件
    window.dispatchEvent(new CustomEvent('nodeDataChanged', {
      detail: { cardKey, field, value }
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
    
    // 调用父窗口的更新函数（如果在iframe中）
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'UPDATE_NODE_DATA',
        cardKey: cardKey,
        field: field,
        value: values
      }, '*');
    }
    
    // 同时触发全局事件
    window.dispatchEvent(new CustomEvent('nodeDataChanged', {
      detail: { cardKey, field, value: values }
    }));
  };
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
    .date-visualization {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .input-label,
    .textarea-label,
    .date-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
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
      background-color: #409eff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }
    
    .button-visualization button:hover {
      background-color: #66b1ff;
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
  `;
}

module.exports = {
  generateNodeVisualization,
  generateVisualizationCSS
};
