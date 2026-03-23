const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import the anxToMarkdown, anxToNodes functions and anxCLI from the core module
const { anxToMarkdown, anxToNodes, anxCLI } = require('../../core/index.js');

const app = express();
const PORT = 7887;

// 存储cardKey及其对应的config信息
const cardStorage = new Map();
// 存储完整的节点结构
const nodeStorage = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint for converting ANX to Markdown
app.post('/convert', async (req, res) => {
  try {
    const { anxContent } = req.body;
    
    // Convert ANX to Markdown
    const markdown = await anxToMarkdown(anxContent);
    
    res.json({ markdown });
  } catch (error) {
    console.error('Error converting ANX to Markdown:', error);
    res.status(400).json({ error: 'Invalid ANX content. Please check your input.' });
  }
});

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
app.post('/convert-to-nodes', (req, res) => {
  try {
    const { anxContent } = req.body;
    
    // Convert ANX to nodes structure
    const nodesStructure = anxToNodes(anxContent);
    
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
app.post('/execute-cli', (req, res) => {
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
      case 'set_form':
        // 从存储中获取cardKey对应的节点
        const formNode = nodeStorage.get(cardKey);
        if (formNode) {
          try {
            // 解析JSON参数，移除两端的单引号
            let jsonString = params.join(' ');
            // 移除两端的单引号
            if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
              jsonString = jsonString.substring(1, jsonString.length - 1);
            }
            const formData = JSON.parse(jsonString);
            // 更新表单的data.value
            if (!formNode.data) {
              formNode.data = { value: {} };
            }
            formNode.data.value = formData;
            // 更新存储
            nodeStorage.set(cardKey, formNode);
            result = { message: 'Form data updated successfully', data: formData };
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

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
