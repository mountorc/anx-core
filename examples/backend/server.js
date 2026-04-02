const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Import the anxToMarkup, anxToNodes functions and anxCLI from the core module
const { anxToMarkup, anxToNodes, anxCLI } = require('../../core/index.js');
const { generateNodeVisualization, generateVisualizationCSS } = require('../../view/index.js');
const { uploadImageToOSS } = require('../../view/utils/oss.js');

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const PORT = 7887;

// 存储cardKey及其对应的config信息
const cardStorage = new Map();
// 存储完整的节点结构
const nodeStorage = new Map();
// 存储基于ANX内容的哈希值到节点结构的映射
const anxHashToNodeMap = new Map();
// 存储hub中的anx config
const hubAnxMap = new Map();

// 存储CLI命令执行记录的日志缓存
const cliLogs = [];
const MAX_LOGS = 100; // 最大日志条数

// 生成ANX内容的哈希值
function generateAnxHash(anxContent) {
  const crypto = require('crypto');
  const jsonString = JSON.stringify(anxContent);
  return crypto.createHash('md5').update(jsonString).digest('hex');
}

// 加载hub文件
function loadHubFiles() {
  const fs = require('fs');
  const path = require('path');
  const hubDir = path.join(__dirname, '../../examples/hub');
  
  try {
    if (fs.existsSync(hubDir)) {
      const files = fs.readdirSync(hubDir);
      files.forEach(file => {
        if (file.endsWith('.json') && file !== 'index.json') {
          const filePath = path.join(hubDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          try {
            const hubFile = JSON.parse(content);
            if (hubFile.uuid && hubFile.anxContent) {
              hubAnxMap.set(hubFile.uuid, hubFile);
              console.log(`Loaded hub file: ${hubFile.name} (${hubFile.uuid})`);
            }
          } catch (error) {
            console.error(`Error parsing hub file ${file}:`, error);
          }
        }
      });
      console.log(`Loaded ${hubAnxMap.size} hub files`);
    }
  } catch (error) {
    console.error('Error loading hub files:', error);
  }
}

// 获取对象的属性值
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
 * 计算formula表达式的值
 * @param {string} formula - formula表达式
 * @param {Object} formData - 表单数据对象
 * @returns {any} - 计算结果
 */
function evaluateFormula(formula, formData) {
  if (!formula || typeof formula !== 'string') {
    return undefined;
  }

  try {
    // 处理 case when then else end 语法
    if (formula.toLowerCase().includes('case')) {
      return evaluateCaseWhenFormula(formula, formData);
    }

    // 替换formula中的变量为实际值
    let expression = formula;
    
    // 提取所有变量（非引号内的单词）
    const variableRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const variables = [...formula.matchAll(variableRegex)].map(match => match[0]);
    
    // 去重
    const uniqueVariables = [...new Set(variables)];
    
    // 替换变量为实际值
    for (const variable of uniqueVariables) {
      const value = formData[variable];
      if (value !== undefined) {
        // 根据值的类型决定如何替换
        if (typeof value === 'string') {
          expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), `'${value}'`);
        } else if (typeof value === 'number') {
          expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        } else if (typeof value === 'boolean') {
          expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        }
      }
    }

    // 使用Function构造函数安全地计算表达式
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expression)();
    return result;
  } catch (error) {
    console.error('Error evaluating formula:', formula, error);
    return undefined;
  }
}

/**
 * 处理 case when then else end 语法的formula
 * @param {string} formula - case when formula表达式
 * @param {Object} formData - 表单数据对象
 * @returns {any} - 计算结果
 */
function evaluateCaseWhenFormula(formula, formData) {
  try {
    // 解析 case when 语法
    // 格式: case when condition1 then result1 when condition2 then result2 else result end
    
    const lowerFormula = formula.toLowerCase();
    if (!lowerFormula.startsWith('case') || !lowerFormula.endsWith('end')) {
      return undefined;
    }

    // 提取 when-then 对和 else 部分
    const content = formula.slice(4, -3).trim(); // 移除 'case' 和 'end'
    
    // 找到所有的 when-then 对
    const whenRegex = /when\s+(.+?)\s+then\s+(.+?)(?=\s+when|\s+else|$)/gi;
    const whenMatches = [...content.matchAll(whenRegex)];
    
    for (const match of whenMatches) {
      const conditionStr = match[1].trim();
      const resultStr = match[2].trim();
      
      // 计算条件
      const conditionResult = evaluateCondition(conditionStr, formData);
      if (conditionResult) {
        // 返回结果值
        return evaluateValue(resultStr, formData);
      }
    }
    
    // 如果没有匹配的when，返回else部分的值
    const elseMatch = content.match(/else\s+(.+)$/i);
    if (elseMatch) {
      return evaluateValue(elseMatch[1].trim(), formData);
    }
    
    return undefined;
  } catch (error) {
    console.error('Error evaluating case when formula:', formula, error);
    return undefined;
  }
}

/**
 * 计算条件表达式
 * @param {string} condition - 条件表达式
 * @param {Object} formData - 表单数据对象
 * @returns {boolean} - 条件结果
 */
function evaluateCondition(condition, formData) {
  try {
    // 替换变量为实际值
    let expression = condition;
    const variableRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const variables = [...condition.matchAll(variableRegex)].map(match => match[0]);
    const uniqueVariables = [...new Set(variables)];
    
    for (const variable of uniqueVariables) {
      const value = formData[variable];
      if (value !== undefined) {
        if (typeof value === 'string') {
          expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), `'${value}'`);
        } else if (typeof value === 'number') {
          expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        } else if (typeof value === 'boolean') {
          expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        }
      }
    }
    
    // eslint-disable-next-line no-new-func
    return new Function('return ' + expression)();
  } catch (error) {
    console.error('Error evaluating condition:', condition, error);
    return false;
  }
}

/**
 * 计算值表达式
 * @param {string} valueStr - 值表达式
 * @param {Object} formData - 表单数据对象
 * @returns {any} - 计算结果
 */
