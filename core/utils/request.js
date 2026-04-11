/**
 * Request handling utility
 * Handles HTTP requests and logs them to system log
 */

const { logToSystem, logError } = require('./log.js');
const { buildParams } = require('./param.js');

/**
 * Execute an HTTP request
 * @param {Object} config - Request configuration
 * @param {Object} data - Data object for parameter mapping
 * @returns {Promise} - Request result
 */
async function executeRequest(dealSet) {
  let {config, cardKey} = dealSet;
  const { method = 'GET', url, paramMap = {}, headers = {} } = config;
  
  // Log request start
  logToSystem('request_start', {
    method,
    url,
    paramMap,
    timestamp: new Date().toISOString()
  });
  
  if (!url) {
    const error = new Error('Request URL is required');
    logError('request_error', error.message, {
      timestamp: new Date().toISOString()
    });
    throw error;
  }
  
  try {
    // Log parameters
    logToSystem('request_params-start', {
      timestamp: new Date().toISOString()
    });
    // Build parameters
    const params = buildParams(paramMap, cardKey);
    
    // Log parameters
    logToSystem('request_params', {
      params,
      paramMap,
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
    
    /*
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
    logToSystem('request_send', {
      url: requestUrl,
      method: fetchOptions.method,
      headers: fetchOptions.headers,
      body: fetchOptions.body,
      timestamp: new Date().toISOString()
    });
    
    // Execute request
    const response = await fetch(requestUrl, fetchOptions);
    
    // Log response status
    logToSystem('request_response', {
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
    logToSystem('request_success', {
      url: url,
      method: method,
      status: response.status,
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      status: response.status,
      data: responseData
    };
    */
    
  } catch (error) {
    // Log request error
    logError('request_error', error.message, {
      url: url,
      method: method,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}



// 导出模块
module.exports = {
  executeRequest
};
