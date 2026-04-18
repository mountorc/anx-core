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
        nodes: [],
        tapSet: subConfig.tapSet
      };
      content += renderNode(childNode);
    });
  }

  // 如果配置了 submitSet，自动生成提交按钮
  if (config.submitSet && config.submitSet.url) {
    const submitButtonConfig = {
      kind: 'button',
      type: 'string',
      nick: 'submit',
      title: config.submitSet.title || '提交',
      tapSet: {
        requestSet: {
          method: config.submitSet.method || 'POST',
          url: config.submitSet.url,
          paramMap: {}
        }
      }
    };
    
    // 自动收集 form 中的所有字段作为参数
    if (config.kinds && config.kinds.length > 0) {
      config.kinds.forEach((subConfig) => {
        if (subConfig.nick && subConfig.nick !== 'submit') {
          submitButtonConfig.tapSet.requestSet.paramMap[subConfig.nick] = subConfig.nick;
        }
      });
    }
    
    const submitNode = {
      config: submitButtonConfig,
      data: { value: '' },
      nodes: [],
      tapSet: submitButtonConfig.tapSet
    };
    content += renderNode(submitNode);
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
