/**
 * 触发事件处理工具
 */
import { sendMessageToParent, dispatchGlobalEvent, communicateWithBackend } from './postCore.js';

function getUuidVisitor() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('uuid_visitor');
}

/**
 * 处理触发事件
 * @param {string} cardKey - 卡片 key
 * @param {Object} tapSet - tapSet 配置
 * @param {HTMLElement} buttonElement - 按钮元素（可选）
 * @param {string} uuidVisitor - 访客 UUID（可选，优先使用）
 */
export async function triggerDeal(cardKey, tapSet = null, buttonElement = null, uuidVisitor = null) {
  console.log("cardKey" + cardKey);
  if (tapSet) {
    console.log("with tapSet:", tapSet);
  }

  try {
    const uuid_visitor = uuidVisitor || getUuidVisitor();
    
    // 直接调用后端 API 触发 cardKey 节点点击
    const requestData = { cardKey, tapSet };
    if (uuid_visitor) {
      requestData.uuid_visitor = uuid_visitor;
    }
    const result = await communicateWithBackend('/api/trigger-card-key', requestData);
    console.log('Card key triggered:', result);

    // 发送消息到父窗口，触发日志记录
    sendMessageToParent('TRIGGER_CARD_KEY', {
      cardKey: cardKey,
      tapSet: tapSet,
      timestamp: new Date().toISOString()
    });

    // 触发全局事件
    dispatchGlobalEvent('triggerCardKey', {
      cardKey: cardKey,
      tapSet: tapSet,
      timestamp: new Date().toISOString(),
      result: result
    });

    // 如果返回的是 running 状态，更新按钮状态并处理后续逻辑
    if (result && result.status === 'running') {
      handleRunningStatus(result, buttonElement);
    }

    return result;
  } catch (error) {
    console.error('Error triggering card key:', error);

    // 如果有按钮元素，恢复按钮状态
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.classList.remove('loading');
    }

    // 发送错误消息到父窗口，触发错误日志记录
    sendMessageToParent('TRIGGER_CARD_KEY_ERROR', {
      cardKey: cardKey,
      tapSet: tapSet,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw error;
  }
}

/**
 * 处理 running 状态
 * @param {Object} result - 后端返回的结果
 * @param {HTMLElement} buttonElement - 按钮元素（可选）
 */
function handleRunningStatus(result, buttonElement) {
  console.log('[Running Status] Handling running state:', result);

  // 更新按钮状态
  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.classList.add('loading');
    // 保存原始样式以便恢复
    buttonElement.dataset.originalBgColor = buttonElement.style.backgroundColor || window.getComputedStyle(buttonElement).backgroundColor;
    buttonElement.dataset.originalColor = buttonElement.style.color || window.getComputedStyle(buttonElement).color;
    // 改变按钮颜色为橙色（运行中状态）
    buttonElement.style.backgroundColor = '#ff9800';
    buttonElement.style.color = '#ffffff';
    buttonElement.innerHTML = '<span class="loading-spinner"></span> Running...';
  }

  // 触发全局事件通知其他组件
  dispatchGlobalEvent('taskRunning', {
    cardKey: result.cardKey,
    parentCardKey: result.parentCardKey,
    submitStatus: result.submitStatus,
    timestamp: new Date().toISOString()
  });

  // 发送消息到父窗口
  sendMessageToParent('TASK_RUNNING', {
    cardKey: result.cardKey,
    parentCardKey: result.parentCardKey,
    submitStatus: result.submitStatus,
    timestamp: new Date().toISOString()
  });

  // 更新结果显示区域（如果存在）
  updateResultDisplay(result.parentCardKey, 'running');

  // 开始轮询检查任务状态
  startTaskPolling(result.parentCardKey, buttonElement);
}

/**
 * 更新结果显示区域
 * @param {string} parentCardKey - 父节点的 cardKey
 * @param {string} status - 当前状态
 * @param {any} result - 结果数据（可选）
 */
function updateResultDisplay(parentCardKey, status, result = null) {
  // 查找结果显示区域
  const resultArea = document.querySelector('.result-area');
  if (resultArea) {
    const resultContent = resultArea.querySelector('.result-content');
    if (resultContent) {
      if (status === 'running') {
        resultContent.innerHTML = `
          <div class="running-status">
            <div class="status-icon">⏳</div>
            <div class="status-text">处理中...</div>
            <div class="status-spinner"></div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        `;
      } else if (status === 'completed' && result) {
        // 任务完成时显示结果，带有淡入动画
        resultContent.innerHTML = `
          <div class="task-completed">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 20px;">✅</span>
              <span style="font-weight: 600; color: #28a745;">任务完成</span>
            </div>
            <pre style="background: #f8f9fa; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; color: #333;">${JSON.stringify(result, null, 2)}</pre>
          </div>
        `;
      }
    }
  }
  
  // 查找相关卡片并添加/移除运行状态样式
  const relatedCard = document.querySelector(`[data-card-key="${parentCardKey}"]`);
  if (relatedCard) {
    if (status === 'running') {
      relatedCard.classList.add('card-running');
      relatedCard.style.borderColor = '#ff9800';
    } else {
      relatedCard.classList.remove('card-running');
      relatedCard.style.borderColor = '';
    }
  }
}

