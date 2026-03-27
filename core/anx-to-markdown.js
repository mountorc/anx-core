/**
 * 将ANX格式内容转换为Markdown格式
 * @param {Object} anxContent - ANX格式的内容
 * @returns {Promise<string>} - 转换后的Markdown格式内容
 */
const { fetchDataset } = require('./utils/dataset.js');
const { parseTemplateForMarkdown } = require('./utils/template.js');
const { 
  convertBoxToMarkdown, 
  convertBoardToMarkdown, 
  convertFormToMarkdown, 
  convertOptionsToMarkdown, 
  convertNavigationToMarkdown,
  convertTableToMarkdown 
} = require('./kinds/index.js');
async function anxToMarkdown(anxContent) {
  if (!anxContent || typeof anxContent !== 'object') {
    return '';
  }

  // 处理ANX组件
  if (anxContent.kind) {
    return await convertComponentToMarkdown(anxContent);
  }

  // 处理ANX组件数组
  if (Array.isArray(anxContent)) {
    const results = await Promise.all(anxContent.map(item => anxToMarkdown(item)));
    return results.join('\n\n');
  }

  return '';
}

/**
 * 生成唯一的cardKey
 * @returns {string} - 唯一的cardKey
 */
function generateCardKey() {
  return 'card_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

/**
 * 将ANX格式内容转换为节点结构
 * @param {Object} anxContent - ANX格式的内容
 * @returns {Object} - 包含config、data、logs和nodes属性的对象结构
 */
function anxToNodes(anxContent) {
  const result = {
    cardKey: generateCardKey(),
    config: {},
    data: {},
    logs: [],
    nodes: []
  };

  if (!anxContent || typeof anxContent !== 'object') {
    return result;
  }

  // 设置config
  if (anxContent.kind) {
    result.config = { ...anxContent }; // 复制整个ANX Config到config
  }

  // 设置data.value（仅在存在时）
  if (anxContent.value !== undefined) {
    result.data.value = anxContent.value;
  }

  // 对于box和table类型，将config.data放到data.data中
  if ((anxContent.kind === 'box' || anxContent.kind === 'table') && anxContent.data) {
    result.data.data = anxContent.data;
  }

  // 处理子组件
  if (anxContent.kinds && Array.isArray(anxContent.kinds)) {
    result.nodes = anxContent.kinds.map(child => {
      const childNode = {
        cardKey: generateCardKey(),
        config: { ...child }, // 复制整个子组件对象到config
        data: {},
        logs: [],
        nodes: []
      };

      // 设置data.value（仅在存在时）
      if (child.value !== undefined) {
        childNode.data.value = child.value;
      }

      // 对于box和table类型，将config.data放到data.data中
      if ((child.kind === 'box' || child.kind === 'table') && child.data) {
        childNode.data.data = child.data;
      }

      // 处理子组件的子组件
      if (child.kinds && Array.isArray(child.kinds)) {
        childNode.nodes = child.kinds.map(grandchild => {
          const grandchildNode = {
            cardKey: generateCardKey(),
            config: { ...grandchild }, // 复制整个孙子组件对象到config
            data: {},
            logs: [],
            nodes: []
          };

          // 设置data.value（仅在存在时）
          if (grandchild.value !== undefined) {
            grandchildNode.data.value = grandchild.value;
          }

          // 对于box和table类型，将config.data放到data.data中
          if ((grandchild.kind === 'box' || grandchild.kind === 'table') && grandchild.data) {
            grandchildNode.data.data = grandchild.data;
          }

          return grandchildNode;
        });
      }

      return childNode;
    });
  }

  return result;
}

/**
 * 转换单个ANX组件为Markdown
 * @param {Object} component - ANX组件
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
async function convertComponentToMarkdown(component) {
  const { kind, title, data, html, template, value, options, label, placeholder, rows, nick, action, dataset } = component;

  // 处理dataset
  let processedComponent = { ...component };
  if (dataset) {
    try {
      // 直接使用dataset作为配置，支持url_dataset和uuid_dataset
      const datasetData = await fetchDataset(dataset);
      // 处理path属性
      if (dataset.path && datasetData) {
        processedComponent.data = getPropertyValue(datasetData, dataset.path);
      } else {
        processedComponent.data = datasetData;
      }
    } catch (error) {
      console.error('Error fetching dataset:', error);
    }
  }

  switch (kind) {
    case 'box':
      return await convertBoxToMarkdown(processedComponent);
    case 'board':
      return await convertBoardToMarkdown(processedComponent, convertComponentToMarkdown);
    case 'text':
      return convertTextToMarkdown(processedComponent);
    case 'input':
      return convertInputToMarkdown(processedComponent);
    case 'textarea':
      return convertTextareaToMarkdown(processedComponent);
    case 'button':
      return convertButtonToMarkdown(processedComponent);
    case 'form':
      return await convertFormToMarkdown(processedComponent);
    case 'navigation':
      return convertNavigationToMarkdown(processedComponent);
    case 'date':
      return convertDateToMarkdown(processedComponent);
    case 'options':
      return await convertOptionsToMarkdown(processedComponent);
    case 'checkbox':
      return convertCheckboxToMarkdown(processedComponent);
    case 'table':
      return await convertTableToMarkdown(processedComponent);
    default:
      return `<!-- ANX Component: ${kind} -->`;
  }
}

/**
 * 转换Text组件为Markdown
 * @param {Object} component - Text组件
 * @returns {string} - 转换后的Markdown内容
 */
function convertTextToMarkdown(component) {
  const { value } = component;
  return value || '';
}

/**
 * 转换Input组件为Markdown
 * @param {Object} component - Input组件
 * @returns {string} - 转换后的Markdown内容
 */
function convertInputToMarkdown(component) {
  const { placeholder, value, nick } = component;
  const label = nick || 'Input';
  return `**${label}:** ${value || placeholder || ''}`;
}

/**
 * 转换Textarea组件为Markdown
 * @param {Object} component - Textarea组件
 * @returns {string} - 转换后的Markdown内容
 */
function convertTextareaToMarkdown(component) {
  const { placeholder, value, nick, rows } = component;
  const label = nick || 'Textarea';
  const content = value || placeholder || '';
  return `**${label}:**\n\n\`\`\`\n${content}\n\`\`\``;
}

/**
 * 转换Button组件为Markdown
 * @param {Object} component - Button组件
 * @returns {string} - 转换后的Markdown内容
 */
function convertButtonToMarkdown(component) {
  const { label, action } = component;
  const buttonLabel = label || 'Button';
  return `[${buttonLabel}](${action || '#'})`;
}

/**
 * 转换Date组件为Markdown
 * @param {Object} component - Date组件
 * @returns {string} - 转换后的Markdown内容
 */
function convertDateToMarkdown(component) {
  const { placeholder, value, nick } = component;
  const label = nick || 'Date';
  return `**${label}:** ${value || placeholder || ''}`;
}

/**
 * 转换Checkbox组件为Markdown
 * @param {Object} component - Checkbox组件
 * @returns {string} - 转换后的Markdown内容
 */
function convertCheckboxToMarkdown(component) {
  const { options, value, nick } = component;
  let content = '';

  if (nick) {
    content += `**${nick}:**\n\n`;
  }

  if (options && Array.isArray(options)) {
    options.forEach(option => {
      const isChecked = value && Array.isArray(value) && value.includes(option.value);
      content += `${isChecked ? '✓ ' : '- '}${option.title}\n`;
    });
  }

  return content;
}



// 导出所有功能
module.exports = {
  anxToMarkdown,
  anxToNodes
};
