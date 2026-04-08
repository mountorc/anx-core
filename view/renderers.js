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
const { renderFile } = require('./kinds/file.js');

/**
 * 渲染节点
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的HTML
 */
function renderNode(node) {
  if (!node || !node.config || !node.config.kind) {
    return '<div class="anx-error">Invalid node</div>';
  }

  let renderedContent = '';
  
  switch (node.config.kind) {
    case 'box':
      renderedContent = renderBox(node);
      break;
    case 'board':
      renderedContent = renderBoard(node, renderNode);
      break;
    case 'table':
      renderedContent = renderTable(node);
      break;
    case 'text':
      renderedContent = renderText(node);
      break;
    case 'input':
      renderedContent = renderInput(node);
      break;
    case 'textarea':
      renderedContent = renderTextarea(node);
      break;
    case 'button':
      renderedContent = renderButton(node);
      break;
    case 'form':
      renderedContent = renderForm(node, renderNode);
      break;
    case 'navigation':
      renderedContent = renderNavigation(node);
      break;
    case 'date':
      renderedContent = renderDate(node);
      break;
    case 'options':
      renderedContent = renderOptions(node);
      break;
    case 'checkbox':
      renderedContent = renderCheckbox(node);
      break;
    case 'list':
      renderedContent = renderList(node);
      break;
    case 'file':
    case 'image':
    case 'images':
      renderedContent = renderFile(node);
      break;
    default:
      renderedContent = renderDefault(node);
      break;
  }
  

  
  return renderedContent;
}

module.exports = {
  renderNode
};
