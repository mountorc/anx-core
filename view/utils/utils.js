/**
 * 工具函数
 */
/**
 * 处理触发事件
 * @param {string} cardKey - 卡片 key
 */
export function triggerDeal(cardKey) {
  console.log("cardKey" + cardKey);
}

/**
 * 生成唯一的 cardKey
 * @returns {string} - 唯一的 cardKey
 */
export function generateCardKey() {
  return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 重建新的 tile node
 * @param {Object} originalNode - 原始节点
 * @returns {Object} - 新的节点
 */
export function rebuildTileNode(originalNode) {
  console.log('=== Rebuild Tile Node ===');
  console.log('Original node:', originalNode);
  
  if (!originalNode) {
    console.error('Original node is null or undefined');
    return null;
  }
  
  // 创建新的 cardKey
  const newCardKey = generateCardKey();
  
  // 深拷贝原始节点并更新相关字段
  const newNode = JSON.parse(JSON.stringify(originalNode));
  
  // 更新 cardKey
  newNode.cardKey = newCardKey;
  
  // 如果有子节点，也更新它们的 cardKey
  if (newNode.children && Array.isArray(newNode.children)) {
    newNode.children = newNode.children.map(child => {
      const childCopy = JSON.parse(JSON.stringify(child));
      childCopy.cardKey = generateCardKey();
      childCopy.parentCardKey = newCardKey;
      return childCopy;
    });
  }
  
  // 重置数据
  if (newNode.data) {
    // 保留配置，但重置动态数据
    Object.keys(newNode.data).forEach(key => {
      if (key !== 'config' && key !== 'schema') {
        newNode.data[key] = undefined;
      }
    });
  }
  
  // 添加重建时间戳
  newNode.rebuildTime = new Date().toISOString();
  
  console.log('New node created:', newNode);
  
  // 触发重建事件
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'REBUILD_TILE',
      originalCardKey: originalNode.cardKey,
      newCardKey: newCardKey,
      node: newNode,
      timestamp: new Date().toISOString()
    }, '*');
  }
  
  window.dispatchEvent(new CustomEvent('rebuildTile', {
    detail: {
      originalCardKey: originalNode.cardKey,
      newCardKey: newCardKey,
      node: newNode
    }
  }));
  
  return newNode;
}

/**
 * 处理按钮点击事件
 * @param {HTMLElement} buttonElement - 按钮元素
 */
export function buttonTap(buttonElement) {
  console.log("buttonTap called2");
  const cardKey = buttonElement.getAttribute("data-card-key");
  const tapSetJson = buttonElement.getAttribute("data-tap-set");
  const labelJson = buttonElement.getAttribute("data-label");
  const nodeJson = buttonElement.getAttribute("data-node");
  
  if (tapSetJson) {
    const tapSet = JSON.parse(tapSetJson);
    console.log("Tap set:", tapSet);
    
    // 检查是否有重建 tile 的操作
    if (tapSet.action === 'rebuildTile') {
      console.log('Rebuild tile action detected');
      if (nodeJson) {
        const originalNode = JSON.parse(nodeJson);
        const newNode = rebuildTileNode(originalNode);
        if (newNode) {
          alert('Tile 重建成功！新的 cardKey: ' + newNode.cardKey);
        }
        return;
      }
    }
    
    // 显示 tapSet 配置的弹窗
    alert(JSON.stringify(tapSet, null, 2));
  }
  
  if (cardKey) {
    triggerDeal(cardKey);
  }
}

/**
 * 全局 rebuildTileTap 函数（用于 onclick 绑定）
 * @param {HTMLElement} buttonElement - 按钮元素
 */
export function rebuildTileTap(buttonElement) {
  console.log('=== Rebuild Tile Tap ===');
  const cardKey = buttonElement.getAttribute('data-card-key');
  const nodeJson = buttonElement.getAttribute('data-node');
  
  console.log('Card key:', cardKey);
  
  if (nodeJson) {
    try {
      const originalNode = JSON.parse(nodeJson);
      const newNode = rebuildTileNode(originalNode);
      if (newNode) {
        alert('Tile 重建成功！\n新的 cardKey: ' + newNode.cardKey);
      } else {
        alert('Tile 重建失败');
      }
    } catch (error) {
      console.error('Error rebuilding tile:', error);
      alert('Tile 重建失败: ' + error.message);
    }
  } else {
    console.warn('No node data found for rebuild');
    alert('无法获取节点数据');
  }
}

// 如果在浏览器环境，挂载到全局对象
if (typeof window !== 'undefined') {
  window.rebuildTileTap = rebuildTileTap;
}
