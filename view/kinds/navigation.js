/**
 * Navigation 组件渲染器
 */

/**
 * 渲染 Navigation 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderNavigation(node) {
  const config = node.config;
  const items = config.items || [];

  let html = '<div class="navigation-visualization"><ul>';
  items.forEach((item) => {
    html += `<li>${item.label || item.title || 'Item'}</li>`;
  });
  html += '</ul></div>';

  return html;
}

module.exports = {
  renderNavigation
};
