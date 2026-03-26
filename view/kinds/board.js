/**
 * Board 组件渲染器
 */

/**
 * 渲染 Board 组件
 * @param {Object} node - 节点结构
 * @param {Function} renderNode - 渲染子节点的函数
 * @returns {string} - 渲染后的 HTML
 */
function renderBoard(node, renderNode) {
  const config = node.config;
  const kinds = config.kinds || [];
  let content = '';

  if (node.nodes && node.nodes.length > 0) {
    node.nodes.forEach((childNode) => {
      content += renderNode(childNode);
    });
  } else if (kinds.length > 0) {
    kinds.forEach((subConfig) => {
      const childNode = {
        config: subConfig,
        data: {},
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
