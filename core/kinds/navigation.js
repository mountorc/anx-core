/**
 * 处理Navigation组件的ANX配置
 */

/**
 * 转换Navigation组件为Markdown
 * @param {Object} component - Navigation组件
 * @returns {string} - 转换后的Markdown内容
 */
function convertNavigationToMarkdown(component) {
  const { title, items } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  if (items && Array.isArray(items)) {
    content += '\n';
    items.forEach(item => {
      if (item.title && item.url) {
        content += `- [${item.title}](${item.url})\n`;
      }
    });
    content += '\n';
  }

  return content;
}

module.exports = {
  convertNavigationToMarkdown
};
