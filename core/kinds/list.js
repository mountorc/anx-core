/**
 * 处理List组件的ANX配置
 */

/**
 * 转换List组件为Markdown
 * @param {Object} component - List组件
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
async function convertListToMarkdown(component) {
  const { title, itemList, data } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  // 获取列表数据
  const listData = data || [];

  if (listData && Array.isArray(listData) && listData.length > 0) {
    // 生成表头
    if (itemList && Array.isArray(itemList)) {
      const headers = itemList.map(item => item.title || item.nick || '');
      content += `| ${headers.join(' | ')} |\n`;
      content += `| ${headers.map(() => '---').join(' | ')} |\n`;

      // 生成数据行
      for (const row of listData) {
        const cells = itemList.map(item => {
          const value = row[item.nick];
          return value !== undefined ? value : '';
        });
        content += `| ${cells.join(' | ')} |\n`;
      }
    }
  } else {
    content += '*No data*\n';
  }

  return content;
}

module.exports = {
  convertListToMarkdown
};
