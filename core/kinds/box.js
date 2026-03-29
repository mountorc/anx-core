/**
 * 处理Box组件的ANX配置
 */

const { parseTemplateForMarkup } = require('../utils/template.js');
const { fetchDataset } = require('../utils/dataset.js');

/**
 * 转换Box组件为Markup
 * @param {Object} component - Box组件
 * @returns {Promise<string>} - 转换后的Markup内容
 */
async function convertBoxToMarkup(component) {
  const { title, data, html, template, dataset } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  // 处理数据集
  let boxData = data;
  if (!boxData && dataset) {
    try {
      const datasetData = await fetchDataset(dataset);
      boxData = datasetData || [];
    } catch (error) {
      console.error('Error fetching dataset:', error);
    }
  }

  if (boxData && boxData.length > 0) {
    for (const item of boxData) {
      const templateContent = template || html;
      if (templateContent) {
        content += `${parseTemplateForMarkup(templateContent, item)}\n\n`;
      }
    }
  } else if (html || template) {
    const templateContent = template || html;
    content += `${parseTemplateForMarkup(templateContent, component)}\n\n`;
  }

  return content;
}

module.exports = {
  convertBoxToMarkup
};