/**
 * Hub 模块 - 处理 tiles 配置的合并和查询
 */

const fs = require('fs');
const path = require('path');

const hubDir = __dirname;
const tilesDir = path.join(hubDir, 'tiles');

/**
 * 获取所有 tiles（合并 hub.json 和 tiles/tiles.json）
 * @returns {Array} - 合并后的 tiles 列表
 */
function getAllTiles() {
  const tiles = [];
  const loadedUuids = new Set();

  // 读取 hub.json
  const hubPath = path.join(hubDir, 'hub.json');
  if (fs.existsSync(hubPath)) {
    try {
      const hubContent = fs.readFileSync(hubPath, 'utf8');
      const hubData = JSON.parse(hubContent);
      if (hubData.tiles && Array.isArray(hubData.tiles)) {
        hubData.tiles.forEach(item => {
          if (item.uuid && item.name) {
            tiles.push({
              uuid: item.uuid,
              name: item.name,
              url: item.url,
              source: 'hub.json'
            });
            loadedUuids.add(item.uuid);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing hub.json:', error);
    }
  }

  // 读取 tiles/tiles.json（补充 hub.json 中没有的项）
  const tilesPath = path.join(tilesDir, 'tiles.json');
  if (fs.existsSync(tilesPath)) {
    try {
      const tilesContent = fs.readFileSync(tilesPath, 'utf8');
      const tilesData = JSON.parse(tilesContent);
      if (Array.isArray(tilesData)) {
        tilesData.forEach(item => {
          if (item.uuid && item.name && !loadedUuids.has(item.uuid)) {
            tiles.push({
              uuid: item.uuid,
              name: item.name,
              url: item.url,
              source: 'tiles/tiles.json'
            });
            loadedUuids.add(item.uuid);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing tiles/tiles.json:', error);
    }
  }

  return tiles;
}

/**
 * 根据 uuid 获取 tile 配置
 * @param {string} uuid - tile 的 UUID
 * @returns {Object|null} - tile 配置或 null
 */
function getTileByUuid(uuid) {
  const tiles = getAllTiles();
  return tiles.find(tile => tile.uuid === uuid) || null;
}

/**
 * 获取 tile 的完整配置（包括本地文件或 URL）
 * @param {string} uuid - tile 的 UUID
 * @returns {Object} - 包含 success, data, error 的对象
 */
async function getTileConfig(uuid) {
  try {
    // 首先查找 tile 信息
    const tile = getTileByUuid(uuid);
    if (!tile) {
      return {
        success: false,
        error: 'Tile not found'
      };
    }

    // 如果有 URL，尝试从 URL 获取配置
    if (tile.url) {
      try {
        const response = await fetch(tile.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        // 支持两种返回格式：直接返回配置 或 {config: {...}}
        const config = result.config || result;
        if (config.uuid && config.anxContent) {
          return {
            success: true,
            data: config,
            source: 'url'
          };
        }
      } catch (error) {
        console.error(`Error loading tile config from URL ${tile.url}:`, error);
      }
    }

    // 尝试从 tiles 目录加载本地文件
    const filePath = path.join(tilesDir, `${uuid}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      if (config.uuid && config.anxContent) {
        return {
          success: true,
          data: config,
          source: 'local'
        };
      }
    }

    return {
      success: false,
      error: 'Tile config not found'
    };
  } catch (error) {
    console.error('Error getting tile config:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getAllTiles,
  getTileByUuid,
  getTileConfig
};