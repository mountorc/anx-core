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
  const value = config.value || '';

  return `<div class="text-visualization">${value}</div>`;
}

module.exports = {
  renderText
};
