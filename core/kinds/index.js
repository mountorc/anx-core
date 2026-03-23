/**
 * 导出所有组件转换函数
 */

const { convertBoxToMarkdown } = require('./box.js');
const { convertBoardToMarkdown } = require('./board.js');
const { convertFormToMarkdown } = require('./form.js');
const { convertOptionsToMarkdown } = require('./options.js');
const { convertNavigationToMarkdown } = require('./navigation.js');

module.exports = {
  convertBoxToMarkdown,
  convertBoardToMarkdown,
  convertFormToMarkdown,
  convertOptionsToMarkdown,
  convertNavigationToMarkdown
};
