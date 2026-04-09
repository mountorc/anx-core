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
    // 显示 tapSet 配置的弹窗
    alert(JSON.stringify(tapSet, null, 2));
  }
  
  if (cardKey) {
    triggerDeal(cardKey);
  }
}
