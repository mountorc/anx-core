/**
 * 核心节点可视化处理模块
 */

const boxVisualization = require('./box.js');

/**
 * 生成节点的可视化HTML
 * @param {Object} node - 节点结构
 * @returns {string} - 生成的HTML
 */
function generateNodeVisualization(node) {
  if (!node || !node.config || !node.config.kind) {
    return '';
  }
  
  switch (node.config.kind) {
    case 'box':
      return boxVisualization.generateBoxVisualization(node);
    default:
      return generateDefaultVisualization(node);
  }
}

/**
 * 生成默认的节点可视化HTML
 * @param {Object} node - 节点结构
 * @returns {string} - 生成的HTML
 */
function generateDefaultVisualization(node) {
  let html = `
    <div class="node-visualization">
      <h3>${node.config.kind || 'Node'}</h3>
      <div class="node-info">
        <p><strong>Card Key:</strong> ${node.cardKey}</p>
        <p><strong>Title:</strong> ${node.config.title || 'N/A'}</p>
        <p><strong>Nick:</strong> ${node.config.nick || 'N/A'}</p>
  `;
  
  if (node.data && node.data.options) {
    html += `
        <div class="node-options">
          <h4>Options:</h4>
          <ul>
    `;
    
    node.data.options.forEach((option, index) => {
      html += `
            <li>${option.title} (${option.value})</li>
      `;
    });
    
    html += `
          </ul>
        </div>
    `;
  } else if (node.data && node.data.value) {
    html += `
        <div class="node-value">
          <h4>Value:</h4>
          <p>${JSON.stringify(node.data.value)}</p>
        </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

/**
 * 生成所有可视化模块的CSS
 * @returns {string} - 生成的CSS
 */
function generateVisualizationCSS() {
  let css = `
    .node-visualization {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .node-visualization h3 {
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
  
  // 添加box可视化的CSS
  css += boxVisualization.generateBoxVisualizationCSS();
  
  return css;
}

module.exports = {
  generateNodeVisualization,
  generateVisualizationCSS,
  box: boxVisualization
};
