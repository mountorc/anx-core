/**
 * Parameter handling utility
 * Handles parameter mapping and value extraction
 */

// 导入模块
const { autoVar } = require('./autoVar.js');
const { getCardData, getParentCardKey } = require('./card.js');
const { getUuidPageByCardKey } = require('../app/node.js');

/**
 * Build parameters from paramMap
 * @param {Object} paramMap - Parameter mapping object
 * @param {Object} data - Data object for parameter mapping
 * @returns {Promise<Object>} - Built parameters
 */
function buildParams(paramMap, cardKey) {
  const params = {};
  if (paramMap && typeof paramMap === 'object') {
    for (let targetParam in paramMap) {
      const sourceField = paramMap[targetParam];
      let value = undefined;
      if (sourceField === 'uuid_page'||sourceField === 'uuid_node') {
        value = getUuidPageByCardKey(cardKey);
      } else {
        value = autoVar(sourceField, {}, { cardKey });
      }
      if (value !== undefined) {
        params[targetParam] = value;
      }
    }
  }
  return params;
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

// 导出模块
module.exports = {
  buildParams,
  getDataValue
};
