/**
 * Core utilities for ANX format processing
 */

// 导入ANX转Markdown功能
const { anxToMarkdown, anxToNodes } = require('./anx-to-markdown.js');

// 导入CLI工具
const { anxCLI, parseArgs } = require('./cli/index.js');

// 导出所有功能
module.exports = {
  anxToMarkdown,
  anxToNodes,
  anxCLI,
  parseArgs
};
