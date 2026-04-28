const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Import the anxToMarkup, anxToNodes functions and anxCLI from the core module
const { anxToMarkup, anxToNodes, nodesToMarkup, anxCLI } = require('../../core/index.js');
const { generateNodeVisualization, generateVisualizationCSS } = require('../../view/index.js');
const { uploadImageToOSS } = require('../../view/utils/oss.js');
const { handleTapSet, handleTriggerSet } = require('../../core/utils/trigger-and-tap.js');
// Import hub module for tile management
const { getAllTiles, getTileByUuid, getTileConfig } = require('../hub/hub.js');

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const PORT = 7887;

// 存储cardKey及其对应的config信息
const cardStorage = new Map();
// 导入节点存储模块
const { setNode, getNode, updateNodeData, getNodeData, deleteNode, clearNodes, getAllNodes, getNodeCount, hasNode } = require('../../core/app/node.js');
const { generateUuidPage, generateCardKey, addPage, getPage, getPageWithNodes, savePageNodes, getPagesByTile, getPagesByUrlTile, getPagesByVisitor, getAllPages, updatePage, deletePage, getPageCount, getLastPageForVisitor, getTilePageUUID, getTilePage } = require('../../core/app/pageManager.js');
const { setHubAnxMap, processAnxContent } = require('../../core/utils/tile.js');
const { processNodeDataset } = require('../../core/utils/dataset-processor.js');
const { generateAnxHash, getNodesByHash, setNodesByHash, anxHashToNodeMap } = require('../../core/utils/hashNode.js');
// 存储hub中的anx config
const hubAnxMap = new Map();

// 导入日志模块
const { logToSystem, logError, readLogs } = require('../../core/utils/log.js');




// 从URL或本地加载tile配置
async function loadTileFromUrl(uuid) {
  const result = await getTileConfig(uuid);
  if (result.success) {
    hubAnxMap.set(result.data.uuid, result.data);
    console.log(`Loaded tile from ${result.source}: ${result.data.name || 'Unknown'} (${result.data.uuid})`);
    return true;
  }
  return false;
}

