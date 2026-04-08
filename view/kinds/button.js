function renderButton(node) {
  const config = node.config;
  const label = config.title || config.label || 'Button';
  const buttonId = 'button-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const tapSet = node.tapSet || node.config.tapSet || {};
  
  // 将 tapSet 转换为 JSON 字符串，确保双引号被正确转义
  const tapSetJson = JSON.stringify(tapSet).replace(/"/g, '&quot;').replace(/\\n/g, '\\\\n');
  
  let html = '';
  html += '<div class="button-visualization">';
  // 使用内联 onclick 事件，直接弹窗显示 tapSet 配置
  html += '  <button id="' + buttonId + '" class="anx-button" onclick="alert(JSON.stringify(' + tapSetJson + ', null, 2));">';
  html += '    <span class="button-text">' + label + '</span>';
  html += '  </button>';
  html += '</div>';
  
  return html;
}

module.exports = { renderButton };