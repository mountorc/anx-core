/**
 * Core utilities for ANX format processing
 */

// 导入ANX转Markup功能
const { anxToMarkup, anxToNodes } = require('./anx-to-markup.js');

// 导入CLI工具
const { anxCLI, parseArgs } = require('./cli/index.js');

// 导出所有功能
module.exports = {
  anxToMarkup,
  anxToNodes,
  anxCLI,
  parseArgs
};
