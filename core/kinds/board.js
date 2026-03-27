/**
 * 处理Board组件的ANX配置
 */

/**
 * 转换Board组件为Markdown
 * @param {Object} component - Board组件
 * @param {Function} convertComponent - 组件转换函数
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
async function convertBoardToMarkdown(component, convertComponent) {
  const { kinds } = component;
  if (!kinds || !Array.isArray(kinds)) {
    return '';
  }

  const results = await Promise.all(kinds.map(item => convertComponent(item)));
  return results.join('\n\n');
}

module.exports = {
  convertBoardToMarkdown
};
