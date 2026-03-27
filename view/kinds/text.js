/**
 * Text 组件渲染器
 */

/**
 * 渲染 Text 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderText(node) {
  const config = node.config;
  const value = node.data && node.data.value ? node.data.value : config.value || '';
  const title = config.title || config.nick || '';

  if (title) {
    return `
      <div class="text-visualization">
        <label class="text-label">${title}</label>
        <div class="text-content">${value}</div>
      </div>
    `;
  } else {
    return `
      <div class="text-visualization">
        <div class="text-content">${value}</div>
      </div>
    `;
  }
}

module.exports = {
  renderText
};
