export function handleTapSet(tapSet, data, element) {
  if (!tapSet || typeof tapSet !== 'object') return;

  const tapHandler = (event) => {
    Object.keys(tapSet).forEach(actionType => {
      const actionConfig = tapSet[actionType];
      handleAction(actionType, actionConfig, data, event, element);
    });
  };

  element.addEventListener('click', tapHandler);
  return tapHandler;
}

export function handleTriggerSet(triggerSet, data, element) {
  if (!triggerSet || typeof triggerSet !== 'object') return {};

  const handlers = {};

  Object.keys(triggerSet).forEach(triggerType => {
    const actionConfig = triggerSet[triggerType];
    const eventType = mapTriggerTypeToEvent(triggerType);
    
    if (eventType) {
      const handler = (event) => {
        Object.keys(actionConfig).forEach(actionType => {
          handleAction(actionType, actionConfig[actionType], data, event, element);
        });
      };

      element.addEventListener(eventType, handler);
      handlers[triggerType] = handler;
    }
  });

  return handlers;
}

export function generateEventHandlers(config, data, element) {
  const handlers = {};

  if (config.tapSet) {
    handlers.tap = handleTapSet(config.tapSet, data, element);
  }

  if (config.triggerSet) {
    handlers.triggers = handleTriggerSet(config.triggerSet, data, element);
  }

  return handlers;
}

export function addEventListeners(element, config, data) {
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

function handleAction(actionType, actionConfig, data, event, element) {
  // 记录操作开始
  console.log(`[Action] Starting ${actionType} action`, {
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
        handleRequestSet(actionConfig, data, event);
        break;
      default:
        console.warn(`[Action] Unknown action type: ${actionType}`);
    }
    // 记录操作成功
    console.log(`[Action] ${actionType} action completed successfully`);
  } catch (error) {
    // 记录操作错误
    console.error(`[Action] Error in ${actionType} action:`, error);
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
  window.location.href = path;
}

function handleNavigateBack(config, event) {
  console.log('[Action] NavigateBack - Navigating back to previous page');
  window.history.back();
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

function handleRequestSet(config, data, event) {
  console.log('[Action] RequestSet - Preparing API request', {
    url: config.url,
    method: config.method,
    paramMap: config.paramMap,
    data: data
  });

  if (!config.url) {
    console.warn('[Action] RequestSet - No URL specified');
    return;
  }

  const method = config.method || 'GET';
  const params = {};

  if (config.paramMap && typeof config.paramMap === 'object') {
    Object.keys(config.paramMap).forEach(targetParam => {
      const sourceField = config.paramMap[targetParam];
      const value = getDataValue(data, sourceField);
      if (value !== undefined) {
        params[targetParam] = value;
        console.log(`[Action] RequestSet - Added parameter ${targetParam}: ${value}`);
      }
    });
  }

  let url = config.url;
  const fetchOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (method === 'GET') {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      searchParams.set(key, params[key]);
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${url}?${queryString}`;
      console.log('[Action] RequestSet - Generated full URL with query string:', url);
    }
  } else {
    fetchOptions.body = JSON.stringify(params);
    console.log('[Action] RequestSet - Prepared request body:', fetchOptions.body);
  }

  console.log('[Action] RequestSet - Sending API request:', {
    url: url,
    method: method,
    headers: fetchOptions.headers
  });
  
  fetch(url, fetchOptions)
    .then(response => {
      console.log('[Action] RequestSet - Received response:', {
        status: response.status,
        statusText: response.statusText
      });
      return response.json();
    })
    .then(responseData => {
      console.log('[Action] RequestSet - Request response data:', responseData);
    })
    .catch(error => {
      console.error('[Action] RequestSet - Request error:', error);
    });
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