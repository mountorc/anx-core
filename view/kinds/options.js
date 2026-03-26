/**
 * Options 组件渲染器
 */

/**
 * 渲染 Options 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderOptions(node) {
  const config = node.config;
  const title = config.title || 'Options';
  const options = node.data.options || config.options || [];
  const value = node.data.value || config.value || '';
  const cardKey = node.cardKey;

  let html = `
    <div class="options-visualization">
      <div class="options-title">${title}</div>
      <select 
        data-card-key="${cardKey}"
        data-field="value"
        onchange="window.updateNodeData(this)"
      >
  `;

  options.forEach((option) => {
    const isSelected = option.value === value;
    html += `<option value="${option.value}" ${isSelected ? 'selected' : ''}>${option.title}</option>`;
  });

  html += `
      </select>
    </div>
  `;

  return html;
}

module.exports = {
  renderOptions
};
