/**
 * 处理Form组件的ANX配置
 */

/**
 * 转换Form组件为Markup
 * @param {Object} component - Form组件
 * @returns {Promise<string>} - 转换后的Markup内容
 */
async function convertFormToMarkup(component) {
  const { title, kinds, data } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  if (kinds && Array.isArray(kinds)) {
    // 动态导入以避免循环依赖
    const { anxToMarkup } = await import('../anx-to-markup.js');
    for (const field of kinds) {
      content += `${await anxToMarkup(field)}\n\n`;
    }
  }

  return content;
}

module.exports = {
  convertFormToMarkup
};