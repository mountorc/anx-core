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
  console.log('FileUpload: handleFileChange called', {
    event: event ? 'event object exists' : 'no event',
    cardKey: cardKey,
    kind: kind,
    maxSize: maxSize,
    maxCount: maxCount,
    preview: preview
  });
  
  if (!event || !event.target) {
    console.error('FileUpload: handleFileChange - event or event.target is null');
    return;
  }
  
  const files = event.target.files;
  console.log('FileUpload: Files selected:', files ? files.length : 0);
  
  if (!files || files.length === 0) {
    console.warn('FileUpload: No files selected');
    return;
  }
  
  // 处理文件验证和上传
  if (kind === 'image' || kind === 'file') {
    console.log('FileUpload: Handling single file upload');
    handleSingleFile(files[0], cardKey, kind, maxSize, preview);
  } else if (kind === 'images') {
    console.log('FileUpload: Handling multiple files upload');
    handleMultipleFiles(files, cardKey, maxSize, maxCount, preview);
  } else {
    console.warn('FileUpload: Unknown kind:', kind);
  }
  
  // 重置文件输入
  event.target.value = '';
  console.log('FileUpload: File input reset');
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
  console.log('FileUpload: Found in main document:', !!input);
  
  // 如果在主文档中找不到，尝试在所有ANXView组件的Shadow DOM中查找
  if (!input) {
    const anxViews = document.querySelectorAll('anx-view');
    console.log('FileUpload: Number of anx-view elements:', anxViews.length);
    
    for (let i = 0; i < anxViews.length; i++) {
      const anxView = anxViews[i];
      try {
        if (anxView.shadowRoot) {
          input = anxView.shadowRoot.getElementById(inputId);
          if (input) {
            console.log('FileUpload: Found file input in Shadow DOM of anx-view index:', i);
            break;
          } else {
            console.log('FileUpload: anx-view index', i, 'Shadow DOM exists but input not found');
          }
        } else {
          console.log('FileUpload: anx-view index', i, 'has no Shadow DOM');
        }
      } catch (error) {
        console.warn('FileUpload: Error accessing Shadow DOM of anx-view index', i, ':', error);
      }
    }
  }
  
  if (input) {
    console.log('FileUpload: File input element:', input);
    input.click();
    console.log('FileUpload: File input clicked successfully');
  } else {
    console.error('FileUpload: File input not found:', inputId);
    // 尝试查找所有可能的文件输入元素
    const allInputs = document.querySelectorAll('input[type="file"]');
    console.log('FileUpload: All file inputs found:', allInputs.length);
    allInputs.forEach((inp, idx) => {
      console.log('FileUpload: File input', idx, '- ID:', inp.id);
    });
  }
}
