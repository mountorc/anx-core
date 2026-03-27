/**
 * Form 组件渲染器
 */

/**
 * 渲染 Form 组件
 * @param {Object} node - 节点结构
 * @param {Function} renderNode - 渲染子节点的函数
 * @returns {string} - 渲染后的 HTML
 */
function renderForm(node, renderNode) {
  const config = node.config;
  const title = config.title || 'Form';
  let content = '';

  // 获取form的数据值，用于传递给子节点
  const formData = node.data && node.data.value ? node.data.value : {};

  if (node.nodes && node.nodes.length > 0) {
    node.nodes.forEach((childNode) => {
      content += renderNode(childNode);
    });
  } else if (config.kinds && config.kinds.length > 0) {
    config.kinds.forEach((subConfig) => {
      // 获取子节点的nick
      const childNick = subConfig.nick;
      
      // 从formData中获取子节点的值
      let childValue = '';
      if (childNick && formData[childNick] !== undefined) {
        childValue = formData[childNick];
      } else if (subConfig.value !== undefined) {
        childValue = subConfig.value;
      }
      
      const childNode = {
        config: subConfig,
        data: { value: childValue },
        nodes: []
      };
      content += renderNode(childNode);
    });
  }

  return `
    <div class="form-visualization">
      <div class="form-title">${title}</div>
      <div class="form-content">${content}</div>
    </div>
  `;
}

module.exports = {
  renderForm
};
