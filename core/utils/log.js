/**
 * log.js - 日志记录和读取工具
 */

const fs = require('fs');
const path = require('path');

// 日志文件路径
const LOG_FILE_PATH = path.resolve(__dirname, '../../log/system-logs.json');
const COMMAND_LOG_FILE_PATH = path.resolve(__dirname, '../../log/commands-logs.json');
const MAX_LOGS = 1000;
const MAX_COMMAND_LOGS = 1000;

/**
 * 生成 UUID
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 格式化时间戳为 YYYY-MM-DD HH:MM:SS 格式
 * @returns {string} 格式化的时间字符串
 */
function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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
 * 确保命令日志目录和文件存在
 */
function ensureCommandLogFileExists() {
  const logDir = path.dirname(COMMAND_LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  if (!fs.existsSync(COMMAND_LOG_FILE_PATH)) {
    fs.writeFileSync(COMMAND_LOG_FILE_PATH, '[]', 'utf8');
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
    timestamp: formatTimestamp(),
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
    timestamp: formatTimestamp(),
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

/**
 * 写入命令日志到文件
 * @param {Object} commandEntry - 命令日志条目
 */
function writeCommandLog(commandEntry) {
  try {
    ensureCommandLogFileExists();
    
    // 读取现有命令日志
    let existingCommands = [];
    const existingContent = fs.readFileSync(COMMAND_LOG_FILE_PATH, 'utf8');
    try {
      existingCommands = JSON.parse(existingContent);
    } catch (parseError) {
      console.error('Failed to parse existing command logs:', parseError);
      existingCommands = [];
    }
    
    // 添加新命令日志
    existingCommands.unshift(commandEntry);
    
    // 保持最多MAX_COMMAND_LOGS条日志
    const limitedCommands = existingCommands.slice(0, MAX_COMMAND_LOGS);
    
    // 写入回文件
    fs.writeFileSync(COMMAND_LOG_FILE_PATH, JSON.stringify(limitedCommands, null, 2));
    console.log('[Command Log] Command log written to file:', COMMAND_LOG_FILE_PATH);
  } catch (error) {
    console.error('Failed to write command log:', error);
  }
}

/**
 * 通过cardKey查找节点获取uuid信息
 * @param {string} cardKey - 节点卡键
 * @returns {Object} 包含uuid_page和uuid_tile的对象
 */
function getUuidsFromCardKey(cardKey) {
  try {
    const NODES_FILE_PATH = path.resolve(__dirname, '../../log/nodes.json');
    const PAGES_FILE_PATH = path.resolve(__dirname, '../../examples/backend/app/pages.json');
    
    // 首先从nodes.json获取uuid_page
    let uuidPage = null;
    if (fs.existsSync(NODES_FILE_PATH)) {
      const nodesContent = fs.readFileSync(NODES_FILE_PATH, 'utf8');
      const nodes = JSON.parse(nodesContent);
      
      // 直接查找节点
      let node = nodes[cardKey];
      
      // 如果找到了节点，尝试获取uuid_page
      if (node && node.uuid_page) {
        uuidPage = node.uuid_page;
      } else if (node && node.parentCardKey) {
        // 递归查找父节点
        const parentUuids = getUuidsFromCardKey(node.parentCardKey);
        uuidPage = parentUuids.uuidPage;
      }
    }
    
    // 如果找到了uuid_page，尝试从pages.json获取uuid_tile
    let uuidTile = null;
    if (uuidPage && fs.existsSync(PAGES_FILE_PATH)) {
      const pagesContent = fs.readFileSync(PAGES_FILE_PATH, 'utf8');
      const pagesData = JSON.parse(pagesContent);
      
      // 在pages数组中查找对应的uuid_page
      const page = pagesData.pages.find(p => p.uuid_page === uuidPage);
      if (page && page.uuid_tile) {
        uuidTile = page.uuid_tile;
      }
    }
    
    return { uuidPage, uuidTile };
  } catch (error) {
    console.error('[Log] Failed to get uuids from cardKey:', error);
    return { uuidPage: null, uuidTile: null };
  }
}

/**
 * 记录接收到的命令
 * @param {Object} commandContent - 命令内容
 * @param {string} [commandVisitor] - 命令visitor uuid
 * @param {string} [commandPage] - 命令page uuid
 * @param {string} [commandTile] - 命令tile uuid或url
 * @returns {Object} 命令日志条目
 */
function logReceivedCommand(commandContent, commandVisitor = null, commandPage = null, commandTile = null) {
  // 如果没有commandPage但有cardKey，尝试通过cardKey获取uuid_page和uuid_tile
  if (!commandPage && !commandTile && commandContent && commandContent.cardKey) {
    const { uuidPage, uuidTile } = getUuidsFromCardKey(commandContent.cardKey);
    if (uuidPage && !commandPage) {
      commandPage = uuidPage;
    }
    if (uuidTile && !commandTile) {
      commandTile = uuidTile;
    }
  }
  
  const commandEntry = {
    commandContent: commandContent,
    commandUuid: generateUUID(),
    commandUuidVisitor: commandVisitor,
    commandUuidPage: commandPage,
    commandUuidTile: commandTile,
    timestamp: formatTimestamp()
  };

  // 打印到控制台
  console.log('[Command Received]', {
    commandUuid: commandEntry.commandUuid,
    commandVisitor,
    commandPage,
    commandTile
  });

  // 写入到文件
  writeCommandLog(commandEntry);

  return commandEntry;
}

/**
 * 读取命令日志文件
 * @param {number} limit - 限制返回的命令日志数量
 * @returns {Array} 命令日志数组
 */
function readCommandLogs(limit = 100) {
  try {
    ensureCommandLogFileExists();
    
    const existingContent = fs.readFileSync(COMMAND_LOG_FILE_PATH, 'utf8');
    let commands = [];
    try {
      commands = JSON.parse(existingContent);
    } catch (parseError) {
      console.error('Failed to parse command logs:', parseError);
      commands = [];
    }
    
    return commands.slice(0, limit);
  } catch (error) {
    console.error('Failed to read command logs:', error);
    return [];
  }
}

// 导出模块
module.exports = {
  writeLog,
  readLogs,
  logToSystem,
  logError,
  clearLogs,
  getLogStats,
  writeCommandLog,
  logReceivedCommand,
  readCommandLogs
};
