/**
 * Table 组件渲染器
 */

/**
 * 渲染 Table 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderTable(node) {
  const config = node.config;
  const title = config.title || 'Table';
  const data = node.data.data || config.data || [];
  const titles = config.titles || [];

  let html = `
    <div class="table-visualization">
      <div class="table-header">
        <h3>${title}</h3>
      </div>
      <div class="table-content">
  `;

  if (data && Array.isArray(data) && data.length > 0) {
    html += '<table class="anx-table"><thead><tr>';
    titles.forEach((titleItem) => {
      html += `<th>${titleItem.title}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach((row) => {
      html += '<tr>';
      titles.forEach((titleItem) => {
        html += `<td>${row[titleItem.nick] || ''}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
  } else {
    html += `
      <div class="no-data">
        No data available
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
  renderTable
};
