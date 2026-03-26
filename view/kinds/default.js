/**
 * Default 组件渲染器
 */

/**
 * 渲染默认节点
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的HTML
 */
function renderDefault(node) {
  const config = node.config;

  let html = `
    <div class="default-visualization">
      <h3>${config.kind || 'Node'}</h3>
      <div class="node-info">
        <p><strong>Card Key:</strong> ${node.cardKey}</p>
        <p><strong>Title:</strong> ${config.title || 'N/A'}</p>
        <p><strong>Nick:</strong> ${config.nick || 'N/A'}</p>
  `;

  if (node.data && node.data.options) {
    html += `
      <div class="node-options">
        <h4>Options:</h4>
        <ul>
    `;

    node.data.options.forEach((option) => {
      html += `<li>${option.title} (${option.value})</li>`;
    });

    html += `
        </ul>
      </div>
    `;
  } else if (node.data && node.data.value) {
    html += `
      <div class="node-value">
        <h4>Value:</h4>
        <p>${JSON.stringify(node.data.value)}</p>
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
  renderDefault
};
