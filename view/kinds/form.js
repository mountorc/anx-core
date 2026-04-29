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
        tapSet: subConfig.tapSet,
        editState: subConfig.editState || 2
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

  // 渲染结果区域
  const resultSet = config.resultSet;
  const resultData = node.data && node.data.result ? node.data.result : null;
  const processing = node.data && node.data.processing ? node.data.processing : false;
  let resultContent = '';
  
  if (resultSet) {
    resultContent = renderResultArea(resultData, resultSet, renderNode, processing);
  }

  // 根据 showType 决定布局
  const showType = resultSet && resultSet.showType || 'bottom';
  
  if (showType === 'right') {
    return `
      <div class="form-visualization form-with-result-right">
        <div class="form-title">${title}</div>
        <div class="form-main">
          <div class="form-content">${content}</div>
          <div class="form-result">${resultContent}</div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="form-visualization">
        <div class="form-title">${title}</div>
        <div class="form-content">${content}</div>
        ${resultContent ? `<div class="form-result-bottom">${resultContent}</div>` : ''}
      </div>
    `;
  }
}

/**
 * 渲染结果区域
 * @param {any} resultData - 结果数据
 * @param {Object} resultSet - resultSet配置
 * @param {Function} renderNode - 渲染子节点的函数
 * @param {boolean} processing - 是否正在处理中
 * @returns {string} - 渲染后的HTML
 */
function renderResultArea(resultData, resultSet, renderNode, processing) {
  // 如果正在处理中，显示加载状态
  if (processing) {
    return `
      <div class="result-area processing">
        <div class="result-title">结果区域</div>
        <div class="result-content">
          <div class="processing-indicator">
            <div class="spinner"></div>
            <div class="processing-text">处理中...</div>
          </div>
        </div>
      </div>
    `;
  }
  
  if (!resultData) {
    return `
      <div class="result-area">
        <div class="result-title">
          结果区域
          <button class="refresh-button" onclick="window.dispatchEvent(new CustomEvent('refreshForm', {detail: {}}))">
            ↻
          </button>
        </div>
        <div class="result-content">
          <div class="result-placeholder">结果将显示在这里</div>
        </div>
      </div>
    `;
  }
  
  // 如果resultSet定义了kind和items，渲染自定义组件
  if (resultSet && resultSet.kind && resultSet.items && resultSet.items.length > 0) {
    const boardConfig = {
      kind: resultSet.kind,
      items: resultSet.items.map(item => {
        // 如果item有nick，尝试从resultData中获取对应的值
        if (item.nick && resultData[item.nick] !== undefined) {
          return {
            ...item,
            value: resultData[item.nick]
          };
        }
        return item;
      })
    };
    
    const boardNode = {
      config: boardConfig,
      data: { 
        result: resultData[0],
        resultData:resultData[0]
      },
      nodes: [],
      tapSet: null
    };
    
    return `
      <div class="result-area">
        <div class="result-title">
          结果区域
          <button class="refresh-button" onclick="window.dispatchEvent(new CustomEvent('refreshForm', {detail: {}}))">
            ↻
          </button>
        </div>
        <div class="result-content">
          ${renderNode(boardNode)}
        </div>
      </div>
    `;
  }
  
  // 如果是图片URL，显示图片
  if (typeof resultData === 'string' && (resultData.startsWith('http://') || resultData.startsWith('https://'))) {
    return `
      <div class="result-area">
        <div class="result-title">
          结果区域
          <button class="refresh-button" onclick="window.dispatchEvent(new CustomEvent('refreshForm', {detail: {}}))">
            ↻
          </button>
        </div>
        <div class="result-content">
          <img src="${resultData}" alt="Result" class="result-image" />
        </div>
      </div>
    `;
  }
  
  // 如果是对象且包含图片URL字段
  if (typeof resultData === 'object') {
    // 尝试找到图片URL字段
    const imageFields = ['url', 'image', 'imageUrl', 'result', 'data'];
    let imageUrl = null;
    for (const field of imageFields) {
      if (resultData[field] && typeof resultData[field] === 'string' && 
          (resultData[field].startsWith('http://') || resultData[field].startsWith('https://'))) {
        imageUrl = resultData[field];
        break;
      }
    }
    
    if (imageUrl) {
      return `
        <div class="result-area">
          <div class="result-title">
            结果区域
            <button class="refresh-button" onclick="window.dispatchEvent(new CustomEvent('refreshForm', {detail: {}}))">
              ↻
            </button>
          </div>
          <div class="result-content">
            <img src="${imageUrl}" alt="Result" class="result-image" />
          </div>
        </div>
      `;
    }
  }
  
  // 默认显示JSON格式的结果
  return `
    <div class="result-area">
      <div class="result-title">
        结果区域
        <button class="refresh-button" onclick="window.dispatchEvent(new CustomEvent('refreshForm', {detail: {}}))">
          ↻
        </button>
      </div>
      <div class="result-content">
        <pre class="result-json">${JSON.stringify(resultData, null, 2)}</pre>
      </div>
    </div>
  `;
}

module.exports = {
  renderForm
};
