/**
 * 处理Options组件的ANX配置
 */

const { fetchDataset } = require('../utils/dataset.js');

/**
 * 转换Options组件为Markup
 * @param {Object} component - Options组件
 * @returns {Promise<string>} - 转换后的Markup内容
 */
async function convertOptionsToMarkup(component) {
  const { title, options, value, multiple, nick, optionsSet } = component;
  let content = '';

  if (title) {
    content += `**${title}:**\n\n`;
  } else if (nick) {
    content += `**${nick}:**\n\n`;
  }

  // 处理optionsSet中的dataset
  let processedOptions = options;
  if (optionsSet && optionsSet.dataset) {
    try {
      // 直接使用dataset作为配置，支持url_dataset和uuid_dataset
      const datasetData = await fetchDataset(optionsSet.dataset);
      // 处理path属性
      if (optionsSet.dataset.path && datasetData) {
        processedOptions = getPropertyValue(datasetData, optionsSet.dataset.path);
      } else {
        // 检查datasetData是否有data属性，如果有，使用data属性作为选项数组
        processedOptions = datasetData && datasetData.data ? datasetData.data : datasetData;
      }
    } catch (error) {
      console.error('Error fetching options dataset:', error);
    }
  }
  
  // 确保processedOptions是一个数组
  if (!Array.isArray(processedOptions)) {
    processedOptions = [];
  }

  if (processedOptions && Array.isArray(processedOptions)) {
    for (const option of processedOptions) {
      // Get title and value using titleNick and valueNick if provided
      const titleNick = optionsSet?.titleNick || 'title';
      const valueNick = optionsSet?.valueNick || 'value';
      const optionTitle = option[titleNick] || option.title || option.label || option.value || 'Unknown';
      const optionValue = option[valueNick] || option.value;
      
      const isSelected = value && (Array.isArray(value) ? value.includes(optionValue) : value === optionValue);
      content += `${isSelected ? '✓ ' : '- '}${optionTitle}\n`;
    }
  } else {
    content += '- No options available\n';
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

module.exports = {
  convertOptionsToMarkup
};