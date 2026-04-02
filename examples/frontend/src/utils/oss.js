/**
 * OSS 上传工具
 * 基于 AutoDataSource OSS 上传文件（Token方式）
 */

const BASE_URL = 'http://localhost:8080/autoDataSource';

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
 * 获取OSS上传token
 * @returns {Promise<string>} - 上传token
 */
async function getOSSToken() {
  try {
    // 这里应该调用获取token的API
    // 由于目前API可能有问题，暂时返回用户提供的有效token
    return 'de12b5548a2b401eb62094d837cc36a1';
  } catch (error) {
    console.error('Error getting OSS token:', error);
    // 出错时返回默认token
    return 'de12b5548a2b401eb62094d837cc36a1';
  }
}

/**
 * 上传图片到OSS
 * @param {File} file - 要上传的图片文件
 * @param {string} basePath - 基础路径，默认为 "anx-core/"
 * @returns {Promise<string>} - 上传后的图片URL
 */
async function uploadImageToOSS(file, basePath = 'anx-core/') {
  try {
    // 获取最新的token
    const token = await getOSSToken();
    console.log('Using OSS token:', token);
    
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

export { uploadFileByToken, uploadImageToOSS };
