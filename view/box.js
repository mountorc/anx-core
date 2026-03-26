/**
 * Box节点可视化处理模块
 */

/**
 * 解析模板，替换变量
 * @param {string} template - 模板字符串
 * @param {Object} data - 数据对象
 * @returns {string} - 解析后的模板
 */
function parseTemplate(template, data) {
  if (!template) return '';
  
  let parsedTemplate = template;
  
  // 替换双大括号变量
  const doubleBracesRegex = /\{\{([^{}]+)\}\}/g;
  parsedTemplate = parsedTemplate.replace(doubleBracesRegex, (match, variable) => {
    const value = getPropertyValue(data, variable.trim());
    return value !== undefined ? value : match;
  });
  
  // 替换美元大括号变量
  const dollarBracesRegex = /\$\{([^{}]+)\}/g;
  parsedTemplate = parsedTemplate.replace(dollarBracesRegex, (match, variable) => {
    const value = getPropertyValue(data, variable.trim());
    return value !== undefined ? value : match;
  });
  
  // 替换单大括号变量
  const singleBracesRegex = /\{([^{}]+)\}/g;
  parsedTemplate = parsedTemplate.replace(singleBracesRegex, (match, variable) => {
    const value = getPropertyValue(data, variable.trim());
    return value !== undefined ? value : match;
  });
  
  return parsedTemplate;
}

/**
 * 获取对象的属性值
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径，如 "user.name"
 * @returns {*} - 属性值
 */
function getPropertyValue(obj, path) {
  if (!obj || typeof obj !== 'object') return undefined;

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value[key] === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * 生成Box节点的可视化HTML
 * @param {Object} node - Box节点结构
 * @returns {string} - 生成的HTML
 */
function generateBoxVisualization(node) {
  if (!node || node.config.kind !== 'box') {
    return '';
  }
  
  let html = `
    <div class="box-visualization">
      <div class="box-header">
        <h3>${node.config.title || 'Box'} dataset</h3>
      </div>
      <div class="box-content">
  `;
  
  if (node.config.data && Array.isArray(node.config.data)) {
    node.config.data.forEach((item, index) => {
      const parsedContent = parseTemplate(node.config.template, item);
      html += `
        <x ${index}>
          <div class="box-data-item">
            ${parsedContent}
          </div>
        </x>
      `;
    });
  } else {
    html += `
      <div class="no-data">
        No data available
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
 * 生成Box节点的可视化CSS
 * @returns {string} - 生成的CSS
 */
function generateBoxVisualizationCSS() {
  return `
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
  `;
}

module.exports = {
  generateBoxVisualization,
  generateBoxVisualizationCSS,
  parseTemplate,
  getPropertyValue
};
