/**
 * 将ANX格式内容转换为Markdown格式
 * @param {Object} anxContent - ANX格式的内容
 * @returns {Promise<string>} - 转换后的Markdown格式内容
 */
import { fetchDataset } from './utils/dataset.js';
import { 
  convertBoxToMarkdown, 
  convertBoardToMarkdown, 
  convertFormToMarkdown, 
  convertOptionsToMarkdown, 
  convertNavigationToMarkdown 
} from './kinds/index.js';
export async function anxToMarkdown(anxContent) {
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
export function anxToNodes(anxContent) {
  const result = {
    cardKey: generateCardKey(),
    config: {},
    data: { "value": {} },
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

  // 设置data
  if (anxContent.value) {
    result.data.value = anxContent.value;
  }

  // 处理子组件
  if (anxContent.kinds && Array.isArray(anxContent.kinds)) {
    result.nodes = anxContent.kinds.map(child => {
      const childNode = {
        cardKey: generateCardKey(),
        config: { ...child }, // 复制整个子组件对象到config
        data: { "value": child.value || {} },
        logs: [],
        nodes: []
      };

      // 处理子组件的子组件
      if (child.kinds && Array.isArray(child.kinds)) {
        childNode.nodes = child.kinds.map(grandchild => ({
          cardKey: generateCardKey(),
          config: { ...grandchild }, // 复制整个孙子组件对象到config
          data: { "value": grandchild.value || {} },
          logs: [],
          nodes: []
        }));
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
      return await convertBoardToMarkdown(processedComponent);
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

/**
 * 获取对象的属性值
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径，如 "user.name"
 * @returns {*} - 属性值
 */
function getPropertyValue(obj, path) {
  if (!obj || typeof obj !== 'object') return undefined;

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value[key] === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * 解析模板，替换变量（适用于Markdown）
 * @param {string} templateContent - 模板内容
 * @param {Object} data - 数据对象
 * @returns {string} - 解析后的模板
 */
export function parseTemplateForMarkdown(templateContent, data) {
  if (!templateContent) return '';

  let parsedTemplate = templateContent;

  // 替换双大括号变量
  const doubleBracesRegex = /\{\{([^{}]+)\}\}/g;
  parsedTemplate = parsedTemplate.replace(doubleBracesRegex, (match, variable) => {
    const value = getPropertyValue(data, variable.trim());
    return value !== undefined ? value : match;
  });

  // 替换美元大括号变量
  const dollarBracesRegex = /\$\{([^{}]+)\}/g;
  parsedTemplate = parsedTemplate.replace(dollarBracesRegex, (match, variable) => {
    const value = getPropertyValue(data, variable.trim());
    return value !== undefined ? value : match;
  });

  // 替换单大括号变量
  const singleBracesRegex = /\{([^{}]+)\}/g;
  parsedTemplate = parsedTemplate.replace(singleBracesRegex, (match, variable) => {
    const value = getPropertyValue(data, variable.trim());
    return value !== undefined ? value : match;
  });

  return parsedTemplate;
}
