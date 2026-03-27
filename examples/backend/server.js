const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import the anxToMarkdown, anxToNodes functions and anxCLI from the core module
const { anxToMarkdown, anxToNodes, anxCLI } = require('../../core/index.js');
const { generateNodeVisualization, generateVisualizationCSS } = require('../../view/index.js');

const app = express();
const PORT = 7887;

// 存储cardKey及其对应的config信息
const cardStorage = new Map();
// 存储完整的节点结构
const nodeStorage = new Map();
// 存储基于ANX内容的哈希值到节点结构的映射
const anxHashToNodeMap = new Map();

// 生成ANX内容的哈希值
function generateAnxHash(anxContent) {
  const crypto = require('crypto');
  const jsonString = JSON.stringify(anxContent);
  return crypto.createHash('md5').update(jsonString).digest('hex');
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

// Middleware
app.use(cors());
app.use(express.json());

// 从节点结构转换为Markdown
async function nodesToMarkdown(nodesStructure) {
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
    let childMarkdown = '';
    if (node.nodes && node.nodes.length > 0) {
      // 递归处理每个子节点
      const childContents = await Promise.all(node.nodes.map(child => processNode(child)));
      childMarkdown = childContents.join('\n\n');
    }
    
    // 转换当前节点为Markdown
    let nodeMarkdown = '';
    if (node.config.kind) {
      // 根据节点类型生成Markdown
      switch (node.config.kind) {
        case 'form':
          nodeMarkdown = node.config.title ? `## ${node.config.title}\n\n` : '';
          nodeMarkdown += childMarkdown;
          break;
        case 'board':
          nodeMarkdown = childMarkdown;
          break;
        case 'box':
          // 处理box类型，渲染模板内容
          if (node.config.title) {
            nodeMarkdown = `## ${node.config.title}\n\n`;
          }
          
          if (node.config.data && Array.isArray(node.config.data) && node.config.data.length > 0) {
            for (let i = 0; i < node.config.data.length; i++) {
              const item = node.config.data[i];
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
                nodeMarkdown += `<x ${i}>
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
            
            nodeMarkdown += `${parsedTemplate}\n\n`;
          }
          break;
        case 'input':
          const label = node.config.nick || 'Input';
          const value = node.data && node.data.value ? node.data.value : node.config.value || node.config.placeholder || '';
          nodeMarkdown = `**${label}:** ${value}`;
          break;
        case 'textarea':
          const textareaLabel = node.config.nick || 'Textarea';
          const textareaValue = node.data && node.data.value ? node.data.value : node.config.value || node.config.placeholder || '';
          nodeMarkdown = `**${textareaLabel}:**\n\n\`\`\`\n${textareaValue}\n\`\`\``;
          break;
        case 'button':
          const buttonLabel = node.config.label || 'Button';
          const action = node.config.action || '#';
          nodeMarkdown = `[${buttonLabel}](${action})`;
          break;
        case 'text':
          nodeMarkdown = node.data && node.data.value ? node.data.value : node.config.value || '';
          break;
        case 'date':
          const dateLabel = node.config.nick || 'Date';
          const dateValue = node.data && node.data.value ? node.data.value : node.config.value || node.config.placeholder || '';
          nodeMarkdown = `**${dateLabel}:** ${dateValue}`;
          break;
        case 'checkbox':
          const checkboxLabel = node.config.nick ? `**${node.config.nick}:**\n\n` : '';
          let checkboxContent = checkboxLabel;
          if (node.config.options && Array.isArray(node.config.options)) {
            const checkboxValue = node.data && node.data.value ? node.data.value : node.config.value || [];
            node.config.options.forEach(option => {
              const isChecked = Array.isArray(checkboxValue) && checkboxValue.includes(option.value);
              checkboxContent += `${isChecked ? '✓ ' : '- '}${option.title}\n`;
            });
          }
          nodeMarkdown = checkboxContent;
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
                for (const option of processedOptions) {
                  // Get title and value using titleNick and valueNick if provided
                  const titleNick = node.config.optionsSet?.titleNick || 'title';
                  const valueNick = node.config.optionsSet?.valueNick || 'value';
                  const optionTitle = option[titleNick] || option.title || option.label || option.value || 'Unknown';
                  const optionValue = option[valueNick] || option.value;
                  
                  optionsContent += `- ${optionTitle}\n`;
                  optionsData.push({ title: optionTitle, value: optionValue });
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
            for (const option of node.config.options) {
              const optionTitle = option.title || option.label || option.value || 'Unknown';
              const optionValue = option.value;
              
              optionsContent += `- ${optionTitle}\n`;
              optionsData.push({ title: optionTitle, value: optionValue });
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
          
          nodeMarkdown = optionsContent;
          break;
        case 'table':
          // 处理table类型，渲染表格内容
          if (node.config.title) {
            nodeMarkdown = `## ${node.config.title}\n\n`;
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
          
          // 生成Markdown表格
          if (node.config.titles && Array.isArray(node.config.titles) && node.config.titles.length > 0) {
            // 过滤掉隐藏的列
            const visibleTitles = node.config.titles.filter(title => !title.hide);
            
            if (visibleTitles.length > 0) {
              // 生成表头
              const headers = visibleTitles.map(title => title.title).join(' | ');
              const separators = visibleTitles.map(() => '---').join(' | ');
              
              nodeMarkdown += `| ${headers} |\n`;
              nodeMarkdown += `| ${separators} |\n`;
              
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
                  
                  nodeMarkdown += `|${rowContent}\n`;
                });
              } else {
                // 只有表头，没有数据
                nodeMarkdown += `| ${visibleTitles.map(() => '').join(' | ')} |\n`;
              }
              
              nodeMarkdown += '\n';
            }
          }
          break;
        default:
          nodeMarkdown = `<!-- ANX Component: ${node.config.kind} -->`;
      }
    }
    
    // 使用x标签包裹Markdown内容，并添加kind和cardKey属性
    return `<x ${node.config.kind || ''} ${node.cardKey}>
${nodeMarkdown}
</x>`;
  }
  
  return await processNode(nodesStructure);
}

// API endpoint for converting ANX to Markdown
app.post('/api/convert', async (req, res) => {
  try {
    const { anxContent } = req.body;
    
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
    
    // 从节点结构转换为Markdown
    const markdown = await nodesToMarkdown(nodesStructure);
    
    res.json({ markdown });
  } catch (error) {
    console.error('Error converting ANX to Markdown:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.' });
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
app.post('/api/convert-to-nodes', (req, res) => {
  try {
    const { anxContent } = req.body;
    
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
      return res.json({
        cardKey: '',
        action: '',
        result: 'Invalid CLI command format. Use: anx <cardKey> <action> [params...]'
      });
    }
    
    const [, cardKey, action, ...params] = parts;
    
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
      default:
        result = `Action ${action} is not implemented yet.`;
    }
    
    res.json({
      cardKey: cardKey,
      action: action,
      result: result
    });
  } catch (error) {
    console.error('Error executing CLI command:', error);
    res.status(400).json({
      cardKey: '',
      action: '',
      result: 'Error executing CLI command. Please check your input.'
    });
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
        nodeUpdated = true;
        updatedRootNode = rootNode;
        break;
      }
      
      if (rootNode.nodes && rootNode.nodes.length > 0) {
        if (updateNodeInStructure(rootNode.nodes, rootNode)) {
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

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
