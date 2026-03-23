/**
 * 处理Box组件的ANX配置
 */

const { parseTemplateForMarkdown } = require('../utils/template.js');

/**
 * 转换Box组件为Markdown
 * @param {Object} component - Box组件
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
async function convertBoxToMarkdown(component) {
  const { title, data, html, template } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  if (data && data.length > 0) {
    for (const item of data) {
      const templateContent = template || html;
      if (templateContent) {
        content += `${parseTemplateForMarkdown(templateContent, item)}\n\n`;
      }
    }
  } else if (html || template) {
    const templateContent = template || html;
    content += `${parseTemplateForMarkdown(templateContent, component)}\n\n`;
  }

  return content;
}

module.exports = {
  convertBoxToMarkdown
};
