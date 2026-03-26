/**
 * Textarea 组件渲染器
 */

/**
 * 渲染 Textarea 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderTextarea(node) {
  const config = node.config;
  const placeholder = config.placeholder || '';
  const value = node.data.value || config.value || '';
  const nick = config.nick || '';
  const rows = config.rows || 4;
  const cardKey = node.cardKey;

  return `
    <div class="textarea-visualization">
      <div class="textarea-label">${nick || 'Textarea'}</div>
      <textarea 
        placeholder="${placeholder}" 
        rows="${rows}" 
        ${nick ? `name="${nick}"` : ''}
        data-card-key="${cardKey}"
        data-field="value"
        onchange="window.updateNodeData(this)"
      >${value}</textarea>
    </div>
  `;
}

module.exports = {
  renderTextarea
};
