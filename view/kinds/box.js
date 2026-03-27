/**
 * Box 组件渲染器
 */
const { parseTemplate } = require('../utils/common.js');

/**
 * 渲染 Box 组件
 * @param {Object} node - 节点结构
 * @returns {string} - 渲染后的 HTML
 */
function renderBox(node) {
  const config = node.config;
  const title = config.title || 'Box';
  const data = node.data.data || config.data || [];
  const template = config.template || '';
  const tapSet = config.tapSet || {};

  let html = `
    <div class="box-visualization">
      <div class="box-header">
        <h3>${title} dataset</h3>
      </div>
      <div class="box-content">
  `;

  if (data && Array.isArray(data)) {
    data.forEach((item, index) => {
      const parsedContent = parseTemplate(template, item);
      let clickHandler = '';
      
      // 处理 tapSet 配置
      if (tapSet.setTimeout) {
        const action = tapSet.setTimeout.action || '';
        const delay = tapSet.setTimeout.delay || 0;
        // 替换动作中的变量
        let parsedAction = action;
        for (const key in item) {
          parsedAction = parsedAction.replace(new RegExp(key, 'g'), item[key]);
        }
        clickHandler = `onclick="setTimeout(function() { ${parsedAction} }, ${delay})"`;
      } else if (tapSet.navigateTo) {
        const path = tapSet.navigateTo.path || '';
        let params = '';
        if (tapSet.navigateTo.paramMap) {
          const paramMap = tapSet.navigateTo.paramMap;
          const paramArray = [];
          for (const key in paramMap) {
            const value = item[paramMap[key]];
            if (value !== undefined) {
              paramArray.push(`${key}=${encodeURIComponent(value)}`);
            }
          }
          if (paramArray.length > 0) {
            params = '?' + paramArray.join('&');
          }
        }
        clickHandler = `onclick="if (window.parent && window.parent !== window) { window.parent.location.href='${path}${params}' } else { window.location.href='${path}${params}' }"`;
      }
      
      html += `
        <x ${index}>
          <div class="box-data-item" ${clickHandler} style="cursor: ${tapSet ? 'pointer' : 'default'}">
            ${parsedContent}
          </div>
        </x>
      `;
    });
  } else {
    html += `
      <div class="no-data">
        No data available
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

module.exports = {
  renderBox
};
