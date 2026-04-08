/**
 * Request handling utility
 * Handles HTTP requests and logs them to system log
 */

/**
 * Execute an HTTP request
 * @param {Object} config - Request configuration
 * @param {Object} data - Data object for parameter mapping
 * @returns {Promise} - Request result
 */
export async function executeRequest(config, data = {}) {
  const { method = 'GET', url, paramMap = {}, headers = {} } = config;
  
  // Log request start
  logRequest('request_start', {
    method,
    url,
    paramMap,
    timestamp: new Date().toISOString()
  });
  
  if (!url) {
    const error = new Error('Request URL is required');
    logRequest('request_error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
  
  try {
    // Build parameters
    const params = {};
    if (paramMap && typeof paramMap === 'object') {
      Object.keys(paramMap).forEach(targetParam => {
        const sourceField = paramMap[targetParam];
        // Check if sourceField is a field path or a literal value
        const value = getDataValue(data, sourceField);
        if (value !== undefined) {
          params[targetParam] = value;
        } else {
          // If not found in data, use the sourceField as literal value
          params[targetParam] = sourceField;
        }
      });
    }
    
    // Log parameters
    logRequest('request_params', {
      params,
      timestamp: new Date().toISOString()
    });
    
    // Build fetch options
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    let requestUrl = url;
    
    // Handle GET request parameters
    if (method.toUpperCase() === 'GET') {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        searchParams.set(key, params[key]);
      });
      const queryString = searchParams.toString();
      if (queryString) {
        requestUrl = `${url}?${queryString}`;
      }
    } else {
      // Handle POST/PUT/PATCH request body
      fetchOptions.body = JSON.stringify(params);
    }
    
    // Log request details
    logRequest('request_send', {
      url: requestUrl,
      method: fetchOptions.method,
      headers: fetchOptions.headers,
      body: fetchOptions.body,
      timestamp: new Date().toISOString()
    });
    
    // Execute request
    const response = await fetch(requestUrl, fetchOptions);
    
    // Log response status
    logRequest('request_response', {
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse response
    const responseData = await response.json();
    
    // Log request success
    logRequest('request_success', {
      status: response.status,
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      status: response.status,
      data: responseData
    };
    
  } catch (error) {
    // Log request error
    logRequest('request_error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

/**
 * Log request activity to system log
 * @param {string} action - Action type
 * @param {Object} details - Log details
 */
function logRequest(action, details) {
  const logEntry = {
    type: 'system',
    action: `request_${action}`,
    timestamp: details.timestamp || new Date().toISOString(),
    details: details,
    message: `[Request] ${action}: ${JSON.stringify(details)}`
  };
  
  // Log to console
  console.log(`[Request] ${action}:`, details);
  
  // Dispatch global event for external logging
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('systemLog', {
      detail: logEntry
    }));
  }
  
  // Store in localStorage for persistence
  if (typeof localStorage !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
      logs.unshift(logEntry);
      // Keep only last 100 logs
      const limitedLogs = logs.slice(0, 100);
      localStorage.setItem('systemLogs', JSON.stringify(limitedLogs));
    } catch (e) {
      console.error('Failed to store log:', e);
    }
  }
}

/**
 * Get data value from object by field path
 * @param {Object} data - Data object
 * @param {string} fieldPath - Field path (e.g., "user.name" or "images[0]")
 * @returns {*} - Field value or undefined
 */
function getDataValue(data, fieldPath) {
  if (!data || !fieldPath) return undefined;
  
  // Handle array index notation like "images[0]"
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
  
  // Handle dot notation like "user.name"
  const parts = fieldPath.split('.');
  let value = data;
  
  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Get all system logs
 * @returns {Array} - Array of log entries
 */
export function getSystemLogs() {
  if (typeof localStorage !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem('systemLogs') || '[]');
    } catch (e) {
      console.error('Failed to get logs:', e);
      return [];
    }
  }
  return [];
}

/**
 * Clear system logs
 */
export function clearSystemLogs() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('systemLogs');
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  }
}
