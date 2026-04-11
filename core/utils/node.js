/**
 * node.js - 节点存储工具
 */

// 节点存储 - 使用 cardKey 作为键，存储完整的节点结构
const nodeStorage = new Map();

/**
 * 存储节点
 * @param {string} cardKey - 节点卡键
 * @param {Object} node - 节点对象（必须是完整的节点结构）
 */
function setNode(cardKey, node) {
  if (cardKey && node && typeof node === 'object') {
    // 确保存储的是完整的节点结构
    nodeStorage.set(cardKey, JSON.parse(JSON.stringify(node)));
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
