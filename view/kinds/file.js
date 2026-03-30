// File kind implementation for view rendering

/**
 * Render file component
 * @param {Object} node - The node structure
 * @param {Function} onUpdate - Update callback function
 * @returns {string} - The rendered HTML
 */
function renderFile(node, onUpdate) {
  const { config, data } = node;
  const { kind = 'file', title, description, accept = 'image/*', multiple = false, maxSize = 5 * 1024 * 1024, preview = true, maxCount = 9 } = config;
  const value = data?.value || '';
  
  const cardKey = node.cardKey;
  const isImageType = kind === 'image' || kind === 'images';
  const isMultiple = kind === 'images' || multiple;
  
  // Generate unique ID for the file input
  const inputId = `file-${cardKey}`;
  
  let html = `
    <div class="anx-file-component">
      ${title ? `<label class="anx-file-label">${title}</label>` : ''}
      ${description ? `<div class="anx-file-description">${description}</div>` : ''}
      
      <!-- Hidden file input -->
      <input
        id="${inputId}"
        type="file"
        ${isMultiple ? 'multiple' : ''}
        accept="${accept}"
        class="anx-file-input"
        style="display: none"
        onchange="handleFileChange(event, '${cardKey}', '${kind}', ${maxSize}, ${maxCount}, ${preview})"
      />
  `;
  
  if (kind === 'image') {
    // Single image upload
    html += renderSingleImageUpload(node, inputId);
  } else if (kind === 'images') {
    // Multiple images upload
    html += renderMultipleImagesUpload(node, inputId, maxCount);
  } else {
    // General file upload
    html += renderGeneralFileUpload(node, inputId);
  }
  
  html += `
    </div>
    
    <script>
    function handleFileChange(event, cardKey, kind, maxSize, maxCount, preview) {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      // Handle file validation and upload
      if (kind === 'image' || kind === 'file') {
        handleSingleFile(files[0], cardKey, kind, maxSize, preview);
      } else if (kind === 'images') {
        handleMultipleFiles(files, cardKey, maxSize, maxCount, preview);
      }
      
      // Reset file input
      event.target.value = '';
    }
    
    function handleSingleFile(file, cardKey, kind, maxSize, preview) {
      // Validate file size
      if (file.size > maxSize) {
        alert('文件大小超过限制');
        return;
      }
      
      // Generate preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update node with preview URL temporarily
      window.anxNodeUpdate(cardKey, 'value', previewUrl);
      
      // Upload file to server
      uploadFile(file, cardKey, kind);
    }
    
    function handleMultipleFiles(files, cardKey, maxSize, maxCount, preview) {
      const currentValue = window.anxGetNodeValue(cardKey) || [];
      const newFiles = [...currentValue];
      
      for (let i = 0; i < files.length; i++) {
        if (newFiles.length >= maxCount) {
          alert("最多只能上传" + maxCount + "个文件");
          break;
        }
        
        const file = files[i];
        
        // Validate file size
        if (file.size > maxSize) {
          alert('文件大小超过限制');
          return;
        }
        
        // Generate preview URL
        const previewUrl = URL.createObjectURL(file);
        newFiles.push(previewUrl);
        
        // Update node with preview URLs temporarily
        window.anxNodeUpdate(cardKey, 'value', newFiles);
        
        // Upload file to server
        uploadFile(file, cardKey, 'images', newFiles.length - 1);
      }
    }
    
    function uploadFile(file, cardKey, kind, index) {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to backend
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const fileUrl = data.fileUrl;
          
          if (kind === 'image' || kind === 'file') {
            // Update with server URL
            window.anxNodeUpdate(cardKey, 'value', fileUrl);
          } else if (kind === 'images') {
            // Update specific index with server URL
            const currentValue = window.anxGetNodeValue(cardKey) || [];
            const newValues = [...currentValue];
            newValues[index] = fileUrl;
            window.anxNodeUpdate(cardKey, 'value', newValues);
          }
        }
      })
      .catch(error => {
        console.error('File upload error:', error);
        alert('文件上传失败');
      });
    }
    
    function removeFile(cardKey, kind, index) {
      if (kind === 'image' || kind === 'file') {
        window.anxNodeUpdate(cardKey, 'value', '');
      } else if (kind === 'images') {
        const currentValue = window.anxGetNodeValue(cardKey) || [];
        const newValues = currentValue.filter((_, i) => i !== index);
        window.anxNodeUpdate(cardKey, 'value', newValues);
      }
    }
    
    function triggerFileInput(inputId) {
      document.getElementById(inputId).click();
    }
    </script>
  `;
  
  return html;
}

/**
 * Render single image upload component
 * @param {Object} node - The node structure
 * @param {string} inputId - The file input ID
 * @returns {string} - The rendered HTML
 */
function renderSingleImageUpload(node, inputId) {
  const { data } = node;
  const value = data?.value || '';
  
  return `
    <div class="anx-image-upload">
      <div class="anx-upload-area" onclick="triggerFileInput('${inputId}')">
        ${value ? `
          <div class="anx-image-preview">
            <img src="${value}" alt="Preview" class="anx-preview-image" />
            <button class="anx-remove-btn" onclick="event.stopPropagation(); removeFile('${node.cardKey}', 'image')">✕</button>
          </div>
        ` : `
          <div class="anx-upload-placeholder">
            <div class="anx-upload-icon">📷</div>
            <div class="anx-upload-text">点击上传图片</div>
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Render multiple images upload component
 * @param {Object} node - The node structure
 * @param {string} inputId - The file input ID
 * @param {number} maxCount - Maximum number of files
 * @returns {string} - The rendered HTML
 */
function renderMultipleImagesUpload(node, inputId, maxCount) {
  const { data } = node;
  const value = data?.value || [];
  
  return `
    <div class="anx-images-upload">
      <div class="anx-upload-grid">
        ${value.map((imageUrl, index) => `
          <div class="anx-image-preview-item">
            <img src="${imageUrl}" alt="Preview" class="anx-preview-image" />
            <button class="anx-remove-btn" onclick="removeFile('${node.cardKey}', 'images', ${index})">✕</button>
          </div>
        `).join('')}
        ${value.length < maxCount ? `
          <div class="anx-upload-item" onclick="triggerFileInput('${inputId}')">
            <div class="anx-upload-placeholder">
              <div class="anx-upload-icon">📷</div>
              <div class="anx-upload-text">点击上传</div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render general file upload component
 * @param {Object} node - The node structure
 * @param {string} inputId - The file input ID
 * @returns {string} - The rendered HTML
 */
function renderGeneralFileUpload(node, inputId) {
  const { data } = node;
  const value = data?.value || '';
  
  return `
    <div class="anx-file-upload">
      <div class="anx-upload-area" onclick="triggerFileInput('${inputId}')">
        ${value ? `
          <div class="anx-file-info">
            <div class="anx-file-icon">📄</div>
            <div class="anx-file-name">${value.split('/').pop()}</div>
            <button class="anx-remove-btn" onclick="event.stopPropagation(); removeFile('${node.cardKey}', 'file')">✕</button>
          </div>
        ` : `
          <div class="anx-upload-placeholder">
            <div class="anx-upload-icon">📁</div>
            <div class="anx-upload-text">点击上传文件</div>
          </div>
        `}
      </div>
    </div>
  `;
}

module.exports = {
  renderFile
};
