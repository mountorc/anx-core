/**
 * 文件上传工具函数
 */

/**
 * 处理文件选择事件
 * @param {Event} event - 文件选择事件
 * @param {string} cardKey - 节点的cardKey
 * @param {string} kind - 文件类型（file, image, images）
 * @param {number} maxSize - 文件大小限制（字节）
 * @param {number} maxCount - 最大文件数量
 * @param {boolean} preview - 是否预览
 */
export function handleFileChange(event, cardKey, kind, maxSize, maxCount, preview) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  // 处理文件验证和上传
  if (kind === 'image' || kind === 'file') {
    handleSingleFile(files[0], cardKey, kind, maxSize, preview);
  } else if (kind === 'images') {
    handleMultipleFiles(files, cardKey, maxSize, maxCount, preview);
  }
  
  // 重置文件输入
  event.target.value = '';
}

/**
 * 处理单个文件上传
 * @param {File} file - 单个文件
 * @param {string} cardKey - 节点的cardKey
 * @param {string} kind - 文件类型（file, image）
 * @param {number} maxSize - 文件大小限制（字节）
 * @param {boolean} preview - 是否预览
 */
export function handleSingleFile(file, cardKey, kind, maxSize, preview) {
  // 验证文件大小
  if (file.size > maxSize) {
    alert('文件大小超过限制');
    return;
  }
  
  // 生成预览URL
  const previewUrl = URL.createObjectURL(file);
  
  // 临时更新节点的预览URL
  if (window.anxNodeUpdate) {
    window.anxNodeUpdate(cardKey, 'value', previewUrl);
  }
  
  // 上传文件到服务器
  uploadFile(file, cardKey, kind);
}

/**
 * 处理多个文件上传
 * @param {FileList} files - 文件列表
 * @param {string} cardKey - 节点的cardKey
 * @param {number} maxSize - 文件大小限制（字节）
 * @param {number} maxCount - 最大文件数量
 * @param {boolean} preview - 是否预览
 */
export function handleMultipleFiles(files, cardKey, maxSize, maxCount, preview) {
  const currentValue = window.anxGetNodeValue ? window.anxGetNodeValue(cardKey) : [];
  const newFiles = [...currentValue];
  
  for (let i = 0; i < files.length; i++) {
    if (newFiles.length >= maxCount) {
      alert("最多只能上传" + maxCount + "个文件");
      break;
    }
    
    const file = files[i];
    
    // 验证文件大小
    if (file.size > maxSize) {
      alert('文件大小超过限制');
      return;
    }
    
    // 生成预览URL
    const previewUrl = URL.createObjectURL(file);
    newFiles.push(previewUrl);
    
    // 临时更新节点的预览URL
    if (window.anxNodeUpdate) {
      window.anxNodeUpdate(cardKey, 'value', newFiles);
    }
    
    // 上传文件到服务器
    uploadFile(file, cardKey, 'images', newFiles.length - 1);
  }
}

/**
 * 上传文件到服务器
 * @param {File} file - 要上传的文件
 * @param {string} cardKey - 节点的cardKey
 * @param {string} kind - 文件类型（file, image, images）
 * @param {number} index - 多文件上传时的索引
 */
export async function uploadFile(file, cardKey, kind, index) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // 上传到后端
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('上传失败');
    }
    
    const data = await response.json();
    
    if (data.success) {
      const fileUrl = data.fileUrl;
      
      if (window.anxNodeUpdate) {
        if (kind === 'image' || kind === 'file') {
          // 更新为服务器URL
          window.anxNodeUpdate(cardKey, 'value', fileUrl);
        } else if (kind === 'images') {
          // 更新特定索引的服务器URL
          const currentValue = window.anxGetNodeValue ? window.anxGetNodeValue(cardKey) : [];
          const newValues = [...currentValue];
          newValues[index] = fileUrl;
          window.anxNodeUpdate(cardKey, 'value', newValues);
        }
      }
    }
  } catch (error) {
    console.error('文件上传错误:', error);
    alert('文件上传失败');
  }
}

/**
 * 移除文件
 * @param {string} cardKey - 节点的cardKey
 * @param {string} kind - 文件类型（file, image, images）
 * @param {number} index - 多文件上传时的索引
 */
export function removeFile(cardKey, kind, index) {
  if (window.anxNodeUpdate) {
    if (kind === 'image' || kind === 'file') {
      window.anxNodeUpdate(cardKey, 'value', '');
    } else if (kind === 'images') {
      const currentValue = window.anxGetNodeValue ? window.anxGetNodeValue(cardKey) : [];
      const newValues = currentValue.filter((_, i) => i !== index);
      window.anxNodeUpdate(cardKey, 'value', newValues);
    }
  }
}

/**
 * 触发文件输入
 * @param {string} inputId - 文件输入元素的ID
 */
export function triggerFileInput(inputId) {
  console.log('FileUpload1: triggerFileInput called with inputId:', inputId);
  
  // 首先尝试在主文档中查找
  let input = document.getElementById(inputId);
  
  // 如果在主文档中找不到，尝试在所有ANXView组件的Shadow DOM中查找
  if (!input) {
    const anxViews = document.querySelectorAll('anx-view');
    for (const anxView of anxViews) {
      try {
        input = anxView.shadowRoot.getElementById(inputId);
        if (input) {
          console.log('FileUpload: Found file input in Shadow DOM');
          break;
        }
      } catch (error) {
        console.warn('FileUpload: Error accessing Shadow DOM:', error);
      }
    }
  }
  
  if (input) {
    input.click();
    console.log('FileUpload: File input clicked successfully');
  } else {
    console.error('FileUpload: File input not found:', inputId);
  }
}
