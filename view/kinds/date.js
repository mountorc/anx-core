/**
 * Date 组件渲染器
 */

/**
 * 渲染 Date 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderDate(node) {
  const config = node.config;
  const placeholder = config.placeholder || '';
  const value = node.data.value || config.value || '';
  const nick = config.nick || '';
  const cardKey = node.cardKey;
  const required = config.required || false;
  const requiredMark = required ? '<span class="required-mark">*</span>' : '';

  return `
    <div class="date-visualization">
      <div class="date-label">${nick || 'Date'}${requiredMark}</div>
      <input 
        type="date" 
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
  renderDate
};
