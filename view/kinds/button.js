/**
 * Button 组件渲染器
 */

/**
 * 渲染 Button 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderButton(node) {
  const config = node.config;
  const label = config.label || 'Button';

  return `
    <div class="button-visualization">
      <button>${label}</button>
    </div>
  `;
}

module.exports = {
  renderButton
};
