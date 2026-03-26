/**
 * 导出所有组件转换函数
 */

const { convertBoxToMarkdown } = require('./box.js');
const { convertBoardToMarkdown } = require('./board.js');
const { convertFormToMarkdown } = require('./form.js');
const { convertOptionsToMarkdown } = require('./options.js');
const { convertNavigationToMarkdown } = require('./navigation.js');
const { convertTableToMarkdown } = require('./table.js');

module.exports = {
  convertBoxToMarkdown,
  convertBoardToMarkdown,
  convertFormToMarkdown,
  convertOptionsToMarkdown,
  convertNavigationToMarkdown,
  convertTableToMarkdown
};
