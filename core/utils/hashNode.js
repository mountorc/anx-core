/**
 * hashNode.js - ANX 哈希缓存模块
 * 用于缓存 ANX 内容到节点结构的映射，避免重复解析
 */

const crypto = require('crypto');

// 存储基于ANX内容的哈希值到节点结构的映射
let anxHashToNodeMap = new Map();

/**
 * 生成ANX内容的哈希值
 * @param {string} anxContent - ANX内容
 * @returns {string} - 哈希值
 */
function generateAnxHash(anxContent) {
  const jsonString = typeof anxContent === 'string' ? anxContent : JSON.stringify(anxContent);
  return crypto.createHash('md5').update(jsonString).digest('hex');
}

/**
 * 根据哈希值获取节点结构
 * @param {string} anxHash - ANX哈希值
 * @returns {Object|null} - 节点结构或null
 */
function getNodesByHash(anxHash) {
  return anxHashToNodeMap.get(anxHash) || null;
}

/**
 * 存储节点结构到哈希映射
 * @param {string} anxHash - ANX哈希值
 * @param {Object} nodesStructure - 节点结构
 */
function setNodesByHash(anxHash, nodesStructure) {
  anxHashToNodeMap.set(anxHash, nodesStructure);
}

/**
 * 检查哈希是否存在于缓存中
 * @param {string} anxHash - ANX哈希值
 * @returns {boolean} - 是否存在
 */
function hasHash(anxHash) {
  return anxHashToNodeMap.has(anxHash);
}

/**
 * 获取缓存的节点结构数量
 * @returns {number} - 缓存数量
 */
function getCacheSize() {
  return anxHashToNodeMap.size;
}

/**
 * 清除指定哈希的缓存
 * @param {string} anxHash - ANX哈希值
 */
function clearHash(anxHash) {
  anxHashToNodeMap.delete(anxHash);
}

/**
 * 清除所有缓存
 */
function clearAllCache() {
  anxHashToNodeMap.clear();
}

/**
 * 获取所有缓存的哈希值
 * @returns {Iterator} - 哈希值迭代器
 */
function getAllHashes() {
  return anxHashToNodeMap.keys();
}

/**
 * 获取缓存的哈希映射（用于调试）
 * @returns {Map} - 哈希映射
 */
function getHashMap() {
  return anxHashToNodeMap;
}

module.exports = {
  anxHashToNodeMap,
  generateAnxHash,
  getNodesByHash,
  setNodesByHash,
  hasHash,
  getCacheSize,
  clearHash,
  clearAllCache,
  getAllHashes,
  getHashMap
};