// 加载hub文件
async function loadHubFiles() {
  try {
    const tiles = getAllTiles();
    for (const tile of tiles) {
      if (hubAnxMap.has(tile.uuid)) {
        continue;
      }
      const result = await getTileConfig(tile.uuid);
      if (result.success) {
        hubAnxMap.set(result.data.uuid, result.data);
        console.log(`Loaded hub file from ${result.source}: ${tile.name} (${tile.uuid})`);
      }
    }
    console.log(`Loaded ${hubAnxMap.size} hub files`);
    setHubAnxMap(hubAnxMap);
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
app.use(cors({
  origin: ['http://localhost:17887', 'http://localhost:17888', 'http://localhost:7887', 'http://127.0.0.1:17887', 'http://127.0.0.1:17888', 'http://127.0.0.1:7887'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// API endpoint for converting ANX to Markup (POST)
app.post('/api/convert', async (req, res) => {
  try {
    let { anxContent, uuid_tile, url_tile } = req.body;
    
    // 如果提供了 url_tile，从指定URL获取配置
    if (url_tile) {
      try {
        const response = await fetch(url_tile);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const config = result.config || result;
        // 支持两种格式：
        // 1. {uuid: "...", anxContent: {...}}
        // 2. {kind: "...", kinds: [...]} - 直接是 anxContent
        if (config.anxContent) {
          anxContent = config.anxContent;
          uuid_tile = config.uuid || url_tile;
        } else if (config.kind) {
          // 直接是 anxContent 格式
          anxContent = config;
          uuid_tile = null;
        } else {
          throw new Error('Invalid tile config format');
        }
      } catch (error) {
        console.error(`Error loading tile config from URL ${url_tile}:`, error);
        return res.status(404).json({ error: 'Failed to load tile config from URL' });
      }
    }
    
    // 使用 tile.js 模块处理 anxContent
    const anxResult = processAnxContent(anxContent, uuid_tile);
    if (!anxResult.success) {
      return res.status(404).json({ error: anxResult.error });
    }
    anxContent = anxResult.anxContent;
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 生成唯一的 cardKey
    const cardKey = generateCardKey();
    
    // 检查是否已经为相同的ANX内容生成过节点结构（模板）
    let nodesStructure = getNodesByHash(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构（模板）
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中（模板）
      setNodesByHash(anxHash, nodesStructure);
    } else {
      // 深拷贝模板，创建新实例
      nodesStructure = JSON.parse(JSON.stringify(nodesStructure));
    }
    
    // 设置新的 cardKey
    nodesStructure.cardKey = cardKey;
    
    // 更新所有子节点的 cardKey 和 parentCardKey
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodeCardKeys(nodesStructure.nodes, cardKey, null);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = getNode(cardKey);
    if (storedRootNode) {
      // 只更新数据部分，保持节点结构完整
      if (storedRootNode.data) {
        nodesStructure.data = { ...nodesStructure.data, ...storedRootNode.data };
      }
      if (storedRootNode.config) {
        nodesStructure.config = { ...nodesStructure.config, ...storedRootNode.config };
      }
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
    
    // 生成唯一的 cardKey
    const cardKey = generateCardKey();
    
    // 检查是否已经为相同的ANX内容生成过节点结构（模板）
    let nodesStructure = getNodesByHash(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构（模板）
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中（模板）
      setNodesByHash(anxHash, nodesStructure);
    } else {
      // 深拷贝模板，创建新实例
      nodesStructure = JSON.parse(JSON.stringify(nodesStructure));
    }
    
    // 设置新的 cardKey
    nodesStructure.cardKey = cardKey;
    
    // 更新所有子节点的 cardKey 和 parentCardKey
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodeCardKeys(nodesStructure.nodes, cardKey, null);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = getNode(cardKey);
    if (storedRootNode) {
      // 只更新数据部分，保持节点结构完整
      if (storedRootNode.data) {
        nodesStructure.data = { ...nodesStructure.data, ...storedRootNode.data };
      }
      if (storedRootNode.config) {
        nodesStructure.config = { ...nodesStructure.config, ...storedRootNode.config };
      }
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
    
    // 生成唯一的 cardKey
    const cardKey = generateCardKey();
    
    // 检查是否已经为相同的ANX内容生成过节点结构（模板）
    let nodesStructure = getNodesByHash(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构（模板）
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中（模板）
      setNodesByHash(anxHash, nodesStructure);
    } else {
      // 深拷贝模板，创建新实例
      nodesStructure = JSON.parse(JSON.stringify(nodesStructure));
    }
    
    // 设置新的 cardKey
    nodesStructure.cardKey = cardKey;
    
    // 更新所有子节点的 cardKey 和 parentCardKey
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodeCardKeys(nodesStructure.nodes, cardKey, null);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = getNode(cardKey);
    if (storedRootNode) {
      // 只更新数据部分，保持节点结构完整
      if (storedRootNode.data) {
        nodesStructure.data = { ...nodesStructure.data, ...storedRootNode.data };
      }
      if (storedRootNode.config) {
        nodesStructure.config = { ...nodesStructure.config, ...storedRootNode.config };
      }
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
    
    // 使用 tile.js 模块处理 anxContent
    const anxResult = processAnxContent(anxContent, uuid_tile);
    if (!anxResult.success) {
      return res.status(404).json({ error: anxResult.error });
    }
    anxContent = anxResult.anxContent;
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 生成唯一的 cardKey
    const cardKey = generateCardKey();
    
    // 检查是否已经为相同的ANX内容生成过节点结构（模板）
    let nodesStructure = getNodesByHash(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构（模板）
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中（模板）
      setNodesByHash(anxHash, nodesStructure);
    } else {
      // 深拷贝模板，创建新实例
      nodesStructure = JSON.parse(JSON.stringify(nodesStructure));
    }
    
    // 设置新的 cardKey
    nodesStructure.cardKey = cardKey;
    
    // 更新所有子节点的 cardKey 和 parentCardKey
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodeCardKeys(nodesStructure.nodes, cardKey, null);
    }
    
    // 检查根节点是否有存储的数据
    const storedRootNode = getNode(cardKey);
    if (storedRootNode) {
      // 只更新数据部分，保持节点结构完整
      if (storedRootNode.data) {
        nodesStructure.data = { ...nodesStructure.data, ...storedRootNode.data };
      }
      if (storedRootNode.config) {
        nodesStructure.config = { ...nodesStructure.config, ...storedRootNode.config };
      }
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
    const storedNode = getNode(node.cardKey);
    if (storedNode) {
      // 只更新数据部分，保持节点结构完整
      if (storedNode.data) {
        node.data = { ...node.data, ...storedNode.data };
      }
      // 如果存储的节点有其他属性，也进行合并
      if (storedNode.config) {
        node.config = { ...node.config, ...storedNode.config };
      }
    }
    // 递归更新子节点
    if (node.nodes && node.nodes.length > 0) {
      updateNodesWithStoredData(node.nodes);
    }
  });
}

// 递归存储所有节点的cardKey和config，以及完整的节点结构
function storeCardNodes(nodes, parentCardKey = null) {
  if (!Array.isArray(nodes)) return;
  
  nodes.forEach(node => {
    // 设置父节点的 cardKey
    node.parentCardKey = parentCardKey;
    // 存储当前节点
    if (node.cardKey && node.config) {
      cardStorage.set(node.cardKey, node.config);
      setNode(node.cardKey, node); // 存储完整的节点结构
    }
    // 递归存储子节点，传递当前节点的 cardKey 作为父节点
    if (node.nodes && node.nodes.length > 0) {
      storeCardNodes(node.nodes, node.cardKey);
    }
  });
}

// API endpoint for getting node by cardKey
app.get('/api/get-node', (req, res) => {
  const { cardKey } = req.query;
  
  if (!cardKey) {
    return res.status(400).json({ success: false, error: 'cardKey is required' });
  }
  
  const node = getNode(cardKey);
  
  if (node) {
    res.json({ success: true, node });
  } else {
    res.status(404).json({ success: false, error: 'Node not found' });
  }
});

// API endpoint for converting ANX to nodes structure
app.post('/api/convert-to-nodes', async (req, res) => {
  try {
    let { anxContent, uuid_tile, url_tile, uuid_page, uuid_visitor } = req.body;
    
    // 必须提供 uuid_page
    if (!uuid_page || !uuid_page.trim()) {
      return res.status(400).json({ error: 'uuid_page parameter is required' });
    }
    
    // 必须提供 uuid_visitor
    if (!uuid_visitor || !uuid_visitor.trim()) {
      return res.status(400).json({ error: 'uuid_visitor parameter is required' });
    }
    
    // 如果提供了 uuid_page，先检查是否有已保存的页面实例
    if (uuid_page) {
      const existingPage = getPageWithNodes(uuid_page);
      if (existingPage && existingPage.nodes) {
        console.log(`[Page Manager] Loading existing page instance: ${uuid_page}`);
        
        // 深拷贝节点结构，避免直接修改
        const nodesStructure = JSON.parse(JSON.stringify(existingPage.nodes));
        
        // 如果是表单节点，从根节点的 data.value 中为子字段节点填充正确的值
        if (nodesStructure.config && nodesStructure.config.kind === 'form' && 
            nodesStructure.data && nodesStructure.data.value && 
            nodesStructure.nodes && nodesStructure.nodes.length > 0) {
          const formData = nodesStructure.data.value;
          nodesStructure.nodes.forEach(fieldNode => {
            const fieldNick = fieldNode.config && fieldNode.config.nick;
            if (fieldNick && formData[fieldNick] !== undefined) {
              fieldNode.data = fieldNode.data || {};
              fieldNode.data.value = formData[fieldNick];
            }
          });
        }
        
        // 递归从 nodeStorage 加载所有节点的动态数据（优先使用存储中的最新数据）
        function loadNodeData(node) {
          const storedNode = getNode(node.cardKey);
          if (storedNode && storedNode.data) {
            // 优先使用 nodeStorage 中的最新数据
            node.data = { ...storedNode.data };
          }
          if (node.nodes && node.nodes.length > 0) {
            node.nodes.forEach(childNode => loadNodeData(childNode));
          }
        }
        loadNodeData(nodesStructure);
        
        // 返回已保存的节点结构（包含动态数据）
        res.json({ nodes: nodesStructure, isExisting: true });
        return;
      }
    }
    
    // 如果提供了 url_tile，从指定URL获取配置
    if (url_tile) {
      try {
        const response = await fetch(url_tile);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const config = result.config || result;
        // 支持两种格式：
        // 1. {uuid: "...", anxContent: {...}}
        // 2. {kind: "...", kinds: [...]} - 直接是 anxContent
        if (config.anxContent) {
          anxContent = config.anxContent;
          uuid_tile = config.uuid || url_tile;
        } else if (config.kind) {
          // 直接是 anxContent 格式
          anxContent = config;
          uuid_tile = null; // 不设置 uuid_tile，让 processAnxContent 使用 anxContent
        } else {
          throw new Error('Invalid tile config format');
        }
      } catch (error) {
        console.error(`Error loading tile config from URL ${url_tile}:`, error);
        return res.status(404).json({ error: 'Failed to load tile config from URL' });
      }
    } else if (uuid_tile && !hubAnxMap.has(uuid_tile)) {
      // 如果提供了 uuid_tile 但本地没有找到，尝试从 URL 动态加载
      await loadTileFromUrl(uuid_tile);
    }
    
    // 使用 tile.js 模块处理 anxContent
    const anxResult = processAnxContent(anxContent, uuid_tile);
    if (!anxResult.success) {
      return res.status(404).json({ error: anxResult.error });
    }
    anxContent = anxResult.anxContent;
    
    // 生成唯一的 cardKey
    const cardKey = generateCardKey();
    
    // 生成ANX内容的哈希值
    const anxHash = generateAnxHash(anxContent);
    
    // 检查是否已经为相同的ANX内容生成过节点结构（模板）
    let nodesStructure = getNodesByHash(anxHash);
    
    if (!nodesStructure) {
      // 首次生成节点结构（模板）
      nodesStructure = anxToNodes(anxContent);
      // 存储到哈希映射中（模板）
      setNodesByHash(anxHash, nodesStructure);
    } else {
      // 深拷贝模板，创建新实例
      nodesStructure = JSON.parse(JSON.stringify(nodesStructure));
    }
    
    // 设置新的 cardKey
    nodesStructure.cardKey = cardKey;
    nodesStructure.uuid_page = uuid_page;
    
    // 更新所有子节点的 cardKey 和 parentCardKey
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodeCardKeys(nodesStructure.nodes, cardKey, uuid_page);
    }
    
    // 检查根节点是否有存储的数据（从持久化存储）
    const storedRootNode = getNode(cardKey);
    if (storedRootNode) {
      if (storedRootNode.data) {
        nodesStructure.data = { ...nodesStructure.data, ...storedRootNode.data };
      }
      if (storedRootNode.config) {
        nodesStructure.config = { ...nodesStructure.config, ...storedRootNode.config };
      }
    }
    
    // 更新子节点，使用存储中的数据
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      updateNodesWithStoredData(nodesStructure.nodes);
    }
    
    // 处理根节点和子节点的 dataset
    await processNodeDataset(nodesStructure);
    
    // 设置页面状态
    const pageData = {};
    if (nodesStructure.config?.kind === 'form') {
      pageData.submitStatus = 'pending';
    }
    
    // 保存页面信息到 pages.json（包含完整节点结构）
    addPage({
      uuid_page: uuid_page,
      uuid_tile: uuid_tile,
      url_tile: url_tile,
      uuid_visitor: uuid_visitor,
      title: nodesStructure.config?.title || '',
      cardKey: cardKey,
      nodes: nodesStructure,
      data: { ...pageData, uuid_visitor: uuid_visitor }
    });
    
    // 存储根节点到 node.js（持久化）
    if (nodesStructure.cardKey && nodesStructure.config) {
      cardStorage.set(nodesStructure.cardKey, nodesStructure.config);
      setNode(nodesStructure.cardKey, nodesStructure);
    }
    
    // 存储子节点，传递根节点的 cardKey 作为父节点
    if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
      storeCardNodes(nodesStructure.nodes, nodesStructure.cardKey);
    }
    
    res.json({ nodes: nodesStructure, uuid_page: uuid_page, isExisting: false });
  } catch (error) {
    console.error('Error converting ANX to nodes structure:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.' });
  }
});

// 更新节点的 cardKey 和 parentCardKey
function updateNodeCardKeys(nodes, parentCardKey, uuid_page) {
  nodes.forEach(node => {
    // 生成新的 cardKey
    node.cardKey = generateCardKey();
    // 设置父节点 cardKey
    node.parentCardKey = parentCardKey;
    // 设置 uuid_page
    node.uuid_page = uuid_page;
    
    // 递归处理子节点
    if (node.nodes && node.nodes.length > 0) {
      updateNodeCardKeys(node.nodes, node.cardKey, uuid_page);
    }
  });
}

// API endpoint for converting ANX to markup
app.post('/api/convert-to-markup', async (req, res) => {
  try {
    let { anxContent, uuid_tile, url_tile } = req.body;
    
    // 如果提供了 url_tile，从指定URL获取配置
    if (url_tile) {
      try {
        const response = await fetch(url_tile);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const config = result.config || result;
        // 支持两种格式：
        // 1. {uuid: "...", anxContent: {...}}
        // 2. {kind: "...", kinds: [...]} - 直接是 anxContent
        if (config.anxContent) {
          anxContent = config.anxContent;
          uuid_tile = config.uuid || url_tile;
        } else if (config.kind) {
          // 直接是 anxContent 格式
          anxContent = config;
          uuid_tile = null;
        } else {
          throw new Error('Invalid tile config format');
        }
      } catch (error) {
        console.error(`Error loading tile config from URL ${url_tile}:`, error);
        return res.status(404).json({ error: 'Failed to load tile config from URL' });
      }
    } else if (uuid_tile && !hubAnxMap.has(uuid_tile)) {
      // 如果提供了 uuid_tile 但本地没有找到，尝试从 URL 动态加载
      await loadTileFromUrl(uuid_tile);
    }
    
    // 如果提供了 uuid_tile，从 hubAnxMap 中获取 anxContent
    if (uuid_tile && hubAnxMap.has(uuid_tile)) {
      anxContent = hubAnxMap.get(uuid_tile).anxContent;
    }
    
    if (!anxContent) {
      return res.status(404).json({ error: 'ANX config not found for the given uuid_tile' });
    }
    
    // 使用 tile.js 模块处理 anxContent
    const anxResult = processAnxContent(anxContent, uuid_tile);
    if (!anxResult.success) {
      return res.status(404).json({ error: anxResult.error });
    }
    anxContent = anxResult.anxContent;
    
    // 转换为 markup（anxToMarkup 是异步函数）
    const markup = await anxToMarkup(anxContent);
    
    res.json({ markup });
  } catch (error) {
    console.error('Error converting ANX to markup:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.' });
  }
});

// API endpoint for converting ANX to markup (GET version)
// Supports: /api/markup?url_tile=xxx or /api/markup?uuid_tile=xxx
app.get('/api/markup', async (req, res) => {
  try {
    const { url_tile, uuid_tile, uuid_page: providedUuidPage, uuid_visitor } = req.query;
    
    if (!url_tile && !uuid_tile) {
      return res.status(400).send('Error: Either url_tile or uuid_tile parameter is required');
    }
    
    // 必须提供 uuid_page
    if (!providedUuidPage || !providedUuidPage.trim()) {
      return res.status(400).send('Error: uuid_page parameter is required');
    }
    
    // 必须提供 uuid_visitor
    if (!uuid_visitor || !uuid_visitor.trim()) {
      return res.status(400).send('Error: uuid_visitor parameter is required');
    }
    
    // 使用 getTilePageUUID 获取或创建页面 UUID
    const resolvedUuidPage = getTilePageUUID({
      uuid_page: providedUuidPage,
      uuid_tile,
      url_tile,
      uuid_visitor
    });
    
    // 获取页面实例
    const page = getPage(resolvedUuidPage);
    
    let anxContent = null;
    
    // 如果提供了 url_tile，从指定URL获取配置
    if (url_tile) {
      try {
        const response = await fetch(url_tile);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const config = result.config || result;
        // 支持两种格式：
        // 1. {uuid: "...", anxContent: {...}}
        // 2. {kind: "...", kinds: [...]} - 直接是 anxContent
        if (config.anxContent) {
          anxContent = config.anxContent;
        } else if (config.kind) {
          // 直接是 anxContent 格式
          anxContent = config;
        } else {
          throw new Error('Invalid tile config format');
        }
      } catch (error) {
        console.error(`Error loading tile config from URL ${url_tile}:`, error);
        return res.status(404).send('Error: Failed to load tile config from URL');
      }
    } else if (uuid_tile) {
      // 如果提供了 uuid_tile 但本地没有找到，尝试从 URL 动态加载
      if (!hubAnxMap.has(uuid_tile)) {
        await loadTileFromUrl(uuid_tile);
      }
      
      // 如果提供了 uuid_tile，从 hubAnxMap 中获取 anxContent
      if (hubAnxMap.has(uuid_tile)) {
        anxContent = hubAnxMap.get(uuid_tile).anxContent;
      }
    }
    
    if (!anxContent) {
      return res.status(404).send('Error: ANX config not found');
    }
    
    // 使用 tile.js 模块处理 anxContent
    const anxResult = processAnxContent(anxContent, uuid_tile);
    if (!anxResult.success) {
      return res.status(404).send(`Error: ${anxResult.error}`);
    }
    anxContent = anxResult.anxContent;
    
    // 直接从页面获取或生成节点结构
    let nodesStructure = null;
    
    // 检查页面是否已有节点结构
    if (page && page.nodes) {
      nodesStructure = JSON.parse(JSON.stringify(page.nodes));
      console.log(`[API/markup] Using existing nodes from page: ${resolvedUuidPage}`);
    }
    
    if (!nodesStructure) {
      // 如果页面中没有，生成新的节点结构
      nodesStructure = anxToNodes(anxContent);
      // 为每个节点生成唯一的 cardKey（包含时间戳确保唯一性）
      nodesStructure.cardKey = generateCardKey();
      if (nodesStructure.nodes && nodesStructure.nodes.length > 0) {
        nodesStructure.nodes.forEach(node => {
          node.cardKey = generateCardKey();
          if (node.nodes && node.nodes.length > 0) {
            node.nodes.forEach(grandchild => {
              grandchild.cardKey = generateCardKey();
            });
          }
        });
      }
      // 将节点结构保存到页面
      savePageNodes(resolvedUuidPage, nodesStructure);
      console.log(`[API/markup] Generated new nodes and saved to page: ${resolvedUuidPage}`);
    }
    
    // 递归从 nodeStorage 加载所有节点的动态数据
    function loadNodeData(node) {
      const storedNode = getNode(node.cardKey);
      if (storedNode && storedNode.data) {
        node.data = { ...node.data, ...storedNode.data };
      }
      if (node.nodes && node.nodes.length > 0) {
        node.nodes.forEach(childNode => loadNodeData(childNode));
      }
    }
    loadNodeData(nodesStructure);
    
    // 使用节点结构生成 markup
    const markup = await nodesToMarkup(nodesStructure);
    
    // 在 markup 开头添加 uuid_page 和 uuid_visitor
    let finalMarkup = `uuid_page: ${resolvedUuidPage}\n`;
    if (uuid_visitor) {
      finalMarkup += `uuid_visitor: ${uuid_visitor}\n`;
    }
    finalMarkup += '\n';
    finalMarkup += markup;
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(finalMarkup);
  } catch (error) {
    console.error('Error converting ANX to markup:', error);
    res.status(400).send('Error: Invalid ANX content. Please check your input.');
  }
});

// API endpoint for executing CLI commands
/**
 * 从多个来源查找节点（nodeStorage、anxHashToNodeMap、页面）
 * @param {string} cardKey - 节点的 cardKey
 * @returns {Object|null} - 节点对象或 null
 */
function findNode(cardKey) {
  // 1. 先从 nodeStorage 中查找
  const storedNode = getNode(cardKey);
  if (storedNode) {
    return storedNode;
  }
  
  // 2. 从哈希映射中查找
  for (const [anxHash, rootNode] of anxHashToNodeMap) {
    if (rootNode.cardKey === cardKey) {
      return JSON.parse(JSON.stringify(rootNode));
    }
    
    function searchInNodes(nodes) {
      for (const node of nodes) {
        if (node.cardKey === cardKey) {
          return JSON.parse(JSON.stringify(node));
        }
        if (node.nodes && node.nodes.length > 0) {
          const found = searchInNodes(node.nodes);
          if (found) return found;
        }
      }
      return null;
    }
    
    if (rootNode.nodes && rootNode.nodes.length > 0) {
      const found = searchInNodes(rootNode.nodes);
      if (found) return found;
    }
  }
  
  // 3. 从页面中查找
  const allPages = getAllPages();
  for (const page of allPages) {
    if (page.nodes) {
      if (page.nodes.cardKey === cardKey) {
        return JSON.parse(JSON.stringify(page.nodes));
      }
      
      function searchInPageNodes(nodes) {
        for (const node of nodes) {
          if (node.cardKey === cardKey) {
            return JSON.parse(JSON.stringify(node));
          }
          if (node.nodes && node.nodes.length > 0) {
            const found = searchInPageNodes(node.nodes);
            if (found) return found;
          }
        }
        return null;
      }
      
      if (page.nodes.nodes && page.nodes.nodes.length > 0) {
        const found = searchInPageNodes(page.nodes.nodes);
        if (found) return found;
      }
    }
  }
  
  return null;
}

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
      
      // 使用统一的日志模块
      logError('cli_command_error', 'Invalid CLI command format', {
        command: command,
        response: response
      });
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
        // 从多个来源查找cardKey对应的完整节点结构
        const node = findNode(cardKey);
        if (node) {
          result = node; // 直接返回完整的节点结构
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'get_form':
        // 从多个来源查找cardKey对应的节点
        const getFormNode = findNode(cardKey);
        if (getFormNode) {
          // 返回表单的完整数据
          result = getFormNode.data || { value: {} };
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'set_form':
        // 从页面中查找表单节点（确保包含完整的子节点结构）
        let formNode = null;
        const allPages = getAllPages();
        for (const page of allPages) {
          if (page.nodes && page.nodes.cardKey === cardKey) {
            formNode = page.nodes;
            break;
          }
        }
        // 如果页面中没找到，再尝试其他方式
        if (!formNode) {
          formNode = findNode(cardKey);
        }
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
            
            // 同步更新子字段节点的 data.value，并持久化到存储
            if (formNode.nodes && formNode.nodes.length > 0) {
              console.log('[set_form] 开始更新子节点，共', formNode.nodes.length, '个子节点');
              formNode.nodes.forEach(fieldNode => {
                const fieldNick = fieldNode.config && fieldNode.config.nick;
                console.log('[set_form] 子节点:', fieldNode.cardKey, ', nick:', fieldNick);
                if (fieldNick && formNode.data.value[fieldNick] !== undefined) {
                  console.log('[set_form] 更新子节点:', fieldNode.cardKey, ', 值:', formNode.data.value[fieldNick]);
                  fieldNode.data = fieldNode.data || {};
                  fieldNode.data.value = formNode.data.value[fieldNick];
                  // 调用 updateNodeData 持久化子节点数据
                  updateNodeData(fieldNode.cardKey, { value: fieldNode.data.value });
                  console.log('[set_form] 子节点', fieldNode.cardKey, '已更新并持久化');
                }
              });
            } else {
              console.log('[set_form] formNode.nodes 为空或不存在');
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
            setNode(cardKey, formNode);
            
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
        // 从多个来源查找cardKey对应的节点
        const fillNode = findNode(cardKey);
        if (fillNode) {
          // 获取填充值
          const value = params.join(' ');
          // 更新节点的data.value
          if (!fillNode.data) {
            fillNode.data = { value: {} };
          }
          fillNode.data.value = value;
          // 更新存储
          setNode(cardKey, fillNode);
          result = { message: 'Value filled successfully', value: value };
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'input':
        // 从多个来源查找cardKey对应的节点
        const inputNode = findNode(cardKey);
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
          setNode(cardKey, inputNode);
          result = { message: 'Input added successfully', value: inputNode.data.value };
        } else {
          result = `No node found for cardKey: ${cardKey}`;
        }
        break;
      case 'tap':
        // 从多个来源查找cardKey对应的节点
        const tapNode = findNode(cardKey);
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
            } else if (tapSet.requestSet) {
              // 处理requestSet动作
              const requestSet = tapSet.requestSet;
              if (requestSet.resultSet !== undefined && requestSet.resultSet !== null && requestSet.resultSet !== false) {
                // 如果包含resultSet，立即返回running状态
                // 然后在后台异步执行请求
                const parentCardKey = tapNode.parentCardKey || cardKey;
                
                // 立即设置running状态
                updateNodeData(parentCardKey, { processing: true, submitStatus: 'running' });
                
                // 立即返回running状态
                result = { 
                  message: 'Request started', 
                  action: 'requestSet',
                  status: 'running',
                  submitStatus: 'running',
                  cardKey: cardKey,
                  parentCardKey: parentCardKey
                };
                
                // 后台异步执行请求
                handleTapSetRequestSetAsync(cardKey, parentCardKey, requestSet);
              } else {
                // 如果没有resultSet，同步执行请求
                handleTapSetRequestSet(cardKey, tapNode.parentCardKey || cardKey, requestSet);
                result = { 
                  message: 'Tap action executed successfully', 
                  action: 'requestSet',
                  status: 'completed'
                };
              }
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
        const clearFormNode = getNode(cardKey);
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
          setNode(cardKey, clearFormNode);
          
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
    
    // 使用统一的日志模块
    logToSystem('cli_command_success', {
      command: command,
      response: response
    });
    
    res.json(response);
  } catch (error) {
    console.error('Error executing CLI command:', error);
    const response = {
      cardKey: '',
      action: '',
      result: 'Error executing CLI command. Please check your input.'
    };
    
    // 使用统一的日志模块
    logError('cli_command_execution_error', error.message, {
      command: req.body.command || '',
      response: response
    });
    
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
    // 清除 view 目录下的模块缓存
    Object.keys(require.cache).forEach(key => {
      if (key.includes('view')) {
        delete require.cache[key];
      }
    });
    
    // 重新加载 view 模块
    const { generateNodeVisualization, generateVisualizationCSS } = require('../../view/index.js');
    
    const { node } = req.body;
    if (!node) {
      return res.status(400).json({ error: 'node is required' });
    }
    
    // 使用存储中的节点数据进行可视化渲染
    let nodeToVisualize = { ...node };
    
    // 如果是表单节点，从根节点的 data.value 中为子字段节点填充正确的值
    if (nodeToVisualize.config && nodeToVisualize.config.kind === 'form' && 
        nodeToVisualize.data && nodeToVisualize.data.value && 
        nodeToVisualize.nodes && nodeToVisualize.nodes.length > 0) {
      const formData = nodeToVisualize.data.value;
      nodeToVisualize.nodes.forEach(fieldNode => {
        const fieldNick = fieldNode.config && fieldNode.config.nick;
        if (fieldNick && formData[fieldNick] !== undefined) {
          fieldNode.data = fieldNode.data || {};
          fieldNode.data.value = formData[fieldNick];
        }
      });
    }
    
    // 检查根节点是否有存储的数据，合并数据而不是覆盖
    const storedRootNode = getNode(node.cardKey);
    if (storedRootNode) {
      // 合并数据，保持传入的节点结构，只更新数据部分
      if (storedRootNode.data) {
        nodeToVisualize.data = { ...nodeToVisualize.data, ...storedRootNode.data };
      }
      if (storedRootNode.logs) {
        nodeToVisualize.logs = storedRootNode.logs;
      }
    }
    
    // 更新子节点，使用存储中的数据（仅在节点没有数据时加载）
    if (nodeToVisualize.nodes && nodeToVisualize.nodes.length > 0) {
      // 使用自定义逻辑，只在节点没有数据时才从存储加载
      nodeToVisualize.nodes.forEach(fieldNode => {
        const storedNode = getNode(fieldNode.cardKey);
        if (storedNode && storedNode.data) {
          const nodeHasData = fieldNode.data && Object.keys(fieldNode.data).length > 0;
          if (!nodeHasData) {
            fieldNode.data = { ...storedNode.data };
          }
        }
        if (fieldNode.nodes && fieldNode.nodes.length > 0) {
          fieldNode.nodes.forEach(childNode => {
            const storedChildNode = getNode(childNode.cardKey);
            if (storedChildNode && storedChildNode.data) {
              const childHasData = childNode.data && Object.keys(childNode.data).length > 0;
              if (!childHasData) {
                childNode.data = { ...storedChildNode.data };
              }
            }
          });
        }
      });
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

// API endpoint for triggering card key
app.post('/api/trigger-card-key', async (req, res) => {
  try {
    const { cardKey, tapSet, triggerSet, data } = req.body;
    if (!cardKey) {
      return res.status(400).json({ error: 'cardKey is required' });
    }
    
    // 使用统一的日志模块
    logToSystem('trigger_card_key', {
      cardKey: cardKey,
      tapSet: tapSet || null,
      triggerSet: triggerSet || null
    });
    
    // 获取存储中的节点数据
    const storedNode = getNode(cardKey);
    
    // 处理tapSet并获取执行结果
    let tapResult = null;
    if (tapSet) {
      try {
        logToSystem('handleTapSet-try', {
          cardKey: cardKey,
          handleTapSet:handleTapSet?true:false
        });
        
        // 检查是否有requestSet配置
        if (tapSet.requestSet) {
          const parentCardKey = storedNode?.parentCardKey || cardKey;
          
          // 如果包含resultSet，返回running状态
          if (tapSet.requestSet.resultSet !== undefined && tapSet.requestSet.resultSet !== null && tapSet.requestSet.resultSet !== false) {
            // 立即设置running状态
            updateNodeData(parentCardKey, { processing: true, submitStatus: 'running' });
            
            // 立即返回running状态
            tapResult = {
              message: 'Request started',
              action: 'requestSet',
              status: 'running',
              submitStatus: 'running',
              cardKey: cardKey,
              parentCardKey: parentCardKey
            };
            
            // 后台异步执行请求
            handleTapSetRequestSetAsync(cardKey, parentCardKey, tapSet.requestSet);
          } else {
            // 同步执行请求
            tapResult = await handleTapSetRequestSet(cardKey, parentCardKey, tapSet.requestSet);
            if (!tapResult.status) {
              tapResult.status = 'completed';
            }
          }
        } else {
          // 调用 handleTapSet
          handleTapSet({cardKey});
          tapResult = { status: 'completed', message: 'Tap action executed' };
        }
        
        logToSystem('handleTapSet-finish', {
          result: tapResult
        });
      } catch (tapError) {
        logToSystem('handleTapSet-error', {
          cardKey: cardKey,
          tapError: tapError.message,
        });
        tapResult = { status: 'error', message: tapError.message };
      }
    }
    
    if (triggerSet) {
      console.log('[API] Calling handleTriggerSet');
      try {
        // 调用 handleTriggerSet
        handleTriggerSet(triggerSet, data || {}, null);
      } catch (triggerError) {
        console.error('[API] Error handling triggerSet:', triggerError);
      }
    }
    
    // 返回包含状态数据的结果
    res.json({
      success: true,
      message: 'Card key triggered successfully',
      cardKey: cardKey,
      tapSet: tapSet || null,
      triggerSet: triggerSet || null,
      nodes: storedNode || null,
      data: tapResult || { status: 'completed' }
    });
  } catch (error) {
    console.error('[API] Error triggering card key:', error);
    
    // 使用统一的日志模块
    logError('trigger_card_key_error', error.message, {
      message: `Error triggering card key: ${error.message}`
    });
    
    
    res.status(500).json({ error: 'Failed to trigger card key' });
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
    console.log('[API] Getting CLI logs...');
    
    // 直接返回system-logs.json文件的内容
    try {
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.resolve(__dirname, '../../log/system-logs.json');
      console.log('[API] Reading log file:', logFilePath);
      
      if (fs.existsSync(logFilePath)) {
        const logContent = fs.readFileSync(logFilePath, 'utf8');
        console.log('[API] Log file content length:', logContent.length);
        
        try {
          const logs = JSON.parse(logContent);
          console.log('[API] Logs parsed successfully:', logs.length, 'entries');
          res.json({ logs: logs });
        } catch (parseError) {
          console.error('[API] Error parsing log file:', parseError);
          res.json({ logs: [] });
        }
      } else {
        console.error('[API] Log file not found:', logFilePath);
        res.json({ logs: [] });
      }
    } catch (fileError) {
      console.error('[API] Error reading log file:', fileError);
      res.json({ logs: [] });
    }
  } catch (error) {
    console.error('Error getting CLI logs:', error);
    res.status(500).json({ error: 'Failed to get CLI logs' });
  }
});

// API endpoint for getting dataset root (handles url_dataset requests)
app.get('/dataset', (req, res) => {
  try {
    // 返回示例表格数据
    const sampleData = [
      { id: 1, name: '笔记本电脑', price: 5999, stock: 50 },
      { id: 2, name: '智能手机', price: 3999, stock: 100 },
      { id: 3, name: '平板电脑', price: 2999, stock: 30 }
    ];
    
    console.log('[API] Returning sample dataset data');
    res.json(sampleData);
  } catch (error) {
    console.error('Error getting dataset:', error);
    res.status(500).json({ error: 'Failed to get dataset' });
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
app.post('/api/get-node-data', (req, res) => {
  try {
    const { cardKey } = req.body;
    
    if (!cardKey) {
      return res.status(400).json({ error: 'cardKey is required' });
    }
    
    // 从多个来源查找节点
    const node = findNode(cardKey);
    
    if (node) {
      res.json({
        success: true,
        cardKey: cardKey,
        data: node.data || {}
      });
    } else {
      res.json({
        success: false,
        cardKey: cardKey,
        error: 'Node not found',
        data: {}
      });
    }
  } catch (error) {
    console.error('[API] Error getting node data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get node data',
      data: {}
    });
  }
});

app.post('/api/update-node-data', (req, res) => {
  try {
    const { cardKey, field, value } = req.body;
    
    console.log('[API] update-node-data called:', {
      cardKey: cardKey,
      field: field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      hasNode: hasNode(cardKey),
      nodeCount: getNodeCount()
    });
    
    if (!cardKey || !field) {
      return res.status(400).json({ error: 'cardKey and field are required' });
    }
    
    // 使用统一的日志模块
    logToSystem('update_node_data', {
      cardKey: cardKey,
      field: field,
      value: value
    });
    
    
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
    
    // 先从 nodeStorage 中查找节点（快速查找）
    const storedNode = getNode(cardKey);
    if (storedNode) {
      if (!storedNode.data) {
        storedNode.data = {};
      }
      storedNode.data[field] = value;
      updateNodeData(cardKey, { [field]: value });
      nodeUpdated = true;
      updatedChildNode = storedNode;
    }
    
    // 如果在 nodeStorage 中没找到，从哈希映射和页面中查找
    if (!nodeUpdated) {
      // 在哈希映射中查找
      for (let [anxHash, rootNode] of anxHashToNodeMap) {
        if (rootNode.cardKey === cardKey) {
          if (!rootNode.data) {
            rootNode.data = {};
          }
          rootNode.data[field] = value;
          updateNodeData(cardKey, { [field]: value });
          nodeUpdated = true;
          updatedRootNode = rootNode;
          break;
        }
        
        if (rootNode.nodes && rootNode.nodes.length > 0) {
          if (updateNodeInStructure(rootNode.nodes, rootNode)) {
            updateNodeData(cardKey, { [field]: value });
            nodeUpdated = true;
            updatedRootNode = rootNode;
            break;
          }
        }
      }
    }
    
    // 如果还是没找到，从所有页面中查找
    if (!nodeUpdated) {
      const allPages = getAllPages();
      for (const page of allPages) {
        if (page.nodes) {
          if (page.nodes.cardKey === cardKey) {
            if (!page.nodes.data) {
              page.nodes.data = {};
            }
            page.nodes.data[field] = value;
            updateNodeData(cardKey, { [field]: value });
            savePageNodes(page.uuid_page, page.nodes);
            nodeUpdated = true;
            updatedRootNode = page.nodes;
            break;
          }
          
          if (page.nodes.nodes && page.nodes.nodes.length > 0) {
            if (updateNodeInStructure(page.nodes.nodes, page.nodes)) {
              updateNodeData(cardKey, { [field]: value });
              savePageNodes(page.uuid_page, page.nodes);
              nodeUpdated = true;
              updatedRootNode = page.nodes;
              break;
            }
          }
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

      logToSystem('parentFormNode', {
        cardKey: cardKey,
        formValue: parentFormNode.data.value
      });
      
      // 同步更新父 form 组件到 storage
      updateNodeData(parentFormNode.cardKey, { value: parentFormNode.data.value });
      
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
              // 同步更新formula子组件到storage
              updateNodeData(node.cardKey, { value: formulaValue });
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

// 获取所有tiles列表（包含hub.json和index.json中的所有项）
app.get('/api/tiles/list', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const hubDir = path.join(__dirname, '../../examples/hub');
    
    const tiles = [];
    const loadedUuids = new Set();
    
    // 读取 hub.json
    const hubPath = path.join(hubDir, 'hub.json');
    if (fs.existsSync(hubPath)) {
      const hubContent = fs.readFileSync(hubPath, 'utf8');
      const hubData = JSON.parse(hubContent);
      if (hubData.tiles && Array.isArray(hubData.tiles)) {
        hubData.tiles.forEach(item => {
          if (item.uuid && item.name) {
            tiles.push({
              uuid: item.uuid,
              name: item.name,
              url: item.url,
              loaded: hubAnxMap.has(item.uuid)
            });
            loadedUuids.add(item.uuid);
          }
        });
      }
    }
    
    // 读取 tiles/tiles.json（补充hub.json中没有的项）
    const tilesPath = path.join(hubDir, 'tiles', 'tiles.json');
    if (fs.existsSync(tilesPath)) {
      const tilesContent = fs.readFileSync(tilesPath, 'utf8');
      const tilesData = JSON.parse(tilesContent);
      if (Array.isArray(tilesData)) {
        tilesData.forEach(item => {
          if (item.uuid && item.name && !loadedUuids.has(item.uuid)) {
            tiles.push({
              uuid: item.uuid,
              name: item.name,
              url: item.url,
              loaded: hubAnxMap.has(item.uuid)
            });
            loadedUuids.add(item.uuid);
          }
        });
      }
    }
    
    res.json({
      success: true,
      data: tiles
    });
  } catch (error) {
    console.error('Error loading tiles list:', error);
    res.status(500).json({ error: 'Failed to load tiles list' });
  }
});

// 获取所有页面列表
app.get('/api/pages/list', (req, res) => {
  try {
    const pages = getAllPages();
    res.json({
      success: true,
      data: pages,
      count: getPageCount()
    });
  } catch (error) {
    console.error('Error loading pages list:', error);
    res.status(500).json({ error: 'Failed to load pages list' });
  }
});

// 获取指定tile和visitor的最后一个页面
app.get('/api/pages/last', (req, res) => {
  try {
    const { uuid_tile, url_tile, uuid_visitor } = req.query;
    
    if (!uuid_tile && !url_tile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either uuid_tile or url_tile parameter is required' 
      });
    }
    
    const uuid_page = getLastPageForVisitor({
      uuid_tile,
      url_tile,
      uuid_visitor
    });
    
    res.json({
      success: true,
      data: {
        uuid_page: uuid_page || null
      }
    });
  } catch (error) {
    console.error('Error getting last page:', error);
    res.status(500).json({ success: false, error: 'Failed to get last page' });
  }
});

// 获取指定tile的所有页面
app.get('/api/pages/by-tile/:uuid_tile', (req, res) => {
  try {
    const { uuid_tile } = req.params;
    const pages = getPagesByTile(uuid_tile);
    res.json({
      success: true,
      data: pages,
      count: pages.length
    });
  } catch (error) {
    console.error('Error loading pages by tile:', error);
    res.status(500).json({ error: 'Failed to load pages by tile' });
  }
});

// 获取指定visitor的所有页面
app.get('/api/pages/by-visitor/:uuid_visitor', (req, res) => {
  try {
    const { uuid_visitor } = req.params;
    const pages = getPagesByVisitor(uuid_visitor);
    res.json({
      success: true,
      data: pages,
      count: pages.length
    });
  } catch (error) {
    console.error('Error loading pages by visitor:', error);
    res.status(500).json({ error: 'Failed to load pages by visitor' });
  }
});

// 通过 url_tile 获取页面列表
app.get('/api/pages/by-url-tile', (req, res) => {
  try {
    const { url_tile, uuid_visitor } = req.query;
    if (!url_tile) {
      return res.status(400).json({ error: 'url_tile parameter is required' });
    }
    
    let pages = getPagesByUrlTile(url_tile);
    
    // 如果提供了 uuid_visitor，优先返回匹配的页面；如果没有匹配的，返回所有页面（向后兼容）
    if (uuid_visitor) {
      const filteredPages = pages.filter(page => 
        page.uuid_visitor === uuid_visitor || 
        (page.data && page.data.uuid_visitor === uuid_visitor)
      );
      // 如果有匹配的页面，返回过滤结果；否则返回所有页面
      if (filteredPages.length > 0) {
        pages = filteredPages;
      }
    }
    
    res.json({
      success: true,
      data: pages,
      count: pages.length
    });
  } catch (error) {
    console.error('Error loading pages by url_tile:', error);
    res.status(500).json({ error: 'Failed to load pages by url_tile' });
  }
});

// 获取单个页面详情
app.get('/api/pages/:uuid_page', (req, res) => {
  try {
    const { uuid_page } = req.params;
    const page = getPage(uuid_page);
    if (page) {
      res.json({
        success: true,
        data: page
      });
    } else {
      res.status(404).json({ success: false, error: 'Page not found' });
    }
  } catch (error) {
    console.error('Error loading page:', error);
    res.status(500).json({ error: 'Failed to load page' });
  }
});

// 更新页面信息
app.put('/api/pages/:uuid_page', (req, res) => {
  try {
    const { uuid_page } = req.params;
    const updates = req.body;
    const updatedPage = updatePage(uuid_page, updates);
    if (updatedPage) {
      res.json({
        success: true,
        data: updatedPage
      });
    } else {
      res.status(404).json({ success: false, error: 'Page not found' });
    }
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// 删除页面
app.delete('/api/pages/:uuid_page', (req, res) => {
  try {
    const { uuid_page } = req.params;
    const deletedPage = deletePage(uuid_page);
    if (deletedPage) {
      res.json({
        success: true,
        data: deletedPage
      });
    } else {
      res.status(404).json({ success: false, error: 'Page not found' });
    }
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// 获取tile详情（支持从URL动态加载）
app.get('/api/tiles/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const fs = require('fs');
    const path = require('path');
    const fetch = require('node-fetch');
    const hubDir = path.join(__dirname, '../../examples/hub');
    
    // 首先检查是否已加载
    if (hubAnxMap.has(uuid)) {
      res.json({
        success: true,
        data: hubAnxMap.get(uuid)
      });
      return;
    }
    
    // 尝试从 hub.json 获取URL
    let configUrl = null;
    const hubPath = path.join(hubDir, 'hub.json');
    if (fs.existsSync(hubPath)) {
      const hubContent = fs.readFileSync(hubPath, 'utf8');
      const hubData = JSON.parse(hubContent);
      if (hubData.tiles && Array.isArray(hubData.tiles)) {
        const tile = hubData.tiles.find(item => item.uuid === uuid);
        if (tile && tile.url) {
          configUrl = tile.url;
        }
      }
    }
    
    // 如果 hub.json 中没有，尝试从 index.json 获取
    if (!configUrl) {
      const indexPath = path.join(hubDir, 'index.json');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const indexData = JSON.parse(indexContent);
        if (Array.isArray(indexData)) {
          const item = indexData.find(item => item.uuid === uuid);
          if (item && item.url) {
            configUrl = item.url;
          }
        }
      }
    }
    
    // 如果有URL，尝试从URL获取配置
    if (configUrl) {
      try {
        const response = await fetch(configUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const hubFile = await response.json();
        if (hubFile.uuid && hubFile.anxContent) {
          // 缓存到 hubAnxMap
          hubAnxMap.set(hubFile.uuid, hubFile);
          res.json({
            success: true,
            data: hubFile
          });
          return;
        }
      } catch (error) {
        console.error(`Error loading tile config from URL ${configUrl}:`, error);
      }
    }
    
    // 尝试从本地文件加载
    const filePath = path.join(hubDir, `${uuid}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const hubFile = JSON.parse(content);
      if (hubFile.uuid && hubFile.anxContent) {
        hubAnxMap.set(hubFile.uuid, hubFile);
        res.json({
          success: true,
          data: hubFile
        });
        return;
      }
    }
    
    res.json({
      success: false,
      message: 'Tile config not found for the given uuid'
    });
  } catch (error) {
    console.error('Error loading tile config:', error);
    res.status(500).json({ error: 'Failed to load tile config' });
  }
});

// 文件上传API
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 创建上传目录
    const uploadDir = path.join(__dirname, '../frontend/public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 生成唯一文件名
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    
    // 将文件写入磁盘
    fs.writeFileSync(filePath, req.file.buffer);
    
    console.log('[API] File uploaded:', filePath);
    
    // 返回可访问的文件URL（前端可以直接访问）
    const fileUrl = `/uploads/${fileName}`;
    
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

// 异步处理tapSet中的requestSet动作
async function handleTapSetRequestSetAsync(cardKey, parentCardKey, requestSet) {
  try {
    logToSystem('request_start', {
      cardKey: cardKey,
      url: requestSet.url,
      method: requestSet.method,
      paramMap: requestSet.paramMap,
      timestamp: new Date().toISOString()
    });

    // 使用executeRequest执行请求
    const result = await executeRequest({config: requestSet, cardKey});

    // Log success to system
    logToSystem('request_success', {
      url: requestSet.url,
      method: requestSet.method,
      result: result,
      timestamp: new Date().toISOString()
    });

    // 存储结果到节点
    if (requestSet.resultSet !== undefined && requestSet.resultSet !== null && requestSet.resultSet !== false) {
      let resultValue = null;
      if (result && result.data && result.data.data !== undefined) {
        resultValue = result.data.data;
      } else if (result && result.data !== undefined) {
        resultValue = result.data;
      } else if (result !== undefined) {
        resultValue = result;
      }
      updateNodeData(parentCardKey, { result: resultValue, processing: false, submitStatus: 'submitted' });
      logToSystem('request_result_stored', {
        cardKey: cardKey,
        resultSet: requestSet.resultSet,
        timestamp: new Date().toISOString()
      });
    } else {
      updateNodeData(parentCardKey, { processing: false });
    }

    return result;
  } catch (error) {
    console.error('[TapSet] RequestSet error:', error);
    
    // 清除处理中状态，恢复为待提交状态
    if (requestSet.resultSet !== undefined && requestSet.resultSet !== null && requestSet.resultSet !== false) {
      updateNodeData(parentCardKey, { processing: false, submitStatus: 'pending' });
      logToSystem('request_processing_ended', {
        cardKey: cardKey,
        parentCardKey: parentCardKey,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    logError('request_error', error.message, {
      url: requestSet.url,
      method: requestSet.method,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// 同步处理tapSet中的requestSet动作
function handleTapSetRequestSet(cardKey, parentCardKey, requestSet) {
  logToSystem('request_start', {
    cardKey: cardKey,
    url: requestSet.url,
    method: requestSet.method,
    paramMap: requestSet.paramMap,
    timestamp: new Date().toISOString()
  });

  executeRequest({config: requestSet, cardKey})
    .then(result => {
      logToSystem('request_success', {
        url: requestSet.url,
        method: requestSet.method,
        result: result,
        timestamp: new Date().toISOString()
      });

      if (requestSet.resultSet !== undefined && requestSet.resultSet !== null && requestSet.resultSet !== false) {
        let resultValue = null;
        if (result && result.data && result.data.data !== undefined) {
          resultValue = result.data.data;
        } else if (result && result.data !== undefined) {
          resultValue = result.data;
        } else if (result !== undefined) {
          resultValue = result;
        }
        updateNodeData(parentCardKey, { result: resultValue });
        logToSystem('request_result_stored', {
          cardKey: cardKey,
          resultSet: requestSet.resultSet,
          timestamp: new Date().toISOString()
        });
      }
    })
    .catch(error => {
      console.error('[TapSet] RequestSet error:', error);
      logError('request_error', error.message, {
        url: requestSet.url,
        method: requestSet.method,
        timestamp: new Date().toISOString()
      });
    });
}

// 加载hub文件并启动服务器
async function startServer() {
  await loadHubFiles();
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

startServer();
