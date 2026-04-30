const { getNode, setNode } = require('../app/node.js');
const { fetchDataset } = require('../utils/dataset.js');

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

async function nodesToMarkup(nodesStructure) {
  if (!nodesStructure) {
    return '';
  }
  
  const storedNode = getNode(nodesStructure.cardKey);
  if (storedNode) {
    nodesStructure = storedNode;
  }
  
  async function processNode(node) {
    const nodeAnxContent = { ...node.config };
    
    // 如果是 form 节点，在处理子节点之前先传递数据
    if (node.config.kind === 'form' && node.nodes && node.nodes.length > 0) {
      const formData = node.data && node.data.value ? node.data.value : {};
      node.nodes.forEach((childNode) => {
        const childNick = childNode.config && childNode.config.nick;
        if (childNick && (!childNode.data || childNode.data.value === undefined)) {
          // 尝试多种匹配方式
          let value = undefined;
          
          // 1. 精确匹配
          if (formData[childNick] !== undefined) {
            value = formData[childNick];
          }
          // 2. 尝试单数/复数转换
          else if (childNick.endsWith('s') && formData[childNick.slice(0, -1)] !== undefined) {
            value = formData[childNick.slice(0, -1)];
          }
          // 3. 尝试复数转换
          else if (!childNick.endsWith('s') && formData[childNick + 's'] !== undefined) {
            value = formData[childNick + 's'];
          }
          
          if (value !== undefined) {
            childNode.data = childNode.data || {};
            childNode.data.value = value;
          }
        }
      });
    }
    
    let childMarkup = '';
    if (node.nodes && node.nodes.length > 0) {
      const childContents = await Promise.all(node.nodes.map(child => processNode(child)));
      childMarkup = childContents.join('\n\n');
    }
    
    let nodeMarkup = '';
    if (node.config.kind) {
      switch (node.config.kind) {
        case 'form':
          nodeMarkup = node.config.title ? `## ${node.config.title}\n\n` : '';
          nodeMarkup += childMarkup;
          break;
        case 'board':
          nodeMarkup = childMarkup;
          break;
        case 'box':
          if (node.config.title) {
            nodeMarkup = `## ${node.config.title}\n\n`;
          }
          
          let boxData = node.config.data;
          if (!boxData && node.config.dataset) {
            try {
              const datasetData = await fetchDataset(node.config.dataset);
              boxData = datasetData || [];
              
              if (!node.data) {
                node.data = {};
              }
              node.data.data = boxData;
              node.config.data = boxData;
              setNode(node.cardKey, node);
            } catch (error) {
              console.error('Error fetching box dataset:', error);
            }
          }
          
          if (boxData && Array.isArray(boxData) && boxData.length > 0) {
            for (let i = 0; i < boxData.length; i++) {
              const item = boxData[i];
              const templateContent = node.config.template || node.config.html;
              if (templateContent) {
                let parsedTemplate = templateContent;
                
                const doubleBracesRegex = /\{\{([^{}]+)\}\}/g;
                parsedTemplate = parsedTemplate.replace(doubleBracesRegex, (match, variable) => {
                  const value = getPropertyValue(item, variable.trim());
                  return value !== undefined ? value : match;
                });
                
                const dollarBracesRegex = /\$\{([^{}]+)\}/g;
                parsedTemplate = parsedTemplate.replace(dollarBracesRegex, (match, variable) => {
                  const value = getPropertyValue(item, variable.trim());
                  return value !== undefined ? value : match;
                });
                
                const singleBracesRegex = /\{([^{}]+)\}/g;
                parsedTemplate = parsedTemplate.replace(singleBracesRegex, (match, variable) => {
                  const value = getPropertyValue(item, variable.trim());
                  return value !== undefined ? value : match;
                });
                
                nodeMarkup += `<x ${i}>${parsedTemplate}</x>\n\n`;
              }
            }
          } else if (node.config.html || node.config.template) {
            const templateContent = node.config.template || node.config.html;
            let parsedTemplate = templateContent;
            
            const doubleBracesRegex = /\{\{([^{}]+)\}\}/g;
            parsedTemplate = parsedTemplate.replace(doubleBracesRegex, (match, variable) => {
              const value = getPropertyValue(node.config, variable.trim());
              return value !== undefined ? value : match;
            });
            
            const dollarBracesRegex = /\$\{([^{}]+)\}/g;
            parsedTemplate = parsedTemplate.replace(dollarBracesRegex, (match, variable) => {
              const value = getPropertyValue(node.config, variable.trim());
              return value !== undefined ? value : match;
            });
            
            const singleBracesRegex = /\{([^{}]+)\}/g;
            parsedTemplate = parsedTemplate.replace(singleBracesRegex, (match, variable) => {
              const value = getPropertyValue(node.config, variable.trim());
              return value !== undefined ? value : match;
            });
            
            nodeMarkup += `${parsedTemplate}\n\n`;
          }
          break;
        case 'input':
          const inputLabel = node.config.nick || 'Input';
          const inputValue = node.data && node.data.value ? node.data.value : node.config.value || node.config.placeholder || '';
          nodeMarkup = `**${inputLabel}:** ${inputValue}`;
          break;
        case 'textarea':
          const textareaLabel = node.config.nick || 'Textarea';
          const textareaValue = node.data && node.data.value ? node.data.value : node.config.value || node.config.placeholder || '';
          nodeMarkup = `**${textareaLabel}:**\n\n\`\`\`\n${textareaValue}\n\`\`\``;
          break;
        case 'button':
          const buttonLabel = node.config.label || 'Button';
          const action = node.config.action || '#';
          nodeMarkup = `[${buttonLabel}](${action})`;
          break;
        case 'text':
          const textLabel = node.config.title || node.config.nick;
          const textValue = node.data && node.data.value ? node.data.value : node.config.value || '';
          nodeMarkup = textLabel ? `**${textLabel}:** ${textValue}` : textValue;
          break;
        case 'date':
          const dateLabel = node.config.nick || 'Date';
          const dateValue = node.data && node.data.value ? node.data.value : node.config.value || node.config.placeholder || '';
          nodeMarkup = `**${dateLabel}:** ${dateValue}`;
          break;
        case 'image':
          const imageLabel = node.config.nick || 'Image';
          const imageValue = node.data && node.data.value ? node.data.value : '';
          if (imageValue) {
            nodeMarkup = `**${imageLabel}:**\n\n![Image](${imageValue})`;
          } else {
            nodeMarkup = `**${imageLabel}:** *No image uploaded*`;
          }
          break;
        case 'images':
          const imagesLabel = node.config.nick || 'Images';
          const imagesValue = node.data && node.data.value ? node.data.value : [];
          if (Array.isArray(imagesValue) && imagesValue.length > 0) {
            nodeMarkup = `**${imagesLabel}:**\n\n`;
            imagesValue.forEach((imgUrl, index) => {
              nodeMarkup += `${index + 1}. ![Image ${index + 1}](${imgUrl})\n`;
            });
          } else {
            nodeMarkup = `**${imagesLabel}:** *No images uploaded*`;
          }
          break;
        case 'checkbox':
          const checkboxLabel = node.config.nick ? `**${node.config.nick}:**\n\n` : '';
          let checkboxContent = checkboxLabel;
          if (node.config.options && Array.isArray(node.config.options)) {
            const checkboxValue = node.data && node.data.value ? node.data.value : node.config.value || [];
            node.config.options.forEach((option, index) => {
              const isChecked = Array.isArray(checkboxValue) && checkboxValue.includes(option.value);
              const optionTitle = option.title || option.value || 'Unknown';
              const optionValue = option.value;
              if (isChecked) {
                checkboxContent += `<x ${index} ${optionValue} checked>${optionTitle}</x>\n`;
              } else {
                checkboxContent += `<x ${index} ${optionValue}>${optionTitle}</x>\n`;
              }
            });
          }
          nodeMarkup = checkboxContent;
          break;
        case 'options':
          const optionsLabel = node.config.nick || 'Options';
          let optionsContent = `**${optionsLabel}:**\n\n`;
          let optionsData = [];
          
          if (node.config.optionsSet && node.config.optionsSet.dataset) {
            try {
              const datasetData = await fetchDataset(node.config.optionsSet.dataset);
              let processedOptions = datasetData && datasetData.data ? datasetData.data : datasetData;
              
              if (Array.isArray(processedOptions)) {
                const selectedValue = node.data && node.data.value ? node.data.value : node.config.value;
                for (let index = 0; index < processedOptions.length; index++) {
                  const option = processedOptions[index];
                  const titleNick = node.config.optionsSet?.titleNick || 'title';
                  const valueNick = node.config.optionsSet?.valueNick || 'value';
                  const optionTitle = option[titleNick] || option.title || option.label || option.value || 'Unknown';
                  const optionValue = option[valueNick] || option.value;
                  const isSelected = selectedValue === optionValue;
                  
                  if (isSelected) {
                    optionsContent += `<x ${index} ${optionValue} selected>${optionTitle}</x>\n`;
                  } else {
                    optionsContent += `<x ${index} ${optionValue}>${optionTitle}</x>\n`;
                  }
                  optionsData.push({ title: optionTitle, value: optionValue, selected: isSelected });
                }
              } else {
                optionsContent += '- No options available\n';
              }
            } catch (error) {
              console.error('Error fetching options dataset:', error);
              optionsContent += '- Error fetching options\n';
            }
          } else if (node.config.options && Array.isArray(node.config.options)) {
            const selectedValue = node.data && node.data.value ? node.data.value : node.config.value;
            for (let index = 0; index < node.config.options.length; index++) {
              const option = node.config.options[index];
              const optionTitle = option.title || option.label || option.value || 'Unknown';
              const optionValue = option.value;
              const isSelected = selectedValue === optionValue;
              
              if (isSelected) {
                optionsContent += `<x ${index} ${optionValue} selected>${optionTitle}</x>\n`;
              } else {
                optionsContent += `<x ${index} ${optionValue}>${optionTitle}</x>\n`;
              }
              optionsData.push({ title: optionTitle, value: optionValue, selected: isSelected });
            }
          } else {
            optionsContent += '- No options available\n';
          }
          
          if (!node.data) {
            node.data = {};
          }
          node.data.options = optionsData;
          setNode(node.cardKey, node);
          
          nodeMarkup = optionsContent;
          break;
        case 'table':
          if (node.config.title) {
            nodeMarkup = `## ${node.config.title}\n\n`;
          }
          
          let tableData = node.config.data;
          if (!tableData && node.config.dataset) {
            try {
              const datasetData = await fetchDataset(node.config.dataset);
              tableData = datasetData || [];
              
              if (!node.data) {
                node.data = {};
              }
              node.data.data = tableData;
              node.config.data = tableData;
              setNode(node.cardKey, node);
            } catch (error) {
              console.error('Error fetching table dataset:', error);
            }
          }
          
          if (node.config.titles && Array.isArray(node.config.titles) && node.config.titles.length > 0) {
            const visibleTitles = node.config.titles.filter(title => !title.hide);
            
            if (visibleTitles.length > 0) {
              const headers = visibleTitles.map(title => title.title).join(' | ');
              const separators = visibleTitles.map(() => '---').join(' | ');
              
              nodeMarkup += `| ${headers} |\n`;
              nodeMarkup += `| ${separators} |\n`;
              
              if (tableData && Array.isArray(tableData)) {
                tableData.forEach(row => {
                  let rowContent = '';
                  
                  if (Array.isArray(row)) {
                    visibleTitles.forEach(title => {
                      const cell = row.find(item => item.nick === title.nick);
                      rowContent += ` ${cell ? cell.value : ''} |`;
                    });
                  } else if (typeof row === 'object') {
                    visibleTitles.forEach(title => {
                      rowContent += ` ${row[title.nick] || ''} |`;
                    });
                  }
                  
                  nodeMarkup += `|${rowContent}\n`;
                });
              } else {
                nodeMarkup += `| ${visibleTitles.map(() => '').join(' | ')} |\n`;
              }
              
              nodeMarkup += '\n';
            }
          }
          break;
        case 'list':
          if (node.config.title) {
            nodeMarkup = `## ${node.config.title}\n\n`;
          }
          
          const itemList = node.config.itemList || [];
          const listData = node.data && node.data.value ? node.data.value : (node.config.data || []);
          
          if (itemList.length > 0 && listData.length > 0) {
            const headers = itemList.map(item => item.title || item.nick || '').join(' | ');
            const separators = itemList.map(() => '---').join(' | ');
            
            nodeMarkup += `| ${headers} |\n`;
            nodeMarkup += `| ${separators} |\n`;
            
            for (const row of listData) {
              const cells = itemList.map(item => {
                const value = row[item.nick] !== undefined ? row[item.nick] : '';
                return value;
              });
              nodeMarkup += `| ${cells.join(' | ')} |\n`;
            }
            
            nodeMarkup += '\n';
          } else {
            nodeMarkup += '*No data*\n\n';
          }
          break;
        case 'sop':
          const sopTitle = node.config.title || 'SOP Workflow';
          const steps = node.config.steps || [];
          
          const currentStepUuid = node.data?.currentStepUuid;
          const claimedStepUuid = node.data?.claimedStepUuid;
          const nextStepUuid = node.data?.nextStepUuid;
          const completedSteps = node.data?.completedSteps || [];
          
          const currentStep = steps.find(s => s.uuid === currentStepUuid);
          const claimedStep = steps.find(s => s.uuid === claimedStepUuid);
          let nextStep = steps.find(s => s.uuid === nextStepUuid);
          
          if (!nextStep) {
            nextStep = steps.find(s => {
              if (completedSteps.includes(s.uuid) || s.uuid === claimedStepUuid) {
                return false;
              }
              if (s.sources && s.sources.length > 0) {
                const sourcesJoin = s.sources_join || 'all';
                if (sourcesJoin === 'all') {
                  return s.sources.every(src => completedSteps.includes(src));
                } else {
                  return s.sources.some(src => completedSteps.includes(src));
                }
              }
              return s.start === true;
            });
          }
          
          nodeMarkup = `## ${sopTitle}\n\n`;
          
          if (claimedStep || nextStep) {
            if (claimedStep) {
              nodeMarkup += `### 🔄 In Progress: ${claimedStep.nick || claimedStep.uuid}\n\n`;
              if (claimedStep.action) {
                nodeMarkup += `**Action:** ${claimedStep.action}\n\n`;
              }
              if (claimedStep.sources && claimedStep.sources.length > 0) {
                nodeMarkup += `**Dependencies:** ${claimedStep.sources.join(', ')}\n\n`;
              }
            }
            
            if (nextStep) {
              nodeMarkup += `### ⏳ Next Step: ${nextStep.nick || nextStep.uuid}\n\n`;
              if (nextStep.action) {
                nodeMarkup += `**Action:** ${nextStep.action}\n\n`;
              }
              if (nextStep.sources && nextStep.sources.length > 0) {
                nodeMarkup += `**Dependencies:** ${nextStep.sources.join(', ')}\n\n`;
              }
            }
          } else {
            nodeMarkup += `### Workflow Steps (${steps.length} total)\n\n`;
            steps.forEach((step, index) => {
              const stepNick = step.nick || step.uuid;
              const isStart = step.start ? ' (Start)' : '';
              const hasApproval = step.approvalRequired ? ' [Approval Required]' : '';
              nodeMarkup += `${index + 1}. **${stepNick}**${isStart}${hasApproval}\n`;
              if (step.action) {
                nodeMarkup += `   - Action: ${step.action}\n`;
              }
              if (step.sources && step.sources.length > 0) {
                nodeMarkup += `   - Dependencies: ${step.sources.join(', ')}\n`;
              }
            });
          }
          break;
        default:
          nodeMarkup = `<!-- ANX Component: ${node.config.kind} -->`;
      }
    }
    
    let tapAttribute = '';
    if (node.config.kind === 'box' && node.config.tapSet) {
      const tapSetTitle = node.config.tapSet.title || '';
      tapAttribute = ` tap="${tapSetTitle}"`;
    }
    return `<x ${node.config.kind || ''} ${node.cardKey}${tapAttribute}>
${nodeMarkup}
</x>`;
  }
  
  const topLevelMarkup = await processNode(nodesStructure);
  return topLevelMarkup;
}

module.exports = {
  nodesToMarkup
};