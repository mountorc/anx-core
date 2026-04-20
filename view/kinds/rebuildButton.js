function renderRebuildButton(node) {
  const config = node.config;
  const label = config.title || config.label || '重建 Tile';
  const buttonId = 'rebuild-btn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const cardKey = node.cardKey;
  
  const nodeJson = JSON.stringify(node).replace(/"/g, '&quot;');
  
  let html = `
    <div class="rebuild-button-visualization">
      <button id="${buttonId}" onclick="rebuildTileTap(this);" class="anx-button rebuild-btn" data-card-key="${cardKey}" data-node="${nodeJson}">
        <span class="button-icon">🔄</span>
        <span class="button-text">${label}</span>
      </button>
    </div>
  `;
  
  return html;
}

module.exports = { renderRebuildButton };
