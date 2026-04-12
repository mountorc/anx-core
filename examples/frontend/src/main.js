import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 导入文件上传函数并暴露到全局作用域
import { handleFileChange, handleSingleFile, handleMultipleFiles, uploadFile, removeFile, triggerFileInput } from './utils/fileUpload.js'

// 将文件上传函数暴露到全局作用域
window.handleFileChange = handleFileChange;
window.handleSingleFile = handleSingleFile;
window.handleMultipleFiles = handleMultipleFiles;
window.uploadFile = uploadFile;
window.removeFile = removeFile;
window.triggerFileInput = triggerFileInput;

createApp(App).use(router).mount('#app')
