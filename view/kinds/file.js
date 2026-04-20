// File kind implementation for view rendering

/**
 * Render file component
 * @param {Object} node - The node structure
 * @param {Function} onUpdate - Update callback function
 * @returns {string} - The rendered HTML
 */
function renderFile(node, onUpdate) {
  const { config, data } = node;
  const { kind = 'file', title, description, accept = 'image/*', multiple = false, maxSize = 5 * 1024 * 1024, preview = true, maxCount = 9, editState} = config;
  const value = data?.value || '';
  
  const cardKey = node.cardKey;
  const isImageType = kind === 'image' || kind === 'images';
  const isMultiple = kind === 'images' || multiple;
  
  // 如果是不可编辑状态（editState=1）且 kind 为 image，直接显示图片
  if (editState === 1 && kind === 'image' && value) {
    return `
      <div class="anx-file-component">
        ${title ? `<label class="anx-file-label">${title}</label>` : ''}
        <img src="${value}" alt="Image" class="anx-static-image"/>
      </div>
    `;
  }
  
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
      ${value ? `
        <div class="anx-image-preview-container">
          <div class="anx-image-preview">
            <img src="${value}" alt="Preview" class="anx-preview-image" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%22 y=%2255%22 text-anchor=%22middle%22%3E%E2%97%8F%3C/text%3E%3C/svg%3E'" />
            <button class="anx-remove-btn" onclick="removeFile('${node.cardKey}', 'image')">×</button>
          </div>
          <button class="anx-change-btn" onclick="triggerFileInput('${inputId}')">更换</button>
        </div>
      ` : `
        <div class="anx-upload-area" onclick="triggerFileInput('${inputId}')">
          <div class="anx-upload-placeholder">
            <div class="anx-upload-icon">📷</div>
            <div class="anx-upload-text">点击上传图片</div>
          </div>
        </div>
      `}
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
            <img src="${imageUrl}" alt="Preview" class="anx-preview-image" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%22 y=%2255%22 text-anchor=%22middle%22%3E%E2%97%8F%3C/text%3E%3C/svg%3E'" />
            <button class="anx-remove-btn" onclick="removeFile('${node.cardKey}', 'images', ${index})">✕</button>
          </div>
        `).join('')}
        ${value.length < maxCount ? `
          <div class="anx-add-btn" onclick="triggerFileInput('${inputId}')">+</div>
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