/**
 * 轮询检查任务状态
 * @param {string} parentCardKey - 父节点的 cardKey
 * @param {HTMLElement} buttonElement - 按钮元素（可选）
 */
function startTaskPolling(parentCardKey, buttonElement) {
  const pollInterval = setInterval(async () => {
    try {
      // 查询节点数据获取最新状态
      const result = await communicateWithBackend('/api/get-node-data', { cardKey: parentCardKey });
      console.log('[Polling] Task status:', result);

      if (result && result.data) {
        const submitStatus = result.data.submitStatus;
        const processing = result.data.processing;

        if (submitStatus === 'submitted' || !processing) {
          // 任务完成
          clearInterval(pollInterval);
          
          // 更新按钮状态
          if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.classList.remove('loading');
            // 恢复原始按钮颜色
            buttonElement.style.backgroundColor = buttonElement.dataset.originalBgColor || '';
            buttonElement.style.color = buttonElement.dataset.originalColor || '';
            buttonElement.innerHTML = '提交';
          }

          // 触发任务完成事件
          dispatchGlobalEvent('taskCompleted', {
            cardKey: parentCardKey,
            submitStatus: submitStatus,
            result: result.data.result,
            timestamp: new Date().toISOString()
          });

          // 更新结果显示
          if (result.data.result) {
            updateResultDisplay(parentCardKey, 'completed', result.data.result);
          }

          // 触发视图刷新事件，通知ANXView重新加载数据
          dispatchGlobalEvent('reloadAnxView', {
            cardKey: parentCardKey,
            reason: 'task_completed',
            timestamp: new Date().toISOString()
          });

          // 发送消息到父窗口通知任务完成
          sendMessageToParent('TASK_COMPLETED', {
            cardKey: parentCardKey,
            submitStatus: submitStatus,
            result: result.data.result,
            timestamp: new Date().toISOString()
          });
        } else if (submitStatus === 'running') {
          // 任务仍在运行中，触发进度更新事件
          dispatchGlobalEvent('taskProgress', {
            cardKey: parentCardKey,
            submitStatus: submitStatus,
            processing: processing,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('[Polling] Error checking task status:', error);
      // 遇到错误时停止轮询
      clearInterval(pollInterval);
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.classList.remove('loading');
        // 恢复原始按钮颜色
        buttonElement.style.backgroundColor = buttonElement.dataset.originalBgColor || '';
        buttonElement.style.color = buttonElement.dataset.originalColor || '';
        buttonElement.innerHTML = '提交';
      }
    }
  }, 2000); // 每2秒轮询一次
}


/**
 * 处理按钮点击事件
 * @param {HTMLElement} buttonElement - 按钮元素
 */
export async function buttonTap(buttonElement) {
  // 点击后立即将按钮变为黄色并添加加载状态
  buttonElement.dataset.originalBgColor = buttonElement.style.backgroundColor || window.getComputedStyle(buttonElement).backgroundColor;
  buttonElement.dataset.originalColor = buttonElement.style.color || window.getComputedStyle(buttonElement).color;
  buttonElement.style.backgroundColor = '#ffeb3b';
  buttonElement.style.color = '#000000';
  buttonElement.disabled = true;
  buttonElement.classList.add('loading');

  const cardKey = buttonElement.getAttribute("data-card-key");
  const tapSetJson = buttonElement.getAttribute("data-tap-set");
  const labelJson = buttonElement.getAttribute("data-label");
  const nodeJson = buttonElement.getAttribute("data-node");

  let tapSet = null;
  if (tapSetJson) {
    tapSet = JSON.parse(tapSetJson);
    console.log("Tap set:", tapSet);
  }

  if (cardKey) {
    try {
      // 传递 tapSet 和 buttonElement 到 triggerDeal
      const result = await triggerDeal(cardKey, tapSet, buttonElement);
      
      // 执行完成后恢复按钮状态
      buttonElement.style.backgroundColor = buttonElement.dataset.originalBgColor || '';
      buttonElement.style.color = buttonElement.dataset.originalColor || '';
      buttonElement.disabled = false;
      buttonElement.classList.remove('loading');
    } catch (error) {
      console.error('Error in buttonTap:', error);
      // 发生错误时也恢复按钮状态
      buttonElement.style.backgroundColor = buttonElement.dataset.originalBgColor || '';
      buttonElement.style.color = buttonElement.dataset.originalColor || '';
      buttonElement.disabled = false;
      buttonElement.classList.remove('loading');
    }
  } else {
    // 没有 cardKey，恢复按钮状态
    buttonElement.style.backgroundColor = buttonElement.dataset.originalBgColor || '';
    buttonElement.style.color = buttonElement.dataset.originalColor || '';
    buttonElement.disabled = false;
    buttonElement.classList.remove('loading');
  }
}
