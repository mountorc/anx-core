/**
 * OSS 上传工具
 * 基于 AutoDataSource OSS 上传文件（Token方式）
 */

// 检查是否在Node.js环境中
const isNode = typeof window === 'undefined';

// 在Node.js环境中使用node-fetch和form-data
let fetch;
let FormData;
if (isNode) {
  fetch = require('node-fetch');
  FormData = require('form-data');
} else {
  fetch = window.fetch;
  FormData = window.FormData;
}

const OSS_HOST = 'http://localhost:2427';

/**
 * 使用token上传文件（form-data格式）
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
    
    console.log('OSS Upload: Preparing to upload file:', fileName);
    console.log('OSS Upload: File size:', file.size);
    console.log('OSS Upload: URL:', `${OSS_HOST}/oss/upload-form`);
    
    let headers = {};
    if (isNode && formData.getHeaders) {
      headers = formData.getHeaders();
    }
    
    const response = await fetch(`${OSS_HOST}/oss/upload-form`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    console.log('OSS Upload: Response status:', response.status);
    
    const responseText = await response.text();
    console.log('OSS Upload: Raw response text:', responseText);
    
    try {
      const result = JSON.parse(responseText);
      console.log('OSS Upload: Parsed result:', result);
      
      if (result.success === true) {
        return result;
      } else {
        throw new Error(`Upload failed: ${result.message || 'Unknown error'}`);
      }
    } catch (jsonError) {
      console.warn('OSS Upload: Failed to parse JSON, but continuing to check response:', jsonError);
      
      if (responseText.includes('success') && responseText.includes('true')) {
        console.log('OSS Upload: Response contains success:true, treating as success');
        return { success: true, message: 'Upload successful', data: responseText };
      }
      
      throw new Error(`Upload failed with status ${response.status}: ${responseText}`);
    }
  } catch (error) {
    console.error('OSS Upload: Error uploading file:', error);
    throw error;
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
    // 使用固定的上传token
    const token = '956bcd3eba8346218776dd9f48c5548c554c9';
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

// 在Node.js环境中使用module.exports，在浏览器环境中使用window对象
if (isNode) {
  module.exports = {
    uploadFileByToken,
    uploadImageToOSS
  };
} else {
  window.oss = {
    uploadFileByToken,
    uploadImageToOSS
  };
}
