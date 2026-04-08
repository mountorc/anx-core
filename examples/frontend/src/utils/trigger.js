/**
 * 触发事件处理工具
 */

/**
 * 处理触发事件
 * @param {string} cardKey - 卡片 key
 * @param {Object} tapSet - tapSet 配置
 */
export async function triggerDeal(cardKey, tapSet = null) {
  console.log("cardKey" + cardKey);
  if (tapSet) {
    console.log("with tapSet:", tapSet);
  }

  try {
    // 直接调用后端 API 触发 cardKey 节点点击
    const response = await fetch('/api/trigger-card-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cardKey, tapSet })
    });

    if (!response.ok) {
      throw new Error('Failed to trigger card key');
    }

    const result = await response.json();
    console.log('Card key triggered:', result);

    // 发送消息到父窗口，触发日志记录
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'TRIGGER_CARD_KEY',
        cardKey: cardKey,
        tapSet: tapSet,
        timestamp: new Date().toISOString()
      }, '*');
    }

    // 触发全局事件
    window.dispatchEvent(new CustomEvent('triggerCardKey', {
      detail: {
        cardKey: cardKey,
        tapSet: tapSet,
        timestamp: new Date().toISOString(),
        result: result
      }
    }));

    return result;
  } catch (error) {
    console.error('Error triggering card key:', error);

    // 发送错误消息到父窗口，触发错误日志记录
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'TRIGGER_CARD_KEY_ERROR',
        cardKey: cardKey,
        tapSet: tapSet,
        error: error.message,
        timestamp: new Date().toISOString()
      }, '*');
    }

    throw error;
  }
}

/**
 * 处理 tapSet 动作
 * @param {string} cardKey - 卡片 key
 * @param {Object} tapSet - tapSet 配置
 */
export async function handleTapSet(cardKey, tapSet) {
  console.log("Handle tap set:", { cardKey, tapSet });
  
  try {
    // 直接调用后端 API 处理 tapSet 动作
    const response = await fetch('/api/handle-tap-set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cardKey, tapSet })
    });
    
    if (!response.ok) {
      throw new Error('Failed to handle tap set');
    }
    
    const result = await response.json();
    console.log('Tap set handled:', result);
    
    // 发送消息到父窗口，触发日志记录
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'HANDLE_TAP_SET',
        cardKey: cardKey,
        tapSet: tapSet,
        timestamp: new Date().toISOString()
      }, '*');
    }
    
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('handleTapSet', {
      detail: {
        cardKey: cardKey,
        tapSet: tapSet,
        timestamp: new Date().toISOString(),
        result: result
      }
    }));
    
    return result;
  } catch (error) {
    console.error('Error handling tap set:', error);
    
    // 发送错误消息到父窗口，触发错误日志记录
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'HANDLE_TAP_SET_ERROR',
        cardKey: cardKey,
        tapSet: tapSet,
        error: error.message,
        timestamp: new Date().toISOString()
      }, '*');
    }
    
    throw error;
  }
}

/**
 * 处理按钮点击事件
 * @param {HTMLElement} buttonElement - 按钮元素
 */
export async function buttonTap(buttonElement) {
  console.log("buttonTap called3");
  const cardKey = buttonElement.getAttribute("data-card-key");
  const tapSetJson = buttonElement.getAttribute("data-tap-set");
  const labelJson = buttonElement.getAttribute("data-label");
  const nodeJson = buttonElement.getAttribute("data-node");

  let tapSet = null;
  if (tapSetJson) {
    tapSet = JSON.parse(tapSetJson);
    console.log("Tap set:", tapSet);
    // 显示 tapSet 配置的弹窗
    alert(JSON.stringify(tapSet, null, 2));

    // 直接调用后端 API 处理 tapSet 动作
    if (cardKey) {
      await handleTapSet(cardKey, tapSet);
    }
  }

  if (cardKey) {
    // 传递 tapSet 到 triggerDeal，以便记录到 systemLog
    await triggerDeal(cardKey, tapSet);
  }
}
