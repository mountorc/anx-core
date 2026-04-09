/**
 * 工具函数
 */

import { triggerDeal, buttonTap } from './trigger.js';
import * as fileUpload from './fileUpload.js';

// 导出trigger.js中的函数
export { triggerDeal, buttonTap };

// 导出fileUpload.js中的函数
export const { handleFileChange, handleSingleFile, handleMultipleFiles, uploadFile, removeFile, triggerFileInput } = fileUpload;
