/**
 * Board 组件渲染器
 */
const { autoVar } = require('../../core/utils/autoVar.js');

/**
 * 渲染 Board 组件
 * @param {Object} node - 节点结构
 * @param {Function} renderNode - 渲染子节点的函数
 * @returns {string} - 渲染后的 HTML
 */
function renderBoard(node, renderNode) {
  const config = node.config;
  // 兼容 items 和 kinds 两种配置方式
  const items = config.items || config.kinds || [];
  // 获取父节点的数据（用于通过 nick 获取值）
  const parentData = node.data && node.data.value ? node.data.value : (node.data || {});
  let content = '';

  if (node.nodes && node.nodes.length > 0) {
    node.nodes.forEach((childNode) => {
      content += renderNode(childNode);
    });
  } else if (items.length > 0) {
    items.forEach((subConfig) => {
      // 创建子节点的数据
      const childData = {};
      
      // 如果有 nick，尝试从父节点数据中获取对应的值
      if(subConfig.nick){
        childData.value = autoVar(subConfig.nick, parentData, {cardKey: node.cardKey});
      }
      // 如果没有 nick 但有 text，将 text 作为值（用于显示静态文本）
      else if (subConfig.text) {
        childData.value = subConfig.text;
      }
      // 如果有 value 配置，使用配置的值
      else if (subConfig.value !== undefined) {
        childData.value = subConfig.value;
      }
      
      const childNode = {
        config: subConfig,
        data: childData,
        nodes: []
      };
      content += renderNode(childNode);
    });
  }

  return `<div class="board-visualization">${content}</div>`;
}

module.exports = {
  renderBoard
};
