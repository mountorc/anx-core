/**
 * OSS 上传工具
 * 基于 AutoDataSource OSS 上传文件（Token方式）
 */

const BASE_URL = '/autoDataSource';

/**
 * 生成上传token
 * @param {string} uuidAutoAuth - 授权UUID，例如 "oss_intostore_123456"
 * @param {string} basePath - 基础路径，文件会上传到该路径下，例如 "turan/"
 * @returns {Promise<Object>} - 包含token的响应对象
 */
async function generateUploadToken(uuidAutoAuth, basePath) {
  try {
    const response = await fetch(`${BASE_URL}/api/oss/token/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `uuid_autoAuth=${encodeURIComponent(uuidAutoAuth)}&basePath=${encodeURIComponent(basePath)}`
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating upload token:', error);
    throw error;
  }
}

/**
 * 使用token上传文件
 * @param {string} token - 上传token
 * @param {File} file - 要上传的文件
 * @param {string} fileName - 文件名
 * @returns {Promise<Object>} - 包含文件URL的响应对象
 */
async function uploadFileByToken(token, file, fileName) {
  try {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('file', file);
    formData.append('fileName', fileName);
    
    const response = await fetch(`${BASE_URL}/api/oss/upload-by-token`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * 上传图片到OSS
 * @param {File} file - 要上传的图片文件
 * @param {string} basePath - 基础路径，默认为 "anx-core/"
 * @param {string} uuidAutoAuth - 授权UUID，默认为 "oss_intostore_123456"
 * @returns {Promise<string>} - 上传后的图片URL
 */
async function uploadImageToOSS(file, basePath = 'anx-core/', uuidAutoAuth = 'oss_intostore_123456') {
  try {
    // 生成上传token
    const tokenResult = await generateUploadToken(uuidAutoAuth, basePath);
    
    if (!tokenResult.success) {
      throw new Error(`Failed to generate token: ${tokenResult.message || 'Unknown error'}`);
    }
    
    const token = tokenResult.data;
    
    // 生成唯一的文件名，避免重复
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
    
    // 上传文件
    const uploadResult = await uploadFileByToken(token, file, fileName);
    
    if (!uploadResult.success) {
      throw new Error(`Failed to upload file: ${uploadResult.message || 'Unknown error'}`);
    }
    
    return uploadResult.data;
  } catch (error) {
    console.error('Error uploading image to OSS:', error);
    throw error;
  }
}

module.exports = {
  generateUploadToken,
  uploadFileByToken,
  uploadImageToOSS
};
