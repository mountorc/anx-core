/**
 * 组件渲染器
 */
const { renderBox } = require('./kinds/box.js');
const { renderBoard } = require('./kinds/board.js');
const { renderTable } = require('./kinds/table.js');
const { renderText } = require('./kinds/text.js');
const { renderInput } = require('./kinds/input.js');
const { renderTextarea } = require('./kinds/textarea.js');
const { renderButton } = require('./kinds/button.js');
const { renderForm } = require('./kinds/form.js');
const { renderNavigation } = require('./kinds/navigation.js');
const { renderDate } = require('./kinds/date.js');
const { renderOptions } = require('./kinds/options.js');
const { renderCheckbox } = require('./kinds/checkbox.js');
const { renderList } = require('./kinds/list.js');
const { renderDefault } = require('./kinds/default.js');

/**
 * 渲染节点
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的HTML
 */
function renderNode(node) {
  if (!node || !node.config || !node.config.kind) {
    return '<div class="anx-error">Invalid node</div>';
  }

  switch (node.config.kind) {
    case 'box':
      return renderBox(node);
    case 'board':
      return renderBoard(node, renderNode);
    case 'table':
      return renderTable(node);
    case 'text':
      return renderText(node);
    case 'input':
      return renderInput(node);
    case 'textarea':
      return renderTextarea(node);
    case 'button':
      return renderButton(node);
    case 'form':
      return renderForm(node, renderNode);
    case 'navigation':
      return renderNavigation(node);
    case 'date':
      return renderDate(node);
    case 'options':
      return renderOptions(node);
    case 'checkbox':
      return renderCheckbox(node);
    case 'list':
      return renderList(node);
    default:
      return renderDefault(node);
  }
}

module.exports = {
  renderNode
};
