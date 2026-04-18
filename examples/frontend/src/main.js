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

const app = createApp(App).use(router)

// 创建全局事件总线
app.config.globalProperties.$eventBus = {
  on: function(event, callback) {
    window.addEventListener(event, (e) => callback(e.detail))
  },
  emit: function(event, data) {
    window.dispatchEvent(new CustomEvent(event, { detail: data }))
  }
}

app.mount('#app')
