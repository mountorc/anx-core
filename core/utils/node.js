/**
 * node.js - 节点存储工具
 * 支持内存缓存和文件持久化
 */

const fs = require('fs');
const path = require('path');

// 持久化文件路径
const STORAGE_FILE = path.join(__dirname, '../../log/nodes.json');

// 节点存储 - 使用 cardKey 作为键，存储完整的节点结构
let nodeStorage = new Map();

/**
 * 从文件加载节点数据
 */
function loadNodesFromFile() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, 'utf8');
      const data = JSON.parse(content);
      // 将对象转换为 Map
      nodeStorage = new Map(Object.entries(data));
      console.log(`[Node Storage] Loaded ${nodeStorage.size} nodes from file`);
    } else {
      // 创建空文件
      fs.writeFileSync(STORAGE_FILE, '{}', 'utf8');
      console.log('[Node Storage] Created new storage file');
    }
  } catch (error) {
    console.error('[Node Storage] Error loading nodes from file:', error);
    nodeStorage = new Map();
  }
}

/**
 * 将节点数据保存到文件
 */
function saveNodesToFile() {
  try {
    // 将 Map 转换为对象
    const data = Object.fromEntries(nodeStorage);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('[Node Storage] Nodes saved to file');
  } catch (error) {
    console.error('[Node Storage] Error saving nodes to file:', error);
  }
}

// 初始化时加载数据
loadNodesFromFile();

/**
 * 存储节点
 * @param {string} cardKey - 节点卡键
 * @param {Object} node - 节点对象（必须是完整的节点结构）
 */
function setNode(cardKey, node) {
  if (cardKey && node && typeof node === 'object') {
    // 确保存储的是完整的节点结构（深拷贝）
    nodeStorage.set(cardKey, JSON.parse(JSON.stringify(node)));
    // 保存到文件
    saveNodesToFile();
    console.log('[Node Storage] Node stored:', cardKey);
  } else {
    console.warn('[Node Storage] Invalid node to store:', cardKey);
  }
}

/**
 * 获取节点
 * @param {string} cardKey - 节点卡键
 * @returns {Object|null} 完整的节点对象或null
 */
function getNode(cardKey) {
  const node = nodeStorage.get(cardKey);
  if (node) {
    // 返回深拷贝，避免外部修改影响存储的数据
    return JSON.parse(JSON.stringify(node));
  } else {
    return null;
  }
}

/**
 * 更新节点数据（保持节点结构完整）
 * @param {string} cardKey - 节点卡键
 * @param {Object} data - 要更新的数据
 */
function updateNodeData(cardKey, data) {
  const existingNode = nodeStorage.get(cardKey);
  if (existingNode) {
    // 合并数据，保持节点结构完整
    existingNode.data = existingNode.data || {};
    Object.assign(existingNode.data, data);
    // 重新存储
    nodeStorage.set(cardKey, JSON.parse(JSON.stringify(existingNode)));
    // 保存到文件
    saveNodesToFile();
    console.log('[Node Storage] Node data updated:', cardKey);
  } else {
    console.warn('[Node Storage] Node not found for update:', cardKey);
  }
}

/**
 * 获取节点数据
 * @param {string} cardKey - 节点卡键
 * @returns {Object|null} 节点数据或null
 */
function getNodeData(cardKey) {
  const node = nodeStorage.get(cardKey);
  if (node && node.data) {
    return JSON.parse(JSON.stringify(node.data));
  }
  return null;
}

/**
 * 删除节点
 * @param {string} cardKey - 节点卡键
 */
function deleteNode(cardKey) {
  if (cardKey) {
    const deleted = nodeStorage.delete(cardKey);
    if (deleted) {
      // 保存到文件
      saveNodesToFile();
      console.log('[Node Storage] Node deleted:', cardKey);
    } else {
      console.log('[Node Storage] Node not found for deletion:', cardKey);
    }
  }
}

/**
 * 清除所有节点
 */
function clearNodes() {
  nodeStorage.clear();
  // 保存到文件
  saveNodesToFile();
  console.log('[Node Storage] All nodes cleared');
}

/**
 * 获取所有节点
 * @returns {Array} 节点数组
 */
function getAllNodes() {
  return Array.from(nodeStorage.values());
}

/**
 * 获取存储的节点数量
 * @returns {number} 节点数量
 */
function getNodeCount() {
  return nodeStorage.size;
}

/**
 * 检查节点是否存在
 * @param {string} cardKey - 节点卡键
 * @returns {boolean} 是否存在
 */
function hasNode(cardKey) {
  return nodeStorage.has(cardKey);
}

module.exports = {
  setNode,
  getNode,
  updateNodeData,
  getNodeData,
  deleteNode,
  clearNodes,
  getAllNodes,
  getNodeCount,
  hasNode
};
