/**
 * Checkbox 组件渲染器
 */

/**
 * 渲染 Checkbox 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderCheckbox(node) {
  const config = node.config;
  const title = config.title || 'Checkbox';
  const options = config.options || [];
  const value = node.data.value || config.value || [];
  const cardKey = node.cardKey;

  let html = `
    <div class="checkbox-visualization">
      <div class="checkbox-title">${title}</div>
  `;

  options.forEach((option, index) => {
    const isChecked = Array.isArray(value) && value.includes(option.value);
    html += `
      <div class="checkbox-item">
        <input 
          type="checkbox" 
          id="checkbox_${cardKey}_${index}" 
          value="${option.value}" 
          ${isChecked ? 'checked' : ''}
          data-card-key="${cardKey}"
          data-field="value"
          data-option-value="${option.value}"
          onchange="window.updateCheckboxData(this)"
        >
        <label for="checkbox_${cardKey}_${index}">${option.title}</label>
      </div>
    `;
  });

  html += '</div>';

  return html;
}

module.exports = {
  renderCheckbox
};
