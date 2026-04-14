function renderButton(node) {
  const config = node.config;
  const label = config.title || config.label || 'Button';
  const buttonId = 'button-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const tapSet = node.tapSet || node.config.tapSet || {};
  const cardKey = node.cardKey;
  
  // 将 tapSet、label 和 node 转换为 JSON 字符串，用于存储在 data- 属性中
  const tapSetJson = JSON.stringify(tapSet).replace(/"/g, '&quot;');
  const labelJson = JSON.stringify(label).replace(/"/g, '&quot;');
  const nodeJson = JSON.stringify(node).replace(/"/g, '&quot;');
  
  let html = `
    <div class="button-visualization">
      <button id="${buttonId}" onclick="buttonTap(this);" class="anx-button" data-card-key="${cardKey}" data-tap-set="${tapSetJson}" data-label="${labelJson}" data-node="${nodeJson}">
        <span class="button-text">${label}</span>
      </button>
    </div>
  `;
  
  return html;
}

module.exports = { renderButton };