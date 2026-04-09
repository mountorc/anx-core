const { executeRequest } = require('./request.js');
const { logToSystem, logError } = require('./log.js');

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

function handleTapSet(tapSet, data, element) {
  // 记录到系统日志
  logToSystem('handleTapSet', {
    actionType: "",
    actionConfig: {},
    timestamp: new Date().toISOString()
  });
  if (!tapSet || typeof tapSet !== 'object') return;

  const tapHandler = async (event) => {
    for (const actionType of Object.keys(tapSet)) {
      const actionConfig = tapSet[actionType];
      await handleAction(actionType, actionConfig, data, event, element);
    }
  };

  // Frontend event listener
  if (typeof window !== 'undefined' && element && element.addEventListener) {
    element.addEventListener('click', tapHandler);
    console.log('[Trigger] Tap handler added to element');
  } else {
    // Backend simulation
    console.log('[Backend] Tap handler created (simulated)');
    // In a real backend environment, this could be a function that gets called directly
  }
  return tapHandler;
}

function handleTriggerSet(triggerSet, data, element) {
  // 记录到系统日志
  logToSystem('handleTriggerSet', {
    actionType: "",
    actionConfig: {},
    timestamp: new Date().toISOString()
  });
  
  if (!triggerSet || typeof triggerSet !== 'object') return {};

  console.log('[Trigger] Setting up trigger handlers', {
    triggerSet: triggerSet,
    timestamp: new Date().toISOString()
  });

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
          await handleAction(actionType, actionConfig[actionType], data, event, element);
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

async function handleAction(actionType, actionConfig, data, event, element) {
  // 记录操作开始
  console.log(`[Action] Starting ${actionType} action`, {
    actionType: actionType,
    actionConfig: actionConfig,
    timestamp: new Date().toISOString()
  });

  // 记录到系统日志
  logToSystem('action_start', {
    actionType: actionType,
    actionConfig: actionConfig,
    timestamp: new Date().toISOString()
  });

  try {
    switch (actionType) {
      case 'navigateTo':
        handleNavigateTo(actionConfig, data, event);
        break;
      case 'navigateBack':
        handleNavigateBack(actionConfig, event);
        break;
      case 'updateData':
        handleUpdateData(actionConfig, data, event);
        break;
      case 'setTimeout':
        handleSetTimeout(actionConfig, data, event, element);
        break;
      case 'requestSet':
        await handleRequestSet(actionConfig, data, event);
        break;
      default:
        console.warn(`[Action] Unknown action type: ${actionType}`);
    }
    // 记录操作成功
    console.log(`[Action] ${actionType} action completed successfully`);

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
      handleAction(config.action.type, config.action.config, data, event, element);
    } else {
      console.warn('[Action] SetTimeout - No action specified for timeout');
    }
  }, config.delay);
}

async function handleRequestSet(config, data, event) {
  // Log to system
  logToSystem('request_start', {
    url: config.url,
    method: config.method,
    paramMap: config.paramMap,
    timestamp: new Date().toISOString()
  });

  console.log('[Action] RequestSet - Preparing API request', {
    url: config.url,
    method: config.method,
    paramMap: config.paramMap,
    data: data
  });

  if (!config.url) {
    console.warn('[Action] RequestSet - No URL specified');
    logToSystem('request_error', {
      error: 'No URL specified',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // Use the new executeRequest function from request.js
    const result = await executeRequest(config, data);
    console.log('[Action] RequestSet - Request completed successfully:', result);

    // Log success to system
    logToSystem('request_success', {
      url: config.url,
      method: config.method,
      status: result.status,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('[Action] RequestSet - Request error:', error);

    // Log error to system
    logError('request_error', error.message, {
      url: config.url,
      method: config.method,
      timestamp: new Date().toISOString()
    });

    throw error;
  }
}

function getDataValue(data, fieldPath) {
  if (!data || !fieldPath) return undefined;

  // 处理数组索引，如 images[0]
  const arrayIndexRegex = /^(\w+)\[(\d+)\]$/;
  
  if (arrayIndexRegex.test(fieldPath)) {
    const match = fieldPath.match(arrayIndexRegex);
    const arrayName = match[1];
    const index = parseInt(match[2]);
    
    if (data[arrayName] && Array.isArray(data[arrayName])) {
      return data[arrayName][index];
    }
    return undefined;
  }

  // 处理点号分隔的路径，如 user.name
  const parts = fieldPath.split('.');
  let value = data;

  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }

  return value;
}

// 导出模块
module.exports = {
  handleTapSet,
  handleTriggerSet,
  generateEventHandlers,
  addEventListeners
};