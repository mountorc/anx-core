/**
 * 处理Form组件的ANX配置
 */

/**
 * 转换Form组件为Markdown
 * @param {Object} component - Form组件
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
async function convertFormToMarkdown(component) {
  const { title, kinds, data } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  if (kinds && Array.isArray(kinds)) {
    // 动态导入以避免循环依赖
    const { anxToMarkdown } = await import('../anx-to-markdown.js');
    for (const field of kinds) {
      content += `${await anxToMarkdown(field)}\n\n`;
    }
  }

  return content;
}

module.exports = {
  convertFormToMarkdown
};
