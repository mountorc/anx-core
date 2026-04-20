/**
 * dataset-processor.js - 节点数据集处理模块
 */

const { fetchDataset } = require('./dataset.js');
const { setNode } = require('../app/node.js');

/**
 * 处理单个节点的数据集
 * @param {Object} node - 节点对象
 */
async function processNodeDataset(node) {
  if (!node || !node.config || !node.config.dataset) {
    // 如果没有dataset配置，直接返回
    if (node && node.nodes && node.nodes.length > 0) {
      for (const childNode of node.nodes) {
        await processNodeDataset(childNode);
      }
    }
    return;
  }

  try {
    console.log('Processing dataset for node:', node.cardKey, 'with config:', node.config.dataset);
    
    // 获取数据集数据
    const datasetData = await fetchDataset(node.config.dataset);
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
    setNode(node.cardKey, node);
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
      setNode(node.cardKey, node);
      console.log('Using original data due to dataset fetch error:', node.data);
    }
  }

  // 递归处理子节点
  if (node.nodes && node.nodes.length > 0) {
    for (const childNode of node.nodes) {
      await processNodeDataset(childNode);
    }
  }
}

/**
 * 批量处理节点数据集
 * @param {Array} nodes - 节点数组
 */
async function processNodesDataset(nodes) {
  if (!Array.isArray(nodes)) return;
  
  for (const node of nodes) {
    await processNodeDataset(node);
  }
}

module.exports = {
  processNodeDataset,
  processNodesDataset
};
