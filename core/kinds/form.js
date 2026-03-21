/**
 * 处理Form组件的ANX配置
 */

import { anxToMarkdown } from '../anx-to-markdown.js';

/**
 * 转换Form组件为Markdown
 * @param {Object} component - Form组件
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
export async function convertFormToMarkdown(component) {
  const { title, kinds } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  if (kinds && Array.isArray(kinds)) {
    for (const field of kinds) {
      content += `${await anxToMarkdown(field)}\n\n`;
    }
  }

  return content;
}
