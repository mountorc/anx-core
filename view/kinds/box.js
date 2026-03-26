/**
 * Box 组件渲染器
 */
const { parseTemplate } = require('../utils/common.js');

/**
 * 渲染 Box 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderBox(node) {
  const config = node.config;
  const title = config.title || 'Box';
  const data = node.data.data || config.data || [];
  const template = config.template || '';

  let html = `
    <div class="box-visualization">
      <div class="box-header">
        <h3>${title} dataset</h3>
      </div>
      <div class="box-content">
  `;

  if (data && Array.isArray(data)) {
    data.forEach((item, index) => {
      const parsedContent = parseTemplate(template, item);
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

module.exports = {
  renderBox
};
