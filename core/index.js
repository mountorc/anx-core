/**
 * Core utilities for ANX format processing
 */

// 导入转换功能（从新的 trans 模块）
const { anxToNodes, nodesToMarkup } = require('./trans/index.js');

// 导入旧的 anxToMarkup（已停用）
const { anxToMarkup } = require('./anx-to-markup.js');

// 导入CLI工具
const { anxCLI, parseArgs } = require('./cli/index.js');

// 导出所有功能
module.exports = {
  anxToMarkup,      // 已停用，请使用 nodesToMarkup
  anxToNodes,
  nodesToMarkup,    // 新的推荐方式
  anxCLI,
  parseArgs
};