/**
 * 处理Board组件的ANX配置
 */

import { anxToMarkdown } from '../anx-to-markdown.js';

/**
 * 转换Board组件为Markdown
 * @param {Object} component - Board组件
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
export async function convertBoardToMarkdown(component) {
  const { kinds } = component;
  if (!kinds || !Array.isArray(kinds)) {
    return '';
  }

  const results = await Promise.all(kinds.map(item => anxToMarkdown(item)));
  return results.join('\n\n');
}
