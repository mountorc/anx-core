/**
 * Input 组件渲染器
 */

/**
 * 渲染 Input 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderInput(node) {
  const config = node.config;
  const placeholder = config.placeholder || '';
  const value = node.data.value || config.value || '';
  const nick = config.nick || '';
  const cardKey = node.cardKey;

  return `
    <div class="input-visualization">
      <div class="input-label">${nick || 'Input'}</div>
      <input 
        type="text" 
        placeholder="${placeholder}" 
        value="${value}" 
        ${nick ? `name="${nick}"` : ''}
        data-card-key="${cardKey}"
        data-field="value"
        onchange="window.updateNodeData(this)"
      >
    </div>
  `;
}

module.exports = {
  renderInput
};
