const { executeRequest } = require('./request.js');
const { logToSystem, logError } = require('./log.js');
const { getDataValue } = require('./param.js');
const { setNode, getNode, updateNodeData, getNodeData, deleteNode, clearNodes, getAllNodes, getNodeCount, hasNode } = require('./node.js');
const { getCardData,getParentCardKey} = require('./card.js');
const { autoVar} = require('./autoVar.js');
/**
 * Log to system log
 * @param {string} action - Action type
 * @param {Object} details - Log details
 */

/**
 * Log error
 * @param {string} action - Action type
 * @param {string} error - Error message
 * @param {Object} details - Log details
 */

function handleTapSet(dealSet) {
  const {cardKey} = dealSet;
  let parentCardKey=getParentCardKey(cardKey);
  let testValue=getCardData(parentCardKey,"user_prompt")||'none';
  let testValue1=getCardData(cardKey,"user_prompt")||'none';
  let testValue2=autoVar("user_prompt",{},{cardKey:parentCardKey})||'none';
  node=getNode(cardKey);
  let parentNode=getNode(parentCardKey);

  // 记录到系统日志
  let tapSet = node.config.tapSet;
  if (!tapSet || typeof tapSet !== 'object') return;
  logToSystem('handleTapSet-tapSet', {
    cardKey: cardKey,
    parentCardKey,
    testValue,
    testValue1,
    testValue2,
    tapSet: tapSet,
    node,
    parentNode,
    timestamp: new Date().toISOString()
  });
  data=node.data;

    for (let actionType in tapSet) {
      const actionConfig = tapSet[actionType];
      handleAction({
        cardKey,
        parentCardKey,
        actionType, 
        actionConfig, 
        data
      });
    }

    logToSystem('tapSet-end', {
      timestamp: new Date().toISOString()
    });
  return true;
}

function handleTriggerSet(triggerSet, data, element) {
  // 记录到系统日志
  logToSystem('handleTriggerSet', {
    actionType: "",
    actionConfig: {},
    timestamp: new Date().toISOString()
  });
  
  if (!triggerSet || typeof triggerSet !== 'object') return {};

  const handlers = {};

  Object.keys(triggerSet).forEach(triggerType => {
    const actionConfig = triggerSet[triggerType];
    const eventType = mapTriggerTypeToEvent(triggerType);

    if (eventType) {
      console.log('[Trigger] Setting up trigger handler for', {
        triggerType: triggerType,
        eventType: eventType
      });
      const handler = async (event) => {
        console.log('[Trigger] Trigger event triggered', {
          triggerType: triggerType,
          eventType: event ? event.type : 'simulated',
          timestamp: new Date().toISOString()
        });
        for (const actionType of Object.keys(actionConfig)) {
          await handleAction({
            actionType, 
            actionConfig:actionConfig[actionType], 
            data
          });
        }
      };

      // Frontend event listener
      if (typeof window !== 'undefined' && element && element.addEventListener) {
        element.addEventListener(eventType, handler);
        handlers[triggerType] = handler;
        console.log('[Trigger] Trigger handler added for', triggerType);
      } else {
        // Backend simulation
        handlers[triggerType] = handler;
        console.log('[Backend] Trigger handler created for', triggerType, '(simulated)');
        // In a real backend environment, these handlers could be called directly
      }
    } else {
      console.warn('[Trigger] Unknown trigger type:', triggerType);
    }
  });

  console.log('[Trigger] All trigger handlers set up', {
    handlers: Object.keys(handlers)
  });
  return handlers;
}

function generateEventHandlers(config, data, element) {
  const handlers = {};

  if (config.tapSet) {
    handlers.tap = handleTapSet(config.tapSet, data, element);
  }

  if (config.triggerSet) {
    handlers.triggers = handleTriggerSet(config.triggerSet, data, element);
  }

  return handlers;
}

function addEventListeners(element, config, data) {
  return generateEventHandlers(config, data, element);
}

function mapTriggerTypeToEvent(triggerType) {
  const eventMap = {
    input: 'input',
    focus: 'focus',
    blur: 'blur',
    submit: 'submit',
    tap: 'click',
    longtap: 'contextmenu', // Using contextmenu as long tap alternative
    doubletap: 'dblclick',
    cancel: 'cancel',
    clear: 'input'
  };

  return eventMap[triggerType] || null;
}

