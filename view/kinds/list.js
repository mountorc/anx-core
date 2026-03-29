/**
 * List 组件渲染器
 */

/**
 * 渲染 List 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderList(node) {
  const config = node.config;
  const title = config.title || '';
  const itemList = config.itemList || [];
  const data = node.data && node.data.value ? node.data.value : (config.data || []);

  let html = '<div class="list-visualization">';

  if (title) {
    html += `<div class="list-title">${title}</div>`;
  }

  if (itemList.length > 0 && data.length > 0) {
    html += '<table class="list-table">';
    
    // 表头
    html += '<thead><tr>';
    for (const item of itemList) {
      html += `<th>${item.title || item.nick || ''}</th>`;
    }
    html += '</tr></thead>';
    
    // 表体
    html += '<tbody>';
    for (const row of data) {
      html += '<tr>';
      for (const item of itemList) {
        const value = row[item.nick] !== undefined ? row[item.nick] : '';
        html += `<td>${value}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    
    html += '</table>';
  } else {
    html += '<div class="list-empty">No data</div>';
  }

  html += '</div>';

  return html;
}

module.exports = {
  renderList
};
