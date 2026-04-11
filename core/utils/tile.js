/**
 * tile.js - Tile 相关工具函数
 */

// 存储 hub 中的 anx config
let hubAnxMap = new Map();

/**
 * 设置 hub anx map
 * @param {Map} map - hub anx map
 */
function setHubAnxMap(map) {
  hubAnxMap = map;
}

/**
 * 获取 hub anx map
 * @returns {Map} - hub anx map
 */
function getHubAnxMap() {
  return hubAnxMap;
}

/**
 * 根据 uuid_tile 获取 anxContent
 * @param {string} uuidTile - tile 的 UUID
 * @returns {string|null} - anxContent 或 null
 */
function getAnxContentByUuid(uuidTile) {
  if (!uuidTile) {
    return null;
  }
  
  const hubFile = hubAnxMap.get(uuidTile);
  if (hubFile && hubFile.anxContent) {
    return hubFile.anxContent;
  }
  
  return null;
}

/**
 * 根据 uuid_tile 获取 anxContent，如果找不到则返回错误信息
 * @param {string} uuidTile - tile 的 UUID
 * @returns {Object} - 包含 anxContent 和 error 的对象
 */
function getAnxContent(uuidTile) {
  const anxContent = getAnxContentByUuid(uuidTile);
  
  if (anxContent) {
    return {
      success: true,
      anxContent: anxContent
    };
  } else {
    return {
      success: false,
      error: 'ANX config not found for the given uuid_tile'
    };
  }
}

/**
 * 处理 anxContent 参数
 * @param {string} anxContent - 直接提供的 anxContent
 * @param {string} uuidTile - tile 的 UUID
 * @returns {Object} - 包含 anxContent 和 error 的对象
 */
function processAnxContent(anxContent, uuidTile) {
  // 如果提供了 uuid_tile，则从 hub 中获取 anx config
  if (uuidTile) {
    const result = getAnxContent(uuidTile);
    if (result.success) {
      return {
        success: true,
        anxContent: result.anxContent
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  }
  
  // 如果直接提供了 anxContent，则使用它
  if (anxContent) {
    return {
      success: true,
      anxContent: anxContent
    };
  }
  
  return {
    success: false,
    error: 'Either anxContent or uuid_tile is required'
  };
}

// 导出模块
module.exports = {
  setHubAnxMap,
  getHubAnxMap,
  getAnxContentByUuid,
  getAnxContent,
  processAnxContent
};
