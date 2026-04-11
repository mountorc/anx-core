/**
 * card.js - 卡片操作模块
 * 封装与卡片相关的高级操作
 */

const { setNode, getNode, updateNodeData, getNodeData, deleteNode, hasNode, getAllNodes } = require('./node.js');





















function createOrUpdateCard(cardKey, cardData = {}, cardConfig = {}) {
  let card = getNode(cardKey);
  
  if (card) {
    if (cardData) {
      updateNodeData(cardKey, cardData);
    }
    if (cardConfig && typeof cardConfig === 'object') {
      card.config = { ...card.config, ...cardConfig };
      setNode(cardKey, card);
    }
    return getNode(cardKey);
  } else {
    const newCard = {
      cardKey,
      data: cardData,
      config: cardConfig
    };
    setNode(cardKey, newCard);
    return newCard;
  }
}

function getCard(cardKey) {
  return getNode(cardKey);
}

function getCardData(cardKey, nick = null) {
  if (nick) {
    const cardData = getNodeData(cardKey);
    if (!cardData) {
      return null;
    }
    // 如果提供了 nick 参数，获取特定字段的值
    // 支持 data.value[nick] 的结构
    let value;
    if (cardData.value && typeof cardData.value === 'object') {
      value = cardData.value[nick];
    }
    // 如果当前卡片没有找到，尝试从父卡片获取
    if (value === undefined) {
      const parentCardKey = getParentCardKey(cardKey);
      if (parentCardKey) {
        value = getCardData(parentCardKey, nick);
      }
    }
    return value;
  }else{
    return null;
  } 
}

function updateCardData(cardKey, data) {
  updateNodeData(cardKey, data);
}

function removeCard(cardKey) {
  if (hasNode(cardKey)) {
    deleteNode(cardKey);
    return true;
  }
  return false;
}

function cardExists(cardKey) {
  return hasNode(cardKey);
}

function updateCardConfig(cardKey, config) {
  const card = getNode(cardKey);
  if (card) {
    card.config = { ...card.config, ...config };
    setNode(cardKey, card);
    return true;
  }
  return false;
}

function getCardConfig(cardKey) {
  const card = getNode(cardKey);
  return card ? card.config : null;
}

function getParentCardKey(cardKey) {
  const card = getNode(cardKey);
  if (card && card.parentCardKey) {
    return card.parentCardKey;
  }
  return null;
}

function setParentCardKey(cardKey, parentCardKey) {
  const card = getNode(cardKey);
  if (card) {
    card.parentCardKey = parentCardKey;
    setNode(cardKey, card);
    return true;
  }
  return false;
}

function getParentCard(cardKey) {
  const parentCardKey = getParentCardKey(cardKey);
  if (parentCardKey) {
    return getCard(parentCardKey);
  }
  return null;
}

function getChildCards(parentCardKey) {
  const allNodes = getAllNodes();
  return allNodes.filter(node => node.parentCardKey === parentCardKey);
}

module.exports = {
  createOrUpdateCard,
  getCard,
  getCardData,
  updateCardData,
  removeCard,
  cardExists,
  updateCardConfig,
  getCardConfig,
  getParentCardKey,
  setParentCardKey,
  getParentCard,
  getChildCards
};