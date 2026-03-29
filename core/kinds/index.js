/**
 * 导出所有组件转换函数
 */

const { convertBoxToMarkup } = require('./box.js');
const { convertBoardToMarkup } = require('./board.js');
const { convertFormToMarkup } = require('./form.js');
const { convertOptionsToMarkup } = require('./options.js');
const { convertNavigationToMarkup } = require('./navigation.js');
const { convertTableToMarkup } = require('./table.js');
const { convertListToMarkup } = require('./list.js');

module.exports = {
  convertBoxToMarkup,
  convertBoardToMarkup,
  convertFormToMarkup,
  convertOptionsToMarkup,
  convertNavigationToMarkup,
  convertTableToMarkup,
  convertListToMarkup
};
