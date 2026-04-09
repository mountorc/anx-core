/**
 * log.js - 日志记录和读取工具
 */

const fs = require('fs');
const path = require('path');

// 日志文件路径
const LOG_FILE_PATH = path.resolve(__dirname, '../../log/system-logs.json');
const MAX_LOGS = 1000;

/**
 * 确保日志目录和文件存在
 */
function ensureLogFileExists() {
  const logDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  if (!fs.existsSync(LOG_FILE_PATH)) {
    fs.writeFileSync(LOG_FILE_PATH, '[]', 'utf8');
  }
}

/**
 * 写入日志到文件
 * @param {Object} logEntry - 日志条目
 */
function writeLog(logEntry) {
  try {
    ensureLogFileExists();
    
    // 读取现有日志
    let existingLogs = [];
    const existingContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    try {
      existingLogs = JSON.parse(existingContent);
    } catch (parseError) {
      console.error('Failed to parse existing logs:', parseError);
      existingLogs = [];
    }
    
    // 添加新日志
    existingLogs.unshift(logEntry);
    
    // 保持最多MAX_LOGS条日志
    const limitedLogs = existingLogs.slice(0, MAX_LOGS);
    
    // 写入回文件
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(limitedLogs, null, 2));
    console.log('[Log] Log written to file:', LOG_FILE_PATH);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

/**
 * 读取日志文件
 * @param {number} limit - 限制返回的日志数量
 * @returns {Array} 日志数组
 */
function readLogs(limit = 100) {
  try {
    ensureLogFileExists();
    
    const existingContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    let logs = [];
    try {
      logs = JSON.parse(existingContent);
    } catch (parseError) {
      console.error('Failed to parse logs:', parseError);
      logs = [];
    }
    
    return logs.slice(0, limit);
  } catch (error) {
    console.error('Failed to read logs:', error);
    return [];
  }
}

/**
 * 记录系统日志
 * @param {string} action - 动作类型
 * @param {Object} details - 日志详情
 */
function logToSystem(action, details) {
  const logEntry = {
    type: 'system',
    action: action,
    timestamp: new Date().toISOString(),
    details: details,
    message: `[System] ${action}: ${JSON.stringify(details)}`
  };

  // 打印到控制台
  console.log(`[System] ${action}:`, details);

  // 写入到文件
  writeLog(logEntry);

  // 前端环境下触发全局事件
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('systemLog', {
      detail: logEntry
    }));
  }

  // 前端环境下存储到localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
      logs.unshift(logEntry);
      // 保持最多100条日志
      const limitedLogs = logs.slice(0, 100);
      localStorage.setItem('systemLogs', JSON.stringify(limitedLogs));
    } catch (e) {
      console.error('Failed to store log in localStorage:', e);
    }
  }

  return logEntry;
}

/**
 * 记录错误日志
 * @param {string} action - 动作类型
 * @param {string} error - 错误信息
 * @param {Object} details - 额外详情
 */
function logError(action, error, details = {}) {
  const logEntry = {
    type: 'error',
    action: action,
    error: error,
    timestamp: new Date().toISOString(),
    details: details,
    message: `[Error] ${action}: ${error}`
  };

  // 打印到控制台
  console.error(`[Error] ${action}:`, error, details);

  // 写入到文件
  writeLog(logEntry);

  return logEntry;
}

/**
 * 清空日志
 */
function clearLogs() {
  try {
    ensureLogFileExists();
    fs.writeFileSync(LOG_FILE_PATH, '[]', 'utf8');
    console.log('[Log] Logs cleared');
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
}

/**
 * 获取日志统计信息
 * @returns {Object} 统计信息
 */
function getLogStats() {
  try {
    ensureLogFileExists();
    
    const existingContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    let logs = [];
    try {
      logs = JSON.parse(existingContent);
    } catch (parseError) {
      console.error('Failed to parse logs:', parseError);
      logs = [];
    }
    
    const stats = {
      total: logs.length,
      byType: {},
      byAction: {}
    };
    
    logs.forEach(log => {
      // 按类型统计
      if (log.type) {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      }
      
      // 按动作统计
      if (log.action) {
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to get log stats:', error);
    return {
      total: 0,
      byType: {},
      byAction: {}
    };
  }
}

// 导出模块
module.exports = {
  writeLog,
  readLogs,
  logToSystem,
  logError,
  clearLogs,
  getLogStats
};
