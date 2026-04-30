/**
 * Core utilities for ANX format processing
 */

// 导入转换功能（从 trans 模块）
const { anxToNodes, nodesToMarkup } = require('./trans/index.js');

// 导入CLI工具
const { anxCLI, parseArgs } = require('./cli/index.js');

// 导出所有功能
module.exports = {
  anxToNodes,
  nodesToMarkup,
  anxCLI,
  parseArgs
};