/**
 * 注意：anxToMarkup 已停用，建议使用 core/trans 模块中的 nodesToMarkup
 */
const { anxToNodes } = require('./trans/index.js');
const { fetchDataset } = require('./utils/dataset.js');
const { parseTemplateForMarkdown } = require('./utils/template.js');
const { 
  convertBoxToMarkup, 
  convertBoardToMarkup, 
  convertFormToMarkup, 
  convertOptionsToMarkup, 
  convertNavigationToMarkup,
  convertTableToMarkup,
  convertListToMarkup,
  convertSopToMarkup
} = require('./kinds/index.js');

/**
 * @deprecated 已停用，请使用 core/trans 模块中的 nodesToMarkup
 */
async function anxToMarkup(anxContent) {
  console.warn('DEPRECATED: anxToMarkup is deprecated. Use nodesToMarkup from core/trans instead.');
  if (!anxContent || typeof anxContent !== 'object') {
    return '';
  }

  if (anxContent.kind) {
    return await convertComponentToMarkup(anxContent);
  }

  if (Array.isArray(anxContent)) {
    const results = await Promise.all(anxContent.map(item => anxToMarkup(item)));
    return results.join('\n\n');
  }

  return '';
}

async function convertComponentToMarkup(component) {
  const { kind, title, data, html, template, value, options, label, placeholder, rows, nick, action, dataset } = component;
  
  let processedComponent = { ...component };
  if (dataset) {
    try {
      const datasetData = await fetchDataset(dataset);
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
      return await convertBoxToMarkup(processedComponent);
    case 'board':
      return await convertBoardToMarkup(processedComponent, convertComponentToMarkup);
    case 'text':
      return convertTextToMarkup(component, processedComponent);
    case 'input':
      return convertInputToMarkup(processedComponent);
    case 'textarea':
      return convertTextareaToMarkup(processedComponent);
    case 'button':
      return convertButtonToMarkup(processedComponent);
    case 'form':
      return await convertFormToMarkup(processedComponent);
    case 'navigation':
      return convertNavigationToMarkup(processedComponent);
    case 'date':
      return convertDateToMarkup(processedComponent);
    case 'options':
      return await convertOptionsToMarkup(processedComponent);
    case 'checkbox':
      return convertCheckboxToMarkup(processedComponent);
    case 'table':
      return await convertTableToMarkup(processedComponent);
    case 'list':
      return await convertListToMarkup(processedComponent);
    case 'sop':
      return convertSopToMarkup(processedComponent, processedComponent.data, processedComponent.uuid);
    case 'file':
    case 'image':
    case 'images':
      return convertFileToMarkup(processedComponent);
    default:
      return `<!-- ANX Component: ${kind} -->`;
  }
}

function convertTextToMarkup(component, processedComponent) {
  const { value, title, nick, data } = component;
  const { data: processedData } = processedComponent || {};
  const label = title || nick || 'Text';
  let textValue;
  if (processedData && processedData.value !== undefined) {
    textValue = processedData.value;
  } else if (data && data.value !== undefined) {
    textValue = data.value;
  } else {
    textValue = value;
  }
  return `**${label}:** ${textValue || ''}`;
}

function convertInputToMarkup(component) {
  const { placeholder, value, nick } = component;
  const label = nick || 'Input';
  return `**${label}:** ${value || placeholder || ''}`;
}

function convertTextareaToMarkup(component) {
  const { placeholder, value, nick, rows } = component;
  const label = nick || 'Textarea';
  const content = value || placeholder || '';
  return `**${label}:**\n\n\`\`\`\n${content}\n\`\`\``;
}

function convertButtonToMarkup(component) {
  const { label, action } = component;
  const buttonLabel = label || 'Button';
  return `[${buttonLabel}](${action || '#'})`;
}

function convertDateToMarkup(component) {
  const { placeholder, value, nick } = component;
  const label = nick || 'Date';
  return `**${label}:** ${value || placeholder || ''}`;
}

function convertCheckboxToMarkup(component) {
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

function convertFileToMarkup(component) {
  const { title, description, accept, multiple, maxSize, preview, nick } = component;
  const cardKey = 'card_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  
  let markup = `<x file ${cardKey}>\n<!-- ANX Component: ${component.kind} -->\n`;

  if (title || nick) {
    const label = title || nick;
    markup += `**${label}:**\n`;
  }

  if (description) {
    markup += `${description}\n`;
  }

  markup += `</x>\n`;
  return markup;
}

function getPropertyValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let result = obj;
  for (const part of parts) {
    if (result === null || result === undefined) return undefined;
    result = result[part];
  }
  return result;
}

module.exports = {
  anxToMarkup,
  anxToNodes
};