async function handleAction(dealSet) {
  const {cardKey, parentCardKey, actionType, actionConfig, data} = dealSet;
  // 记录操作开始

  logToSystem('handleAction-start', {
    cardKey: cardKey,
    parentCardKey,
    actionType: actionType,
    actionConfig:actionConfig,
    data:data,
    timestamp: new Date().toISOString()
  });

  try {
    switch (actionType) {
      case 'navigateTo':
        handleNavigateTo(actionConfig, data);
        break;
      case 'navigateBack':
        handleNavigateBack(actionConfig);
        break;
      case 'updateData':
        handleUpdateData(actionConfig, data);
        break;
      case 'setTimeout':
        handleSetTimeout(actionConfig, data);
        break;
      case 'requestSet':
        handleRequestSet({cardKey, parentCardKey:parentCardKey,config:actionConfig, data});
        break;
      default:
        console.warn(`[Action] Unknown action type: ${actionType}`);
    }
    // 记录到系统日志
    logToSystem('action_success', {
      actionType: actionType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // 记录操作错误
    console.error(`[Action] Error in ${actionType} action:`, error);

    // 记录到系统日志
    logError('action_error', error.message, {
      actionType: actionType,
      timestamp: new Date().toISOString()
    });
  }
}

function handleNavigateTo(config, data, event) {
  console.log('[Action] NavigateTo - Preparing navigation', {
    targetPath: config.path,
    paramMap: config.paramMap,
    data: data
  });

  if (!config.path) {
    console.warn('[Action] NavigateTo - No path specified');
    return;
  }

  let path = config.path;
  const params = new URLSearchParams();

  if (config.paramMap && typeof config.paramMap === 'object') {
    Object.keys(config.paramMap).forEach(targetParam => {
      const sourceField = config.paramMap[targetParam];
      const value = getDataValue(data, sourceField);
      if (value !== undefined) {
        params.set(targetParam, value);
        console.log(`[Action] NavigateTo - Added parameter ${targetParam}: ${value}`);
      }
    });
  }

  const queryString = params.toString();
  if (queryString) {
    path = `${path}?${queryString}`;
    console.log('[Action] NavigateTo - Generated full path:', path);
  }

  console.log('[Action] NavigateTo - Navigating to:', path);
  
  // Frontend navigation
  if (typeof window !== 'undefined') {
    window.location.href = path;
  } else {
    // Backend navigation (simulated)
    console.log('[Backend] NavigateTo - Would navigate to:', path);
    // In a real backend environment, this could be a redirect or API call
  }
}

function handleNavigateBack(config, event) {
  console.log('[Action] NavigateBack - Navigating back to previous page');
  
  // Frontend navigation
  if (typeof window !== 'undefined') {
    window.history.back();
  } else {
    // Backend navigation (simulated)
    console.log('[Backend] NavigateBack - Would navigate back');
    // In a real backend environment, this could be a redirect or API call
  }
}

function handleUpdateData(config, data, event) {
  console.log('[Action] UpdateData - Preparing data update', {
    tableName: config.tableName,
    paramMap: config.paramMap,
    uniqueMap: config.uniqueMap,
    data: data
  });

  if (!config.tableName) {
    console.warn('[Action] UpdateData - No tableName specified');
    return;
  }

  // This is a placeholder implementation
  // In a real application, this would update the data in a dataset
  console.log('[Action] UpdateData - Updating data:', {
    tableName: config.tableName,
    paramMap: config.paramMap,
    uniqueMap: config.uniqueMap,
    data: data
  });
}

function handleSetTimeout(config, data, event, element) {
  console.log('[Action] SetTimeout - Preparing delayed action', {
    delay: config.delay,
    action: config.action
  });

  if (!config.delay) {
    console.warn('[Action] SetTimeout - No delay specified');
    return;
  }

  console.log(`[Action] SetTimeout - Setting timeout for ${config.delay}ms`);
  setTimeout(() => {
    console.log('[Action] SetTimeout - Executing delayed action');
    if (config.action) {
      handleAction({
        cardKey: cardKey,
        parentCardKey: parentCardKey,
        actionType:config.action.type, 
        actionConfig:config.action.config, 
        data
      });
    } else {
      console.warn('[Action] SetTimeout - No action specified for timeout');
    }
  }, config.delay);
}

function handleRequestSet(dealSet) {
  const {cardKey, parentCardKey, config} = dealSet;
  // Log to system
  logToSystem('request_start', {
    cardKey: cardKey,
    url: config.url,
    method: config.method,
    paramMap: config.paramMap,
    timestamp: new Date().toISOString()
  });

  if (!config.url) {
    logToSystem('request_error', {
      error: 'No URL specified',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 如果有 resultSet，在请求开始时设置处理中状态
  if (config.resultSet !== undefined && config.resultSet !== null && config.resultSet !== false) {
    try {
      if (cardKey && typeof cardKey === 'string') {
        updateNodeData(parentCardKey, { processing: true });
        logToSystem('request_processing', {
          cardKey: cardKey,
          parentCardKey: parentCardKey,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('[Action] RequestSet - Error setting processing state:', error);
    }
  }

  // Use the new executeRequest function from request.js
  return executeRequest({config, cardKey})
    .then(result => {
      // Log success to system
      logToSystem('request_success', {
        url: config.url,
        method: config.method,
        result: result,
        timestamp: new Date().toISOString()
      });

      // If resultSet is defined and not null/false, store result to node's data.result
      if (config.resultSet !== undefined && config.resultSet !== null && config.resultSet !== false) {
        try {
          // 检查 cardKey 是否有效
          if (!cardKey || typeof cardKey !== 'string') {
            console.warn('[Action] RequestSet - Invalid cardKey for storing result:', cardKey);
            logToSystem('request_result_stored_error', {
              cardKey: cardKey,
              error: 'Invalid cardKey',
              timestamp: new Date().toISOString()
            });
          } else {
            // 检查节点是否存在
            const existingNode = getNode(cardKey);
            if (!existingNode) {
              console.warn('[Action] RequestSet - Node not found for storing result:', cardKey);
              logToSystem('request_result_stored_error', {
                cardKey: cardKey,
                error: 'Node not found',
                timestamp: new Date().toISOString()
              });
            } else {
              // 安全地存储结果，处理result或result.data为空的情况
              let resultValue = null;
              if (result && result.data && result.data.data !== undefined) {
                resultValue = result.data.data;
              } else if (result && result.data !== undefined) {
                resultValue = result.data;
              } else if (result !== undefined) {
                resultValue = result;
              }
              updateNodeData(parentCardKey, { result: resultValue, processing: false });
              logToSystem('request_result_stored', {
                cardKey: cardKey,
                resultSet: config.resultSet,
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (storeError) {
          // 捕获存储过程中的任何异常，确保不会导致系统崩溃
          console.error('[Action] RequestSet - Error storing result:', storeError);
          logError('request_result_stored_error', storeError.message, {
            cardKey: cardKey,
            timestamp: new Date().toISOString()
          });
          // 不抛出异常，继续返回结果
        }
      } else {
        // 如果没有 resultSet，也清除可能存在的处理中状态
        try {
          updateNodeData(parentCardKey, { processing: false });
        } catch (error) {
          console.warn('[Action] RequestSet - Error clearing processing state:', error);
        }
      }

      return result;
    })
    .catch(error => {
      console.error('[Action] RequestSet - Request error:', error);

      // 清除处理中状态
      if (config.resultSet !== undefined && config.resultSet !== null && config.resultSet !== false) {
        try {
          updateNodeData(parentCardKey, { processing: false });
          logToSystem('request_processing_ended', {
            cardKey: cardKey,
            parentCardKey: parentCardKey,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        } catch (clearError) {
          console.warn('[Action] RequestSet - Error clearing processing state on error:', clearError);
        }
      }

      // Log error to system
      logError('request_error', error.message, {
        url: config.url,
        method: config.method,
        timestamp: new Date().toISOString()
      });

      throw error;
    });
}



// 导出模块
module.exports = {
  handleTapSet,
  handleTriggerSet,
  generateEventHandlers,
  addEventListeners
};