function evaluateValue(valueStr, formData) {
  // 如果是字符串常量（用单引号包裹）
  if (valueStr.startsWith("'") && valueStr.endsWith("'")) {
    return valueStr.slice(1, -1);
  }
  
  // 如果是数字
  if (!isNaN(valueStr)) {
    return Number(valueStr);
  }
  
  // 如果是变量，从formData中获取值
  const value = formData[valueStr];
  if (value !== undefined) {
    return value;
  }
  
  // 否则作为表达式计算
  try {
    return evaluateFormula(valueStr, formData);
  } catch (error) {
    return valueStr;
  }
}

/**
 * 更新form中所有formula字段的值
 * @param {Object} formNode - form节点
 */
function updateFormulas(formNode) {
  if (!formNode || !formNode.nodes || formNode.nodes.length === 0) {
    return;
  }
  
  const formData = formNode.data?.value || {};
  let hasChanges = false;
  
  // 遍历所有子节点，查找有formula的字段
  for (const node of formNode.nodes) {
    if (node.config && node.config.formula) {
      const nick = node.config.nick;
      if (!nick) continue;
      
      // 计算formula的值
      const calculatedValue = evaluateFormula(node.config.formula, formData);
      
      if (calculatedValue !== undefined) {
        // 更新节点的value
        if (!node.data) {
          node.data = {};
        }
        node.data.value = calculatedValue;
        
        // 更新formData
        formData[nick] = calculatedValue;
        hasChanges = true;
        
        console.log(`Updated formula field ${nick}: ${calculatedValue}`);
      }
    }
  }
  
  // 如果有变化，更新formNode的data.value
  if (hasChanges) {
    if (!formNode.data) {
      formNode.data = {};
    }
    formNode.data.value = formData;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// 从节点结构转换为Markup
async function nodesToMarkup(nodesStructure) {
  if (!nodesStructure) {
    return '';
  }
  
  // 先检查是否有存储的节点数据
  const storedNode = nodeStorage.get(nodesStructure.cardKey);
  if (storedNode) {
    nodesStructure = storedNode;
  }
  
  // 递归处理节点结构
  async function processNode(node) {
    // 提取当前节点的ANX内容
    const nodeAnxContent = { ...node.config };
    
    // 处理子节点
    let childMarkup = '';
    if (node.nodes && node.nodes.length > 0) {
      // 递归处理每个子节点
      const childContents = await Promise.all(node.nodes.map(child => processNode(child)));
      childMarkup = childContents.join('\n\n');
    }
    
    // 转换当前节点为Markup
    let nodeMarkup = '';
    if (node.config.kind) {
      // 根据节点类型生成Markup
      switch (node.config.kind) {
        case 'form':
          nodeMarkup = node.config.title ? `## ${node.config.title}\n\n` : '';
          nodeMarkup += childMarkup;
          break;
        case 'board':
          nodeMarkup = childMarkup;
          break;
        case 'box':
          // 处理box类型，渲染模板内容
          if (node.config.title) {
            nodeMarkup = `## ${node.config.title}\n\n`;
          }
          
          // 处理dataset
          let boxData = node.config.data;
          if (!boxData && node.config.dataset) {
            try {
              // 直接使用dataset作为配置，支持url_dataset和uuid_dataset
              const { fetchDataset } = require('../../core/utils/dataset.js');
              const datasetData = await fetchDataset(node.config.dataset);
              // 直接使用返回的数组，因为fetchDataset已经返回了正确的数据格式
              boxData = datasetData || [];
              
              // 将数据存储到node的data.data中
              if (!node.data) {
                node.data = {};
              }
              node.data.data = boxData;
              // 更新node.config.data，以便后续使用
              node.config.data = boxData;
              // 更新存储中的节点数据
              nodeStorage.set(node.cardKey, node);
            } catch (error) {
              console.error('Error fetching box dataset:', error);
            }
          }
          
          if (boxData && Array.isArray(boxData) && boxData.length > 0) {
            for (let i = 0; i < boxData.length; i++) {
              const item = boxData[i];
              const templateContent = node.config.template || node.config.html;
              if (templateContent) {
                // 替换模板中的变量
                let parsedTemplate = templateContent;
                
                // 替换双大括号变量
                const doubleBracesRegex = /\{\{([^{}]+)\}\}/g;
                parsedTemplate = parsedTemplate.replace(doubleBracesRegex, (match, variable) => {
                  const value = getPropertyValue(item, variable.trim());
                  return value !== undefined ? value : match;
                });
                
                // 替换美元大括号变量
                const dollarBracesRegex = /\$\{([^{}]+)\}/g;
                parsedTemplate = parsedTemplate.replace(dollarBracesRegex, (match, variable) => {
                  const value = getPropertyValue(item, variable.trim());
                  return value !== undefined ? value : match;
                });
                
                // 替换单大括号变量
                const singleBracesRegex = /\{([^{}]+)\}/g;
                parsedTemplate = parsedTemplate.replace(singleBracesRegex, (match, variable) => {
                  const value = getPropertyValue(item, variable.trim());
                  return value !== undefined ? value : match;
                });
                
                // 用<x 0>这样的标签包裹每个box项
                nodeMarkup += `<x ${i}>
${parsedTemplate}
</x>\n\n`;
              }
            }
          } else if (node.config.html || node.config.template) {
            const templateContent = node.config.template || node.config.html;
            // 替换模板中的变量
            let parsedTemplate = templateContent;
            
            // 替换双大括号变量
            const doubleBracesRegex = /\{\{([^{}]+)\}\}/g;
            parsedTemplate = parsedTemplate.replace(doubleBracesRegex, (match, variable) => {
              const value = getPropertyValue(node.config, variable.trim());
              return value !== undefined ? value : match;
            });
            
            // 替换美元大括号变量
            const dollarBracesRegex = /\$\{([^{}]+)\}/g;
            parsedTemplate = parsedTemplate.replace(dollarBracesRegex, (match, variable) => {
              const value = getPropertyValue(node.config, variable.trim());
              return value !== undefined ? value : match;
            });
            
            // 替换单大括号变量
            const singleBracesRegex = /\{([^{}]+)\}/g;
            parsedTemplate = parsedTemplate.replace(singleBracesRegex, (match, variable) => {
              const value = getPropertyValue(node.config, variable.trim());
              return value !== undefined ? value : match;
            });
            
            nodeMarkup += `${parsedTemplate}\n\n`;
          }
          break;
        case 'input':
          const label = node.config.nick || 'Input';
          const value = node.data && node.data.value ? node.data.value : node.config.value || node.config.placeholder || '';
          nodeMarkup = `**${label}:** ${value}`;
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
          
          // 处理optionsSet中的dataset
          if (node.config.optionsSet && node.config.optionsSet.dataset) {
            try {
              // 直接使用dataset作为配置，支持url_dataset和uuid_dataset
              const { fetchDataset } = require('../../core/utils/dataset.js');
              const datasetData = await fetchDataset(node.config.optionsSet.dataset);
              
              // 检查datasetData是否有data属性，如果有，使用data属性作为选项数组
              let processedOptions = datasetData && datasetData.data ? datasetData.data : datasetData;
              
              // 确保processedOptions是一个数组
              if (Array.isArray(processedOptions)) {
                const selectedValue = node.data && node.data.value ? node.data.value : node.config.value;
                for (let index = 0; index < processedOptions.length; index++) {
                  const option = processedOptions[index];
                  // Get title and value using titleNick and valueNick if provided
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
            // 处理直接提供的options
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
          
          // 将options数据存储到node的data.options中
          if (!node.data) {
            node.data = {};
          }
          node.data.options = optionsData;
          // 更新存储中的节点数据
          nodeStorage.set(node.cardKey, node);
          
          nodeMarkup = optionsContent;
          break;
        case 'table':
          // 处理table类型，渲染表格内容
          if (node.config.title) {
            nodeMarkup = `## ${node.config.title}\n\n`;
          }
          
          // 处理dataset
          let tableData = node.config.data;
          if (!tableData && node.config.dataset) {
            try {
              // 直接使用dataset作为配置，支持url_dataset和uuid_dataset
              const { fetchDataset } = require('../../core/utils/dataset.js');
              const datasetData = await fetchDataset(node.config.dataset);
              // 直接使用返回的数组，因为fetchDataset已经返回了正确的数据格式
              tableData = datasetData || [];
              
              // 将数据存储到node的data.data中
              if (!node.data) {
                node.data = {};
              }
              node.data.data = tableData;
              // 更新node.config.data，以便后续使用
              node.config.data = tableData;
              // 更新存储中的节点数据
              nodeStorage.set(node.cardKey, node);
            } catch (error) {
              console.error('Error fetching table dataset:', error);
            }
          }
          
          // 生成Markup表格
          if (node.config.titles && Array.isArray(node.config.titles) && node.config.titles.length > 0) {
            // 过滤掉隐藏的列
            const visibleTitles = node.config.titles.filter(title => !title.hide);
            
            if (visibleTitles.length > 0) {
              // 生成表头
              const headers = visibleTitles.map(title => title.title).join(' | ');
              const separators = visibleTitles.map(() => '---').join(' | ');
              
              nodeMarkup += `| ${headers} |\n`;
              nodeMarkup += `| ${separators} |\n`;
              
              // 生成表格行
              if (tableData && Array.isArray(tableData)) {
                tableData.forEach(row => {
                  let rowContent = '';
                  
                  // 处理不同格式的行数据
                  if (Array.isArray(row)) {
                    // 处理 [{"nick": "id", "value": 1}, ...] 格式
                    visibleTitles.forEach(title => {
                      const cell = row.find(item => item.nick === title.nick);
                      rowContent += ` ${cell ? cell.value : ''} |`;
                    });
                  } else if (typeof row === 'object') {
                    // 处理 {"id": 1, "name": "John"} 格式
                    visibleTitles.forEach(title => {
                      rowContent += ` ${row[title.nick] || ''} |`;
                    });
                  }
                  
                  nodeMarkup += `|${rowContent}\n`;
                });
              } else {
                // 只有表头，没有数据
                nodeMarkup += `| ${visibleTitles.map(() => '').join(' | ')} |\n`;
              }
              
              nodeMarkup += '\n';
            }
          }
          break;
        case 'list':
          // 处理list类型，渲染列表内容
          if (node.config.title) {
            nodeMarkup = `## ${node.config.title}\n\n`;
          }
          
          const itemList = node.config.itemList || [];
          const listData = node.data && node.data.value ? node.data.value : (node.config.data || []);
          
          if (itemList.length > 0 && listData.length > 0) {
            // 生成表头
            const headers = itemList.map(item => item.title || item.nick || '').join(' | ');
            const separators = itemList.map(() => '---').join(' | ');
            
            nodeMarkup += `| ${headers} |\n`;
            nodeMarkup += `| ${separators} |\n`;
            
            // 生成数据行
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
        default:
          nodeMarkup = `<!-- ANX Component: ${node.config.kind} -->`;
      }
    }
    
    // 使用x标签包裹Markup内容，并添加kind和cardKey属性
    let tapAttribute = '';
    if (node.config.kind === 'box' && node.config.tapSet) {
      const tapSetTitle = node.config.tapSet.title || '';
      tapAttribute = ` tap="${tapSetTitle}"`;
    }
    return `<x ${node.config.kind || ''} ${node.cardKey}${tapAttribute}>
${nodeMarkup}
</x>`;
  }
  
  return await processNode(nodesStructure);
}

// API endpoint for converting ANX to Markup (POST)
app.post('/api/convert', async (req, res) => {
  try {
    let { anxContent, uuid_tile } = req.body;
    
    // 如果提供了uuid_tile，则从hub中获取anx config
    if (uuid_tile) {
      const hubFile = hubAnxMap.get(uuid_tile);
      if (hubFile) {
        anxContent = hubFile.anxContent;
      } else {
        return res.status(404).json({ error: 'ANX config not found for the given uuid_tile' });
      }
    }
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 检查是否已经为相同的ANX内容生成过节点结构
    let nodesStructure = anxHashToNodeMap.get(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中
      anxHashToNodeMap.set(anxHash, nodesStructure);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = nodeStorage.get(nodesStructure.cardKey);
    if (storedRootNode) {
      // 使用存储中的数据更新根节点
      Object.assign(nodesStructure, storedRootNode);
    }
    
    // 更新子节点，使用存储中的数据
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodesWithStoredData(nodesStructure.nodes);
    }
    
    // 从节点结构转换为Markup
    const markup = await nodesToMarkup(nodesStructure);
    
    res.json({ markup });
  } catch (error) {
    console.error('Error converting ANX to Markup:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.', details: error.message });
  }
});

// API endpoint for converting ANX to Markup (GET)
app.get('/api/convert', async (req, res) => {
  try {
    const { uuid_tile, uuid_card } = req.query;
    
    // 优先使用 uuid_tile，然后使用 uuid_card
    const uuid = uuid_tile || uuid_card;
    
    if (!uuid) {
      return res.status(400).json({ error: 'uuid_tile or uuid_card is required for GET request' });
    }
    
    // 从hub中获取anx config
    const hubFile = hubAnxMap.get(uuid);
    if (!hubFile) {
      return res.status(404).json({ error: `ANX config not found for the given uuid: ${uuid}` });
    }
    
    const anxContent = hubFile.anxContent;
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 检查是否已经为相同的ANX内容生成过节点结构
    let nodesStructure = anxHashToNodeMap.get(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中
      anxHashToNodeMap.set(anxHash, nodesStructure);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = nodeStorage.get(nodesStructure.cardKey);
    if (storedRootNode) {
      // 使用存储中的数据更新根节点
      Object.assign(nodesStructure, storedRootNode);
    }
    
    // 更新子节点，使用存储中的数据
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodesWithStoredData(nodesStructure.nodes);
    }
    
    // 从节点结构转换为Markup
    const markup = await nodesToMarkup(nodesStructure);

    res.json({ markup });
  } catch (error) {
    console.error('Error converting ANX to Markup (GET):', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.', details: error.message });
  }
});

// API endpoint for getting markup (GET) - new endpoint
app.get('/anxCore/getMarkup', async (req, res) => {
  try {
    const { uuid_tile, uuid_card } = req.query;
    
    // 优先使用 uuid_tile，然后使用 uuid_card
    const uuid = uuid_tile || uuid_card;
    
    if (!uuid) {
      return res.status(400).json({ error: 'uuid_tile or uuid_card is required' });
    }
    
    // 从hub中获取anx config
    const hubFile = hubAnxMap.get(uuid);
    if (!hubFile) {
      return res.status(404).json({ error: `ANX config not found for the given uuid: ${uuid}` });
    }
    
    const anxContent = hubFile.anxContent;
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 检查是否已经为相同的ANX内容生成过节点结构
    let nodesStructure = anxHashToNodeMap.get(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中
      anxHashToNodeMap.set(anxHash, nodesStructure);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = nodeStorage.get(nodesStructure.cardKey);
    if (storedRootNode) {
      // 使用存储中的数据更新根节点
      Object.assign(nodesStructure, storedRootNode);
    }
    
    // 更新子节点，使用存储中的数据
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodesWithStoredData(nodesStructure.nodes);
    }
    
    // 从节点结构转换为Markup
    const markup = await nodesToMarkup(nodesStructure);

    res.json({ markup });
  } catch (error) {
    console.error('Error in /anxCore/getMarkup:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.', details: error.message });
  }
});

// API endpoint for getting markup (POST) - new endpoint
app.post('/anxCore/getMarkup', async (req, res) => {
  try {
    let { anxContent, uuid_tile } = req.body;
    
    // 如果提供了uuid_tile，则从hub中获取anx config
    if (uuid_tile) {
      const hubFile = hubAnxMap.get(uuid_tile);
      if (hubFile) {
        anxContent = hubFile.anxContent;
      } else {
        return res.status(404).json({ error: 'ANX config not found for the given uuid_tile' });
      }
    }
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 检查是否已经为相同的ANX内容生成过节点结构
    let nodesStructure = anxHashToNodeMap.get(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中
      anxHashToNodeMap.set(anxHash, nodesStructure);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = nodeStorage.get(nodesStructure.cardKey);
    if (storedRootNode) {
      // 使用存储中的数据更新根节点
      Object.assign(nodesStructure, storedRootNode);
    }
    
    // 更新子节点，使用存储中的数据
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodesWithStoredData(nodesStructure.nodes);
    }
    
    // 从节点结构转换为Markup
    const markup = await nodesToMarkup(nodesStructure);
    
    res.json({ markup });
  } catch (error) {
    console.error('Error in /anxCore/getMarkup (POST):', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.', details: error.message });
  }
});

// 递归更新节点结构，使用存储中的数据
function updateNodesWithStoredData(nodes) {
  if (!Array.isArray(nodes)) return;
  
  nodes.forEach(node => {
    // 检查是否有存储的节点数据
    const storedNode = nodeStorage.get(node.cardKey);
    if (storedNode) {
      // 使用存储中的数据更新节点
      Object.assign(node, storedNode);
    }
    // 递归更新子节点
    if (node.nodes && node.nodes.length > 0) {
      updateNodesWithStoredData(node.nodes);
    }
  });
}

// 递归存储所有节点的cardKey和config，以及完整的节点结构
function storeCardNodes(nodes) {
  if (!Array.isArray(nodes)) return;
  
  nodes.forEach(node => {
    // 存储当前节点
    if (node.cardKey && node.config) {
      cardStorage.set(node.cardKey, node.config);
      nodeStorage.set(node.cardKey, node); // 存储完整的节点结构
    }
    // 递归存储子节点
    if (node.nodes && node.nodes.length > 0) {
      storeCardNodes(node.nodes);
    }
  });
}

// API endpoint for converting ANX to nodes structure
app.post('/api/convert-to-nodes', async (req, res) => {
  try {
    let { anxContent, uuid_tile } = req.body;
    
    // 如果提供了uuid_tile，则从hub中获取anx config
    if (uuid_tile) {
      const hubFile = hubAnxMap.get(uuid_tile);
      if (hubFile) {
        anxContent = hubFile.anxContent;
      } else {
        return res.status(404).json({ error: 'ANX config not found for the given uuid_tile' });
      }
    }
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 检查是否已经为相同的ANX内容生成过节点结构
    let nodesStructure = anxHashToNodeMap.get(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中
      anxHashToNodeMap.set(anxHash, nodesStructure);
    }
    
    // 处理节点中的 dataset
    async function processNodeDataset(node) {
      if (node.config && node.config.dataset) {
        try {
          // 直接使用dataset作为配置，支持url_dataset和uuid_dataset
          const { fetchDataset } = require('../../core/utils/dataset.js');
          console.log('Processing dataset for node:', node.cardKey, 'with config:', node.config.dataset);
          const datasetData = await fetchDataset(node.config.dataset);
          // 直接使用返回的数组，因为fetchDataset已经返回了正确的数据格式
          let processedData = datasetData || [];
          console.log('Fetched dataset data:', processedData);
          
          // 如果dataset获取失败且节点有原始数据，则使用原始数据
          if (processedData.length === 0 && node.config.data && Array.isArray(node.config.data)) {
            processedData = node.config.data;
            console.log('Using original data instead of empty dataset:', processedData);
          }
          
          // 将数据存储到node的data.data中
          if (!node.data) {
            node.data = {};
          }
          node.data.data = processedData;
          // 更新node.config.data，以便后续使用
          node.config.data = processedData;
          // 更新存储中的节点数据
          nodeStorage.set(node.cardKey, node);
          console.log('Updated node data:', node.data);
        } catch (error) {
          console.error('Error fetching node dataset:', error);
          // 如果获取dataset时出错且节点有原始数据，则使用原始数据
          if (node.config.data && Array.isArray(node.config.data)) {
            if (!node.data) {
              node.data = {};
            }
            node.data.data = node.config.data;
            // 更新存储中的节点数据
            nodeStorage.set(node.cardKey, node);
            console.log('Using original data due to dataset fetch error:', node.data);
          }
        }
      }
      
      // 递归处理子节点
      if (node.nodes && node.nodes.length > 0) {
        for (const childNode of node.nodes) {
          await processNodeDataset(childNode);
        }
      }
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = nodeStorage.get(nodesStructure.cardKey);
    if (storedRootNode) {
      // 使用存储中的数据更新根节点
      Object.assign(nodesStructure, storedRootNode);
    }
    
    // 更新子节点，使用存储中的数据
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodesWithStoredData(nodesStructure.nodes);
    }
    
    // 处理根节点和子节点的 dataset
    await processNodeDataset(nodesStructure);
    
    // 存储根节点
    if (nodesStructure.cardKey && nodesStructure.config) {
      cardStorage.set(nodesStructure.cardKey, nodesStructure.config);
      nodeStorage.set(nodesStructure.cardKey, nodesStructure); // 存储完整的根节点结构
    }
    
    // 存储子节点
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      storeCardNodes(nodesStructure.nodes);
    }
    
    res.json({ nodes: nodesStructure });
  } catch (error) {
    console.error('Error converting ANX to nodes structure:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.' });
  }
});

// API endpoint for executing CLI commands
app.post('/api/execute-cli', (req, res) => {
  try {
    const { command } = req.body;
    
    // Parse CLI command
    const parts = command.trim().split(/\s+/);
    if (parts.length < 3 || parts[0] !== 'anx') {
      const response = {
        cardKey: '',
        action: '',
        result: 'Invalid CLI command format. Use: anx <cardKey> <action> [params...]'
      };
      
      // 记录日志
      cliLogs.unshift({
        timestamp: new Date().toISOString(),
        command: command,
        status: 'error',
        response: response
      });
      
      // 限制日志数量
      if (cliLogs.length > MAX_LOGS) {
        cliLogs.pop();
      }
      
      return res.json(response);
    }
    
    let cardKey = parts[1];
    let action = parts[2];
    const params = parts.slice(3);
    
    // 解析cardKey中的索引部分，如card_1774589249090_8899[0]
    let itemIndex = null;
    const indexMatch = cardKey.match(/^(.*)\[(\d+)\]$/);
    if (indexMatch) {
      cardKey = indexMatch[1];
      itemIndex = parseInt(indexMatch[2], 10);
    }
    
    // Execute CLI command based on action
    let result = '';
    switch (action) {
      case 'get_config':
        // 从存储中获取cardKey对应的config
        const config = cardStorage.get(cardKey);
        if (config) {
          result = config; // 直接返回config内容
        } else {
          result = `No config found for cardKey: ${cardKey}`;
        }
        break;
      case 'get_node':
        // 从存储中获取cardKey对应的完整节点结构
        const node = nodeStorage.get(cardKey);
        if (node) {
          result = node; // 直接返回完整的节点结构
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'get_form':
        // 从存储中获取cardKey对应的节点
        const getFormNode = nodeStorage.get(cardKey);
        if (getFormNode) {
          // 返回表单的完整数据
          result = getFormNode.data || { value: {} };
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'set_form':
        // 从存储中获取cardKey对应的节点
        const formNode = nodeStorage.get(cardKey);
        if (formNode) {
          try {
            // 检查是否有--replace参数
            const hasReplaceFlag = params.includes('--replace');
            // 移除--replace参数
            const jsonParams = params.filter(param => param !== '--replace');
            
            // 解析JSON参数，移除两端的单引号
            let jsonString = jsonParams.join(' ');
            // 移除两端的单引号
            if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
              jsonString = jsonString.substring(1, jsonString.length - 1);
            }
            const formData = JSON.parse(jsonString);
            // 更新表单的data.value
            if (!formNode.data) {
              formNode.data = { value: {} };
            }
            
            if (hasReplaceFlag) {
              // 全量覆盖
              formNode.data.value = formData;
            } else {
              // 增量更新
              formNode.data.value = { ...formNode.data.value, ...formData };
            }
            
            // 同步更新子组件的value
            function updateChildNodesValue(nodes) {
              for (let node of nodes) {
                const nodeNick = node.config && node.config.nick;
                if (nodeNick && formData[nodeNick] !== undefined) {
                  if (!node.data) {
                    node.data = {};
                  }
                  node.data.value = formData[nodeNick];
                }
                // 递归处理子节点的子节点
                if (node.nodes && node.nodes.length > 0) {
                  updateChildNodesValue(node.nodes);
                }
              }
            }
            if (formNode.nodes && formNode.nodes.length > 0) {
              updateChildNodesValue(formNode.nodes);
            }
            
            // 触发formula更新
            updateFormulas(formNode);
            
            // 更新存储
            nodeStorage.set(cardKey, formNode);
            
            // 同步更新 anxHashToNodeMap 中的节点
            for (let [anxHash, rootNode] of anxHashToNodeMap) {
              if (rootNode.cardKey === cardKey) {
                // 更新根节点
                if (!rootNode.data) {
                  rootNode.data = { value: {} };
                }
                rootNode.data.value = formNode.data.value;
                // 更新根节点的子组件
                if (rootNode.nodes && rootNode.nodes.length > 0) {
                  updateChildNodesValue(rootNode.nodes);
                }
                break;
              }
              // 递归查找并更新子节点
              function updateNodeInAnxHashMap(nodes) {
                for (let node of nodes) {
                  if (node.cardKey === cardKey) {
                    if (!node.data) {
                      node.data = { value: {} };
                    }
                    node.data.value = formNode.data.value;
                    // 更新该节点的子组件
                    if (node.nodes && node.nodes.length > 0) {
                      updateChildNodesValue(node.nodes);
                    }
                    return true;
                  }
                  if (node.nodes && node.nodes.length > 0) {
                    if (updateNodeInAnxHashMap(node.nodes)) {
                      return true;
                    }
                  }
                }
                return false;
              }
              if (rootNode.nodes && rootNode.nodes.length > 0) {
                if (updateNodeInAnxHashMap(rootNode.nodes)) {
                  break;
                }
              }
            }
            
            result = { 
              message: `Form data ${hasReplaceFlag ? 'replaced' : 'updated'} successfully`, 
              data: formNode.data.value 
            };
          } catch (parseError) {
            result = `Invalid JSON format: ${parseError.message}`;
          }
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'fill':
        // 从存储中获取cardKey对应的节点
        const fillNode = nodeStorage.get(cardKey);
        if (fillNode) {
          // 获取填充值
          const value = params.join(' ');
          // 更新节点的data.value
          if (!fillNode.data) {
            fillNode.data = { value: {} };
          }
          fillNode.data.value = value;
          // 更新存储
          nodeStorage.set(cardKey, fillNode);
          result = { message: 'Value filled successfully', value: value };
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'input':
        // 从存储中获取cardKey对应的节点
        const inputNode = nodeStorage.get(cardKey);
        if (inputNode) {
          // 获取输入值
          const value = params.join(' ');
          // 更新节点的data.value
          if (!inputNode.data) {
            inputNode.data = { value: {} };
          }
          // 如果是字符串类型，追加输入值
          if (typeof inputNode.data.value === 'string') {
            inputNode.data.value += value;
          } else {
            inputNode.data.value = value;
          }
          // 更新存储
          nodeStorage.set(cardKey, inputNode);
          result = { message: 'Input added successfully', value: inputNode.data.value };
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'tap':
        // 从存储中获取cardKey对应的节点
        const tapNode = nodeStorage.get(cardKey);
        if (tapNode) {
          // 检查节点是否有tapSet配置
          const tapSet = tapNode.config.tapSet;
          if (tapSet) {
            // 处理itemIndex
            let itemData = null;
            if (itemIndex !== null) {
              // 检查节点是否有数据数组
              const nodeData = tapNode.data?.data || tapNode.config.data;
              if (Array.isArray(nodeData) && itemIndex < nodeData.length) {
                itemData = nodeData[itemIndex];
              } else {
                result = `Invalid item index ${itemIndex} for node ${cardKey}`;
                break;
              }
            }
            
            // 处理tapSet中的动作
            if (tapSet.navigateTo) {
              const path = tapSet.navigateTo.path || '';
              let paramsString = '';
              
              // 处理paramMap
              if (tapSet.navigateTo.paramMap && itemData) {
                const paramMap = tapSet.navigateTo.paramMap;
                const paramArray = [];
                
                for (const key in paramMap) {
                  const valuePath = paramMap[key];
                  // 从itemData中获取值
                  let value = itemData;
                  for (const prop of valuePath.split('.')) {
                    if (value && typeof value === 'object') {
                      value = value[prop];
                    } else {
                      value = undefined;
                      break;
                    }
                  }
                  if (value !== undefined) {
                    paramArray.push(`${key}=${encodeURIComponent(value)}`);
                  }
                }
                
                if (paramArray.length > 0) {
                  paramsString = '?' + paramArray.join('&');
                }
              }
              
              const fullPath = path + paramsString;
              result = { 
                message: 'Tap action executed successfully', 
                action: 'navigateTo',
                path: fullPath
              };
            } else if (tapSet.setTimeout) {
              // 处理setTimeout动作
              const action = tapSet.setTimeout.action || '';
              const delay = tapSet.setTimeout.delay || 0;
              result = { 
                message: 'Tap action executed successfully', 
                action: 'setTimeout',
                delay: delay,
                actionString: action
              };
            } else {
              result = 'No valid tap action found in tapSet';
            }
          } else {
            result = `No tapSet configuration found for node ${cardKey}`;
          }
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'clear_form':
        // 从存储中获取cardKey对应的节点
        const clearFormNode = nodeStorage.get(cardKey);
        if (clearFormNode) {
          // 清空表单的data.value
          if (!clearFormNode.data) {
            clearFormNode.data = { value: {} };
          } else {
            clearFormNode.data.value = {};
          }
          
          // 同步更新子组件的value
          function clearChildNodesValue(nodes) {
            for (let node of nodes) {
              if (node.data) {
                node.data.value = '';
              }
              // 递归处理子节点的子节点
              if (node.nodes && node.nodes.length > 0) {
                clearChildNodesValue(node.nodes);
              }
            }
          }
          if (clearFormNode.nodes && clearFormNode.nodes.length > 0) {
            clearChildNodesValue(clearFormNode.nodes);
          }
          
          // 更新存储
          nodeStorage.set(cardKey, clearFormNode);
          
          // 同步更新 anxHashToNodeMap 中的节点
          for (let [anxHash, rootNode] of anxHashToNodeMap) {
            if (rootNode.cardKey === cardKey) {
              // 更新根节点
              if (!rootNode.data) {
                rootNode.data = { value: {} };
              } else {
                rootNode.data.value = {};
              }
              // 更新根节点的子组件
              if (rootNode.nodes && rootNode.nodes.length > 0) {
                clearChildNodesValue(rootNode.nodes);
              }
              break;
            }
            // 递归查找并更新子节点
            function clearNodeInAnxHashMap(nodes) {
              for (let node of nodes) {
                if (node.cardKey === cardKey) {
                  if (!node.data) {
                    node.data = { value: {} };
                  } else {
                    node.data.value = {};
                  }
                  // 更新该节点的子组件
                  if (node.nodes && node.nodes.length > 0) {
                    clearChildNodesValue(node.nodes);
                  }
                  return true;
                }
                if (node.nodes && node.nodes.length > 0) {
                  if (clearNodeInAnxHashMap(node.nodes)) {
                    return true;
                  }
                }
              }
              return false;
            }
            if (rootNode.nodes && rootNode.nodes.length > 0) {
              if (clearNodeInAnxHashMap(rootNode.nodes)) {
                break;
              }
            }
          }
          
          result = { message: 'Form data cleared successfully' };
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      default:
        result = `Action ${action} is not implemented yet.`;
    }
    
    const response = {
      cardKey: cardKey,
      action: action,
      result: result
    };
    
    // 记录日志
    cliLogs.unshift({
      timestamp: new Date().toISOString(),
      command: command,
      status: 'success',
      response: response
    });
    
    // 限制日志数量
    if (cliLogs.length > MAX_LOGS) {
      cliLogs.pop();
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error executing CLI command:', error);
    const response = {
      cardKey: '',
      action: '',
      result: 'Error executing CLI command. Please check your input.'
    };
    
    // 记录日志
    cliLogs.unshift({
      timestamp: new Date().toISOString(),
      command: req.body.command || '',
      status: 'error',
      response: response,
      error: error.message
    });
    
    // 限制日志数量
    if (cliLogs.length > MAX_LOGS) {
      cliLogs.pop();
    }
    
    res.status(400).json(response);
  }
});

// API endpoint for getting public docs list
app.get('/docs-public/list', (req, res) => {
  try {
    const docsListPath = path.join(__dirname, '../../docs-public/docs-public-list.json');
    const docsList = JSON.parse(fs.readFileSync(docsListPath, 'utf8'));
    res.json({
      ...docsList,
      manual: "如何获取文档详情内容：使用 /docs-public/docs?fileName=文件名 接口获取文档内容"
    });
  } catch (error) {
    console.error('Error getting docs list:', error);
    res.status(500).json({ error: 'Failed to get docs list' });
  }
});

// API endpoint for getting CLI commands
app.get('/api/cli/commands', (req, res) => {
  try {
    const commandsPath = path.join(__dirname, '../../core/cli/commands.json');
    const commands = JSON.parse(fs.readFileSync(commandsPath, 'utf8'));
    res.json(commands);
  } catch (error) {
    console.error('Error getting CLI commands:', error);
    res.status(500).json({ error: 'Failed to get CLI commands' });
  }
});

// API endpoint for getting public doc content
app.get('/docs-public/docs', (req, res) => {
  try {
    const { fileName } = req.query;
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    const docPath = path.join(__dirname, '../../docs-public', fileName);
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Get doc info from docs list
    const docsListPath = path.join(__dirname, '../../docs-public/docs-public-list.json');
    const docsList = JSON.parse(fs.readFileSync(docsListPath, 'utf8'));
    const docInfo = docsList.list.find(doc => doc.fileName === fileName) || {};
    
    res.json({
      content,
      title: docInfo.title || fileName,
      desc: docInfo.desc || ''
    });
  } catch (error) {
    console.error('Error getting doc content:', error);
    res.status(404).json({ error: 'Doc not found' });
  }
});

// API endpoint for generating node visualization
app.post('/api/visualize-node', (req, res) => {
  try {
    const { node } = req.body;
    if (!node) {
      return res.status(400).json({ error: 'node is required' });
    }
    
    // 使用存储中的节点数据进行可视化渲染
    let nodeToVisualize = { ...node };
    
    // 检查根节点是否有存储的数据
    const storedRootNode = nodeStorage.get(node.cardKey);
    if (storedRootNode) {
      nodeToVisualize = storedRootNode;
    }
    
    // 更新子节点，使用存储中的数据
    if (nodeToVisualize.nodes && nodeToVisualize.nodes.length > 0) {
      updateNodesWithStoredData(nodeToVisualize.nodes);
    }
    
    const html = generateNodeVisualization(nodeToVisualize);
    const css = generateVisualizationCSS();
    
    res.json({
      html,
      css
    });
  } catch (error) {
    console.error('Error generating node visualization:', error);
    res.status(500).json({ error: 'Failed to generate node visualization' });
  }
});

// API endpoint for getting CLI commands list
app.get('/cli/commands', (req, res) => {
  try {
    const commands = anxCLI.getCommands();
    res.json(commands);
  } catch (error) {
    console.error('Error getting CLI commands:', error);
    res.status(500).json({ error: 'Failed to get CLI commands' });
  }
});

// API endpoint for getting CLI logs
app.get('/api/cli/logs', (req, res) => {
  try {
    res.json({ logs: cliLogs });
  } catch (error) {
    console.error('Error getting CLI logs:', error);
    res.status(500).json({ error: 'Failed to get CLI logs' });
  }
});

// API endpoint for getting dataset files
app.get('/dataset/:filename', (req, res) => {
  try {
    let { filename } = req.params;
    
    // 如果文件名没有 .json 后缀，自动添加
    if (!filename.endsWith('.json')) {
      filename = filename + '.json';
    }
    
    const datasetPath = path.join(__dirname, '../dataset', filename);
    
    // Check if file exists
    if (!fs.existsSync(datasetPath)) {
      return res.status(404).json({ error: 'Dataset file not found' });
    }
    
    // Read and parse the JSON file
    const content = fs.readFileSync(datasetPath, 'utf8');
    const dataset = JSON.parse(content);
    
    res.json(dataset);
  } catch (error) {
    console.error('Error getting dataset:', error);
    res.status(500).json({ error: 'Failed to get dataset' });
  }
});

// API endpoint for updating node data
app.post('/api/update-node-data', (req, res) => {
  try {
    const { cardKey, field, value } = req.body;
    
    if (!cardKey || !field) {
      return res.status(400).json({ error: 'cardKey and field are required' });
    }
    
    // 查找并更新节点
    let nodeUpdated = false;
    let updatedRootNode = null;
    let parentFormNode = null;
    let updatedChildNode = null;
    
    function updateNodeInStructure(nodes, parentNode = null) {
      for (let node of nodes) {
        if (node.cardKey === cardKey) {
          // 更新节点数据
          if (!node.data) {
            node.data = {};
          }
          node.data[field] = value;
          nodeUpdated = true;
          updatedChildNode = node;
          
          // 如果父节点是 form，记录父节点
          if (parentNode && parentNode.config && parentNode.config.kind === 'form') {
            parentFormNode = parentNode;
          }
          
          return true;
        }
        
        // 递归查找子节点
        if (node.nodes && node.nodes.length > 0) {
          if (updateNodeInStructure(node.nodes, node)) {
            // 如果父节点是 form，记录父节点
            if (parentNode && parentNode.config && parentNode.config.kind === 'form') {
              parentFormNode = parentNode;
            }
            return true;
          }
        }
      }
      return false;
    }
    
    // 在所有存储的节点中查找
    for (let [anxHash, rootNode] of anxHashToNodeMap) {
      if (rootNode.cardKey === cardKey) {
        if (!rootNode.data) {
          rootNode.data = {};
        }
        rootNode.data[field] = value;
        // 更新nodeStorage中的节点
        nodeStorage.set(cardKey, rootNode);
        nodeUpdated = true;
        updatedRootNode = rootNode;
        break;
      }
      
      if (rootNode.nodes && rootNode.nodes.length > 0) {
        if (updateNodeInStructure(rootNode.nodes, rootNode)) {
          // 更新nodeStorage中的节点
          nodeStorage.set(cardKey, updatedChildNode);
          nodeUpdated = true;
          updatedRootNode = rootNode;
          break;
        }
      }
    }
    
    if (!nodeUpdated) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // 如果更新了子组件且有父 form 组件，同步更新 form 的 value
    if (updatedChildNode && parentFormNode) {
      if (!parentFormNode.data) {
        parentFormNode.data = {};
      }
      if (!parentFormNode.data.value) {
        parentFormNode.data.value = {};
      }
      
      // 获取子组件的 nick
      const childNick = updatedChildNode.config && updatedChildNode.config.nick;
      if (childNick) {
        parentFormNode.data.value[childNick] = value;
      }
      
      // 触发formula更新
      updateFormulas(parentFormNode);
      
      // 同步更新子组件的formula字段值
      if (parentFormNode.nodes && parentFormNode.nodes.length > 0) {
        for (const node of parentFormNode.nodes) {
          if (node.config && node.config.formula && node.config.nick) {
            const nick = node.config.nick;
            const formulaValue = parentFormNode.data.value[nick];
            if (formulaValue !== undefined) {
              if (!node.data) {
                node.data = {};
              }
              node.data.value = formulaValue;
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Node data updated successfully',
      nodes: updatedRootNode
    });
  } catch (error) {
    console.error('Error updating node data:', error);
    res.status(500).json({ error: 'Failed to update node data' });
  }
});

// 通过uuid加载hub中的anx config
app.get('/api/hub/:uuid', (req, res) => {
  try {
    const { uuid } = req.params;
    const hubFile = hubAnxMap.get(uuid);
    
    if (hubFile) {
      res.json({
        success: true,
        data: hubFile
      });
    } else {
      res.json({
        success: false,
        message: 'ANX config not found for the given uuid'
      });
    }
  } catch (error) {
    console.error('Error loading hub anx config:', error);
    res.status(500).json({ error: 'Failed to load hub anx config' });
  }
});

// 获取所有hub中的anx config列表
app.get('/api/hub', (req, res) => {
  try {
    const hubList = Array.from(hubAnxMap.values()).map(hubFile => ({
      uuid: hubFile.uuid,
      name: hubFile.name
    }));
    
    res.json({
      success: true,
      data: hubList
    });
  } catch (error) {
    console.error('Error loading hub list:', error);
    res.status(500).json({ error: 'Failed to load hub list' });
  }
});

// 文件上传API
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 为了测试，返回一个模拟的文件URL
    // 实际生产环境中，这里应该使用OSS上传工具上传文件
    const fileUrl = `https://example.com/uploads/${Date.now()}_${req.file.originalname}`;
    
    res.json({
      success: true,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// 接收求职表单提交结果的API
app.post('/api/job-form/submit', (req, res) => {
  try {
    const formData = req.body;
    console.log('Received job form submission:', formData);
    
    // 这里可以添加处理逻辑，比如存储到数据库
    
    res.json({
      success: true,
      message: 'Job form submitted successfully',
      data: formData
    });
  } catch (error) {
    console.error('Error processing job form submission:', error);
    res.status(500).json({ error: 'Failed to process job form submission' });
  }
});

// 加载hub文件
loadHubFiles();

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
