<template>
  <div class="converter-container">
    <div class="converter-content">
      <div class="input-section">
        <h2>ANX Config</h2>
        <textarea 
          v-model="anxInput" 
          placeholder="Enter ANX format content here..."
          @input="debouncedConvertAnxToMarkup"
        ></textarea>
      </div>
      <div class="json-section">
        <h2>Core Nodes</h2>
        <pre class="json-output">{{ jsonStructure }}</pre>
        <div class="cli-section">
          <h3>CLI Command</h3>
          <div class="cli-input-container">
            <input 
              v-model="cliCommand" 
              placeholder="Enter CLI command here..."
              @keyup.enter="executeCliCommand"
            />
            <button @click="executeCliCommand">Execute</button>
            <button @click="showCommandsList">Commands</button>
            <button @click="showCliLogs">Logs</button>
          </div>
          <!-- Commands list modal -->
          <div class="modal" v-if="showCommandsModal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>CLI Commands List</h3>
                <button @click="showCommandsModal = false" class="close-btn">×</button>
              </div>
              <div class="modal-body">
                <div v-for="category in cliCommands" :key="category.category" class="command-category">
                  <h4>{{ category.category }}</h4>
                  <ul class="command-list">
                    <li v-for="command in category.commands" :key="command.name" class="command-item">
                      <div class="command-name">{{ command.name }}</div>
                      <div class="command-description">{{ command.description }}</div>
                      <div class="command-usage">{{ command.usage }}</div>
                      <div class="command-example">{{ command.example }}</div>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="modal-footer">
                <button @click="showCommandsModal = false">Close</button>
              </div>
            </div>
          </div>
          
          <!-- Unified Logs modal -->
          <div class="modal" v-if="showLogsModal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>System Logs</h3>
                <button @click="showLogsModal = false" class="close-btn">×</button>
              </div>
              <div class="modal-body">
                <div v-if="allLogs.length === 0" class="no-logs">
                  No logs available.
                </div>
                <div v-else class="logs-list">
                  <div v-for="(log, index) in allLogs" :key="index" class="log-item" :class="[log.status, log.type]">
                    <div class="log-header">
                      <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
                      <span class="log-type">{{ log.type.toUpperCase() }}</span>
                      <span class="log-status">{{ (log.status || 'success').toUpperCase() }}</span>
                    </div>
                    <div v-if="log.command" class="log-command">{{ log.command }}</div>
                    <div v-else-if="log.message" class="log-message">{{ log.message }}</div>
                    <div v-if="log.response" class="log-response">
                      <pre>{{ JSON.stringify(log.response, null, 2) }}</pre>
                    </div>
                    <div v-if="log.details" class="log-details">
                      <strong>Details:</strong>
                      <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
                    </div>
                    <div v-if="log.error" class="log-error">
                      <strong>Error:</strong> {{ log.error }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button @click="refreshLogs">Refresh</button>
                <button @click="showLogsModal = false">Close</button>
              </div>
            </div>
          </div>
          <div class="cli-output" v-if="cliOutput">
            <h4>Output:</h4>
            <pre>{{ cliOutput }}</pre>
          </div>
        </div>
      </div>
      <div class="output-section">
        <h2>Markup Output</h2>
        <div class="markup-output" v-html="markupOutput"></div>
        <pre class="raw-output">{{ rawMarkupOutput }}</pre>
      </div>
      <div class="visual-section">
        <h2>Node Visualization</h2>
        <div class="visual-output">
          <div class="node-visualization" v-if="nodesStructure" ref="visualizationContainer">
            <div v-html="visualizationHTML"></div>
          </div>
          <div v-else class="no-data">
            No node data available
          </div>
        </div>
      </div>
    </div>
    <div class="tile-cases">
      <h3>Tile Cases</h3>
      <!-- 动态加载的tile case -->
      <button v-for="item in hubList" :key="item.uuid" @click="loadHubTestCase(item.uuid)">{{ item.name }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      anxInput: `{
  "kind": "box",
  "title": "测试Box组件",
  "data": [
    { "name": "张三", "age": 25 },
    { "name": "李四", "age": 30 }
  ],
  "template": "姓名: {{name}}, 年龄: {{age}}",
  "tapSet": {
    "title":"detail",
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "age": "age"
      }
    }
  }
}`,
      hubList: [], // 存储从hub获取的tile case列表
      boxDatasetTest: `{
  "kind": "box",
  "title": "测试Box组件 dataset",
  "dataset": {
    "data": [
      { "name": "张三", "age": 25 },
      { "name": "李四", "age": 30 }
    ]
  },
  "template": "姓名: {{name}}, 年龄: {{age}}",
  "tapSet": {
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "age": "age"
      }
    }
  }
}`,
      boxDatasetUrlTest: `{
  "kind": "box",
  "title": "测试Box组件 dataset url",
  "dataset": {
    "url_dataset": "http://localhost:4665/dataset"
  },
  "template": "商品名称: {{name}}, 价格: {{price}}",
  "tapSet": {
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "price": "price"
      }
    }
  }
}`,
      boxTapTest: `{
  "kind": "box",
  "title": "测试Box组件 tapSet",
  "data": [
    { "name": "商品A", "price": 98 },
    { "name": "商品B", "price": 58 },
    { "name": "商品C", "price": 38 },
    { "name": "商品D", "price": 65 },
    { "name": "商品E", "price": 107 }
  ],
  "template": "商品名称: {{name}}, 价格: {{price}}",
  "tapSet": {
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "price": "price"
      }
    }
  }
}`,


      markupOutput: '',
      rawMarkupOutput: '',
      jsonStructure: '',
      nodesStructure: null,
      cliCommand: '',
      cliOutput: '',
      showCommandsModal: false,
      showLogsModal: false,
      cliCommands: [],
      cliLogs: [],
      allLogs: [],
      visualizationHTML: '',
      visualizationCSS: '',
      hubList: [], // 存储从hub获取的tile case列表
      debounceTimer: null
    }
  },
  mounted() {
    this.convertAnxToMarkup();
    this.loadHubList();
    this.initFileUploads();
    
    // 从URL参数中获取uuid_tile并自动加载对应的tile
    this.checkUrlForUuidTile();
    
    // 监听 message 事件（来自可视化 iframe）
    window.addEventListener('message', this.handleVisualizationMessage);
  },
  beforeUnmount() {
    // 移除事件监听
    window.removeEventListener('message', this.handleVisualizationMessage);
  },
  methods: {
    // 检查URL参数中是否包含uuid_tile
    checkUrlForUuidTile() {
      const urlParams = new URLSearchParams(window.location.search);
      const uuidTile = urlParams.get('uuid_tile');
      if (uuidTile) {
        console.log(`[URL] Found uuid_tile parameter: ${uuidTile}`);
        this.loadHubTestCase(uuidTile);
      }
    },
    // 防抖函数，避免频繁的API调用
    debouncedConvertAnxToMarkup() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.convertAnxToMarkup();
      }, 300); // 300毫秒的防抖延迟
    },
    // 加载hub中的tile case列表
    async loadHubList() {
      try {
        const response = await fetch('/api/hub');
        const data = await response.json();
        if (data.success) {
          this.hubList = data.data;
        }
      } catch (error) {
        console.error('Error loading hub list:', error);
      }
    },
    // 加载指定的tile case
    async loadHubTestCase(uuid) {
      try {
        const response = await fetch(`/api/hub/${uuid}`);
        const data = await response.json();
        if (data.success) {
          this.anxInput = JSON.stringify(data.data.anxContent, null, 2);
          this.convertAnxToMarkup();
        }
      } catch (error) {
        console.error('Error loading hub tile case:', error);
      }
    },
    async convertAnxToMarkup() {
      try {
        // Parse the ANX input string to a JavaScript object
        const anxContent = JSON.parse(this.anxInput);
        
        // Get nodes structure from backend
        const nodesResponse = await fetch('/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const nodesResult = await nodesResponse.json();
        this.jsonStructure = JSON.stringify(nodesResult.nodes, null, 2);
        this.nodesStructure = nodesResult.nodes;
        
        // Convert ANX to Markup
        const markupResponse = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const markupResult = await markupResponse.json();
        this.rawMarkupOutput = markupResult.markup;
        this.markupOutput = this.convertMarkupToHtml(markupResult.markup);
        
        // Generate node visualization (can be done in parallel or after Markup conversion)
        this.generateNodeVisualization(this.nodesStructure);
      } catch (error) {
        console.error('Error converting ANX:', error);
        this.rawMarkupOutput = 'Error converting ANX to Markup. Please check your input.';
        this.markupOutput = '<p>Error converting ANX to Markup. Please check your input.</p>';
        this.jsonStructure = 'Invalid JSON. Please check your input.';
      }
    },
    async generateNodeVisualization(node) {
      try {
        const response = await fetch('/api/visualize-node', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ node })
        });
        
        const result = await response.json();
        this.visualizationHTML = result.html;
        this.visualizationCSS = result.css;
        
        // 动态注入 CSS 和 JavaScript
        this.$nextTick(() => {
          this.injectVisualizationCSS(result.css);
          this.injectVisualizationJS();
        });
      } catch (error) {
        console.error('Error generating node visualization:', error);
        this.visualizationHTML = '<div class="anx-error">Error generating node visualization</div>';
      }
    },
    injectVisualizationJS() {
      // 移除旧的脚本标签
      const oldScript = document.getElementById('visualization-dynamic-script');
      if (oldScript) {
        oldScript.remove();
      }
      
      // 创建新的脚本标签
      const script = document.createElement('script');
      script.id = 'visualization-dynamic-script';
      script.textContent = `
        // 更新节点数据
        window.updateNodeData = function(element) {
          const cardKey = element.getAttribute('data-card-key');
          const field = element.getAttribute('data-field');
          const value = element.value;
          
          // 发送消息到父窗口
          window.parent.postMessage({
            type: 'UPDATE_NODE_DATA',
            cardKey: cardKey,
            field: field,
            value: value
          }, '*');
        };
        
        // 更新复选框数据
        window.updateCheckboxData = function(element) {
          const cardKey = element.getAttribute('data-card-key');
          const field = element.getAttribute('data-field');
          
          // 获取当前所有选中的值
          const checkboxes = document.querySelectorAll('[data-card-key="' + cardKey + '"][data-field="' + field + '"]');
          const values = [];
          checkboxes.forEach(function(cb) {
            if (cb.checked) {
              values.push(cb.getAttribute('data-option-value'));
            }
          });
          
          // 发送消息到父窗口
          window.parent.postMessage({
            type: 'UPDATE_NODE_DATA',
            cardKey: cardKey,
            field: field,
            value: values
          }, '*');
        };
        
        // 处理tap事件
        window.handleTapSet = function(tapSet, node, button) {
          console.log('Handling tap set:', tapSet);
          console.log('Node:', node);
          
          // 模拟处理过程
          setTimeout(() => {
            console.log('Tap set processed');
            // 可以在这里添加实际的处理逻辑
            // 例如导航、API调用等
          }, 1500);
        };
      `;
      document.head.appendChild(script);
    },
    injectVisualizationCSS(css) {
      if (!css) return;
      
      // 移除旧的样式标签
      const oldStyle = document.getElementById('visualization-dynamic-style');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      // 创建新的样式标签
      const style = document.createElement('style');
      style.id = 'visualization-dynamic-style';
      style.textContent = css;
      document.head.appendChild(style);
    },
    async handleVisualizationMessage(event) {
      // 检查消息类型
      if (event.data && event.data.type === 'UPDATE_NODE_DATA') {
        const { cardKey, field, value, log } = event.data;
        console.log('Node data changed from visualization:', { cardKey, field, value });
        
        // 记录view日志
        if (log) {
          this.addViewLog({
            timestamp: log.timestamp,
            action: log.action,
            details: log.details,
            message: `View field updated: ${field} = ${value}`
          });
        } else {
          // 如果没有log对象，创建一个
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'field_update',
            details: { cardKey, field, value },
            message: `View field updated: ${field} = ${value}`
          });
        }
        
        try {
          // 调用后端 API 更新节点数据
          const response = await fetch('/api/update-node-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cardKey, field, value })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update node data');
          }
          
          const result = await response.json();
          console.log('Node data updated:', result);
          
          // 更新 Core Nodes 显示
          if (result.nodes) {
            this.jsonStructure = JSON.stringify(result.nodes, null, 2);
            this.nodesStructure = result.nodes;
            // 重新生成节点可视化
            await this.generateNodeVisualization(this.nodesStructure);
            // 重新解析ANX输入，确保使用最新的数据
            this.convertAnxToMarkup();
          }
        } catch (error) {
          console.error('Error updating node data:', error);
          // 记录错误日志
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'field_update_error',
            details: { cardKey, field, value, error: error.message },
            message: `Error updating view field: ${field}`,
            status: 'error'
          });
        }
      }
    },
    async updateMarkupOutput() {
      try {
        // 解析ANX输入
        const anxContent = JSON.parse(this.anxInput);
        
        // 转换ANX到Markup
        const markupResponse = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const markupResult = await markupResponse.json();
        this.rawMarkupOutput = markupResult.markup;
        this.markupOutput = this.convertMarkupToHtml(markupResult.markup);
      } catch (error) {
        console.error('Error updating markup output:', error);
      }
    },
    convertMarkupToHtml(markup) {
      // Simple Markup to HTML conversion
      return markup
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\`\`\`[\s\S]*?\`\`\`/gim, (match) => {
          return `<pre><code>${match.replace(/\`\`\`/g, '')}</code></pre>`;
        })
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/^(.+)$/gim, '<p>$1</p>')
        .replace(/<p><\/p>/gim, '');
    },
    // Initialize file upload functionality
    initFileUploads() {
      // Add file upload functions to global scope
      window.handleFileChange = (event, cardKey, kind, maxSize, maxCount, preview) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // Handle file validation and upload
        if (kind === 'image' || kind === 'file') {
          this.handleSingleFile(files[0], cardKey, kind, maxSize, preview);
        } else if (kind === 'images') {
          this.handleMultipleFiles(files, cardKey, maxSize, maxCount, preview);
        }
        
        // Reset file input
        event.target.value = '';
      };
      
      window.triggerFileInput = (inputId) => {
        document.getElementById(inputId).click();
      };
      
      window.removeFile = (cardKey, kind, index) => {
        if (kind === 'image' || kind === 'file') {
          this.updateNodeDataForFile(cardKey, '');
        } else if (kind === 'images') {
          const currentValue = this.getNodeValue(cardKey) || [];
          const newValues = currentValue.filter((_, i) => i !== index);
          this.updateNodeDataForFile(cardKey, newValues);
        }
      };
    },
    handleSingleFile(file, cardKey, kind, maxSize, preview) {
      // Validate file size
      if (file.size > maxSize) {
        alert('文件大小超过限制');
        return;
      }
      
      // Generate preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update node with preview URL temporarily
      this.updateNodeDataForFile(cardKey, previewUrl);
      
      // Upload file to server
      this.uploadFile(file, cardKey, kind);
    },
    handleMultipleFiles(files, cardKey, maxSize, maxCount, preview) {
      const currentValue = this.getNodeValue(cardKey) || [];
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
        this.updateNodeDataForFile(cardKey, newFiles);
        
        // Upload file to server
        this.uploadFile(file, cardKey, 'images', newFiles.length - 1);
      }
    },
    uploadFile(file, cardKey, kind, index) {
      // 导入前端的OSS上传工具
      import('/src/utils/oss.js')
        .then(({ uploadImageToOSS }) => {
          // 直接上传到OSS
          uploadImageToOSS(file)
            .then(fileUrl => {
              if (kind === 'image' || kind === 'file') {
                // Update with server URL
                this.updateNodeDataForFile(cardKey, fileUrl);
              } else if (kind === 'images') {
                // Update specific index with server URL
                const currentValue = this.getNodeValue(cardKey) || [];
                const newValues = [...currentValue];
                newValues[index] = fileUrl;
                this.updateNodeDataForFile(cardKey, newValues);
              }
            })
            .catch(error => {
              console.error('File upload error:', error);
              alert('文件上传失败: ' + error.message);
            });
        })
        .catch(error => {
          console.error('Error loading OSS module:', error);
          alert('加载上传模块失败');
        });
    },
    updateNodeDataForFile(cardKey, value) {
      // Send message to parent window
      window.parent.postMessage({
        type: 'UPDATE_NODE_DATA',
        cardKey: cardKey,
        field: 'value',
        value: value
      }, '*');
    },
    getNodeValue(cardKey) {
      // This is a placeholder - in a real implementation, you would get the current value from the node
      return [];
    },
    loadOptionsDatasetTest() {
      this.anxInput = `{ 
  "kind": "options", 
  "nick": "product", 
  "value": "", 
  "optionsSet": { 
    "dataset": { 
      "url_dataset": "http://localhost:4665/dataset" 
    }, 
    "titleNick": "name", 
    "valueNick": "name" 
  } 
}`;
      this.convertAnxToMarkup();
    },
    loadFormTest() {
      this.anxInput = `{
  "kind": "form",
  "title": "用户注册表单",
  "kinds": [
    {
      "kind": "input",
      "nick": "username",
      "placeholder": "请输入用户名",
      "value": ""
    },
    {
      "kind": "input",
      "nick": "email",
      "placeholder": "请输入邮箱",
      "value": ""
    },
    {
      "kind": "date",
      "nick": "birthday",
      "placeholder": "请选择出生日期",
      "value": ""
    },
    {
      "kind": "input",
      "type": "number",
      "nick": "age",
      "placeholder": "请输入年龄",
      "value": ""
    },
    {
      "kind": "text",
      "type": "number",
      "nick": "yearsSinceAdult",
      "title": "成年年数",
      "formula": "age - 18"
    },
    {
      "kind": "options",
      "nick": "gender",
      "title": "性别",
      "options": [
        { "value": "male", "title": "男" },
        { "value": "female", "title": "女" },
        { "value": "other", "title": "其他" }
      ],
      "value": ""
    },
    {
      "kind": "checkbox",
      "nick": "hobbies",
      "title": "爱好",
      "options": [
        { "value": "reading", "title": "阅读" },
        { "value": "sports", "title": "运动" },
        { "value": "music", "title": "音乐" },
        { "value": "travel", "title": "旅行" }
      ],
      "value": []
    },
    {
      "kind": "textarea",
      "nick": "description",
      "placeholder": "请输入个人简介",
      "value": "",
      "rows": 4
    },
    {
      "kind": "list",
      "nick": "skills",
      "title": "技能列表",
      "itemList": [
        {
          "nick": "skillName",
          "title": "技能名称",
          "kind": "input",
          "type": "string",
          "lineEdit": "2",
          "defaultValue": ""
        },
        {
          "nick": "level",
          "title": "熟练度",
          "kind": "options",
          "type": "string",
          "lineEdit": "2",
          "optionsItem": [
            { "value": "beginner", "title": "初级" },
            { "value": "intermediate", "title": "中级" },
            { "value": "advanced", "title": "高级" },
            { "value": "expert", "title": "专家" }
          ]
        },
        {
          "nick": "years",
          "title": "使用年限",
          "kind": "input",
          "type": "number",
          "lineEdit": "2",
          "defaultValue": 0
        }
      ],
      "data": [
        {
          "skillName": "JavaScript",
          "level": "advanced",
          "years": 5
        },
        {
          "skillName": "Vue.js",
          "level": "intermediate",
          "years": 3
        }
      ],
      "addButton": {
        "iitemPre": -1
      },
      "moveButton": true
    },
    {
      "kind": "button",
      "label": "提交",
      "action": "/submit"
    }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadTableTest() {
      this.anxInput = `{
  "kind": "table",
  "title": "用户数据表",
  "titles": [
    { "nick": "id", "title": "ID", "width": 60 },
    { "nick": "name", "title": "姓名", "width": 120 },
    { "nick": "age", "title": "年龄", "width": 80 },
    { "nick": "email", "title": "邮箱", "width": 200 }
  ],
  "data": [
    { "id": 1, "name": "张三", "age": 25, "email": "zhangsan@example.com" },
    { "id": 2, "name": "李四", "age": 30, "email": "lisi@example.com" },
    { "id": 3, "name": "王五", "age": 28, "email": "wangwu@example.com" }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadJobCreationFormTest() {
      this.anxInput = `{
  "kind": "form",
  "title": "创建求职账户",
  "description": "加入我们，发现更多职业机会",
  "kinds": [
    {
      "kind": "text",
      "value": "加入我们，发现更多职业机会"
    },
    {
      "kind": "input",
      "nick": "lastName",
      "title": "姓",
      "placeholder": "请输入姓"
    },
    {
      "kind": "input",
      "nick": "firstName",
      "title": "名",
      "placeholder": "请输入名"
    },
    {
      "kind": "input",
      "nick": "email",
      "title": "电子邮箱",
      "placeholder": "请输入电子邮箱",
      "type": "email"
    },
    {
      "kind": "input",
      "nick": "phone",
      "title": "手机号码",
      "placeholder": "请输入手机号码",
      "type": "tel"
    },
    {
      "kind": "date",
      "nick": "birthdate",
      "title": "出生日期",
      "placeholder": "年 / 月 / 日"
    },
    {
      "kind": "input",
      "nick": "city",
      "title": "所在城市",
      "placeholder": "请输入所在城市"
    },
    {
      "kind": "options",
      "nick": "education",
      "title": "最高学历",
      "options": [
        { "value": "", "title": "请选择学历" },
        { "value": "highSchool", "title": "高中及以下" },
        { "value": "college", "title": "大专" },
        { "value": "bachelor", "title": "本科" },
        { "value": "master", "title": "硕士" },
        { "value": "phd", "title": "博士" }
      ]
    },
    {
      "kind": "options",
      "nick": "experience",
      "title": "工作年限",
      "options": [
        { "value": "", "title": "请选择" },
        { "value": "fresh", "title": "应届毕业生" },
        { "value": "1-3", "title": "1-3年" },
        { "value": "3-5", "title": "3-5年" },
        { "value": "5-10", "title": "5-10年" },
        { "value": "10+", "title": "10年以上" }
      ]
    },
    {
      "kind": "options",
      "nick": "industry",
      "title": "行业选择",
      "options": [
        { "value": "", "title": "请选择行业" },
        { "value": "it", "title": "信息技术" },
        { "value": "finance", "title": "金融" },
        { "value": "education", "title": "教育" },
        { "value": "healthcare", "title": "医疗健康" },
        { "value": "retail", "title": "零售" },
        { "value": "manufacturing", "title": "制造业" },
        { "value": "other", "title": "其他" }
      ]
    },
    {
      "kind": "options",
      "nick": "occupation",
      "title": "职业选择",
      "options": [
        { "value": "", "title": "请选择职业" },
        { "value": "developer", "title": "开发工程师" },
        { "value": "designer", "title": "设计师" },
        { "value": "product", "title": "产品经理" },
        { "value": "marketing", "title": "市场营销" },
        { "value": "hr", "title": "人力资源" },
        { "value": "other", "title": "其他" }
      ]
    },
    {
      "kind": "checkbox",
      "nick": "jobType",
      "title": "期望职位类型",
      "options": [
        { "value": "fulltime", "title": "全职" },
        { "value": "parttime", "title": "兼职" },
        { "value": "internship", "title": "实习" },
        { "value": "remote", "title": "远程" }
      ]
    },
    {
      "kind": "button",
      "label": "创建账户",
      "action": "/create-account",
      "style": "primary",
      "size": "large"
    }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadBoardTableTest() {
      this.anxInput = `{
  "kind": "board",
  "kinds": [
    {
      "kind": "text",
      "value": "## 数据管理系统"
    },
    {
      "kind": "table",
      "title": "商品表",
      "titles": [
        { "nick": "name", "title": "商品名称", "width": 120 },
        { "nick": "price", "title": "价格", "width": 100 }
      ],
      "dataset": {
        "url_dataset": "http://localhost:4665/dataset"
      }
    },
    {
      "kind": "table",
      "title": "产品数据表",
      "titles": [
        { "nick": "id", "title": "产品ID", "width": 80 },
        { "nick": "name", "title": "产品名称", "width": 150 },
        { "nick": "price", "title": "价格", "width": 100 },
        { "nick": "stock", "title": "库存", "width": 80 }
      ],
      "data": [
        { "id": 101, "name": "笔记本电脑", "price": 5999, "stock": 50 },
        { "id": 102, "name": "智能手机", "price": 3999, "stock": 100 },
        { "id": 103, "name": "平板电脑", "price": 2999, "stock": 30 }
      ]
    }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadBoxTapTest() {
      this.anxInput = this.boxTapTest;
      this.convertAnxToMarkup();
    },
    loadBoxDatasetTest() {
      this.anxInput = this.boxDatasetTest;
      this.convertAnxToMarkup();
    },
    loadBoxDatasetUrlTest() {
      this.anxInput = this.boxDatasetUrlTest;
      this.convertAnxToMarkup();
    },

    async executeCliCommand() {
      if (!this.cliCommand) {
        this.cliOutput = 'Please enter a CLI command.';
        return;
      }

      try {
        // 发送CLI命令到后端
        const response = await fetch('/api/execute-cli', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: this.cliCommand })
        });

        const result = await response.json();
        // 格式化输出，显示cardKey、action和result
        this.cliOutput = `cardKey: ${result.cardKey}\naction: ${result.action}\nresult: ${JSON.stringify(result.result, null, 2)}`;
        
        // 重新获取节点结构以更新显示
        await this.refreshNodesStructure();
      } catch (error) {
        console.error('Error executing CLI command:', error);
        this.cliOutput = 'Error executing CLI command. Please check your input.';
      }
    },
    async refreshNodesStructure() {
      try {
        // 解析ANX输入
        const anxContent = JSON.parse(this.anxInput);
        
        // 获取更新后的节点结构
        const nodesResponse = await fetch('/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const nodesResult = await nodesResponse.json();
        this.jsonStructure = JSON.stringify(nodesResult.nodes, null, 2);
        this.nodesStructure = nodesResult.nodes;
        
        // 重新生成节点可视化
        await this.generateNodeVisualization(this.nodesStructure);
        // 更新 Markdown Output
        await this.updateMarkdownOutput();
      } catch (error) {
        console.error('Error refreshing nodes structure:', error);
        this.jsonStructure = 'Error refreshing nodes structure. Please check your input.';
      }
    },
    async showCommandsList() {
      try {
        // 获取CLI命令集
        const response = await fetch('/api/cli/commands');
        const data = await response.json();
        this.cliCommands = data.commands;
        this.showCommandsModal = true;
      } catch (error) {
        console.error('Error fetching CLI commands:', error);
        alert('Failed to load CLI commands. Please try again.');
      }
    },
    async showCliLogs() {
      try {
        await this.refreshLogs();
        this.showLogsModal = true;
      } catch (error) {
        console.error('Error showing logs:', error);
        alert('Failed to load logs. Please try again.');
      }
    },
    async refreshLogs() {
      try {
        // 获取CLI日志
        const cliResponse = await fetch('/api/cli/logs');
        const cliData = await cliResponse.json();
        const cliLogs = cliData.logs || [];
        
        // 为CLI日志添加类型标识
        const formattedCLILogs = cliLogs.map(log => ({
          ...log,
          type: 'cli'
        }));
        
        // 获取本地存储的view日志
        const viewLogs = JSON.parse(localStorage.getItem('viewLogs') || '[]');
        
        // 合并并按时间戳排序
        this.allLogs = [...formattedCLILogs, ...viewLogs].sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
      } catch (error) {
        console.error('Error refreshing logs:', error);
        alert('Failed to refresh logs. Please try again.');
      }
    },
    addViewLog(log) {
      // 获取本地存储的view日志
      const viewLogs = JSON.parse(localStorage.getItem('viewLogs') || '[]');
      
      // 添加新日志
      viewLogs.unshift({
        ...log,
        type: 'view',
        status: 'success'
      });
      
      // 限制日志数量，只保留最近100条
      const limitedLogs = viewLogs.slice(0, 100);
      
      // 保存回本地存储
      localStorage.setItem('viewLogs', JSON.stringify(limitedLogs));
      
      // 刷新日志显示
      if (this.showLogsModal) {
        this.refreshLogs();
      }
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    }
  }
}
</script>

<style scoped>
.converter-container {
  width: 100%;
  max-width: 95%;
  margin: 0 auto;
}

.converter-content {
  display: flex;
  gap: 20px;
  height: 80vh;
}

.input-section,
.json-section,
.output-section,
.visual-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.input-section h2,
.json-section h2,
.output-section h2,
.visual-section h2 {
  background-color: #f5f5f5;
  padding: 10px;
  margin: 0;
  font-size: 16px;
  border-bottom: 1px solid #ddd;
}

.json-section {
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.json-output {
  flex: 1;
  padding: 15px;
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  overflow-y: auto;
  white-space: pre-wrap;
  background-color: #f9f9f9;
}

.json-section .cli-section {
  margin-top: 0;
  border: none;
  border-top: 1px solid #ddd;
  border-radius: 0;
  padding: 15px;
  background-color: #f9f9f9;
}

.input-section textarea {
  flex: 1;
  padding: 15px;
  border: none;
  resize: none;
  font-family: monospace;
  font-size: 14px;
}

.output-section {
  display: flex;
  flex-direction: column;
}

.markup-output {
  flex: 1;
  padding: 15px;
  border-bottom: 1px solid #ddd;
  overflow-y: auto;
}

.raw-output {
  flex: 1;
  padding: 15px;
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  background-color: #f9f9f9;
  overflow-y: auto;
  white-space: pre-wrap;
}

.visual-section {
  background-color: #f9f9f9;
}

.visual-output {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.node-visualization {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-style: italic;
}

.test-cases {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.tile-cases button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.tile-cases button:hover {
  background-color: #45a049;
}

.cli-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}

.cli-input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.cli-input-container input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.cli-input-container button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cli-input-container button:hover {
  background-color: #45a049;
}

.cli-output {
  margin-top: 15px;
  border-top: 1px solid #ddd;
  padding-top: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.cli-output h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
  position: sticky;
  top: 0;
  background-color: #f9f9f9;
  padding-bottom: 5px;
}

.cli-output pre {
  margin: 0;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 150px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .converter-content {
    flex-direction: column;
    height: auto;
  }
  
  .input-section,
  .json-section,
  .output-section {
    height: auto;
    min-height: 50vh;
    margin-bottom: 20px;
  }
  
  .cli-input-container {
    flex-direction: column;
  }
  
  .cli-input-container button {
    width: 100%;
  }
  
  .modal-content {
    width: 90%;
    max-height: 90vh;
  }
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.command-category {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.command-category h4 {
  background-color: #f9f9f9;
  padding: 10px 15px;
  margin: 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #ddd;
}

.command-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.command-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.command-item:last-child {
  border-bottom: none;
}

.command-name {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.command-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.command-usage {
  font-size: 13px;
  color: #888;
  background-color: #f9f9f9;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 5px;
  font-family: monospace;
}

.command-example {
  font-size: 13px;
  color: #888;
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: monospace;
}

/* CLI Logs styles */
.no-logs {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.log-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background-color: #f9f9f9;
}

.log-item.success {
  border-left: 4px solid #4CAF50;
}

.log-item.error {
  border-left: 4px solid #f44336;
  background-color: #fff8f8;
}

.log-item.cli {
  background-color: #f9f9f9;
}

.log-item.view {
  background-color: #f0f8ff;
}

.log-type {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  margin-right: 8px;
  background-color: #e0e0e0;
  color: #333;
}

.log-item.cli .log-type {
  background-color: #ffc107;
  color: #333;
}

.log-item.view .log-type {
  background-color: #2196F3;
  color: white;
}

.log-message {
  font-size: 14px;
  margin: 10px 0;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.log-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 13px;
}

.log-details pre {
  margin: 5px 0 0 0;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.log-header .log-timestamp {
  flex: 1;
}

.log-header .log-type {
  margin-right: 8px;
}

.log-header .log-status {
  margin-left: auto;
}

.log-timestamp {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.log-status {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.log-item.success .log-status {
  background-color: #e8f5e8;
  color: #4CAF50;
}

.log-item.error .log-status {
  background-color: #ffebee;
  color: #f44336;
}

.log-command {
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  word-break: break-all;
}

.log-response {
  margin-bottom: 10px;
}

.log-response pre {
  margin: 0;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-error {
  color: #f44336;
  font-size: 13px;
  padding: 8px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-top: 5px;
}

.modal-footer {
  padding: 15px;
  border-top: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 0 0 8px 8px;
  text-align: right;
}

.modal-footer button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.modal-footer button:hover {
  background-color: #45a049;
}

.modal-footer button:first-child {
  margin-left: 0;
  background-color: #2196F3;
}

.modal-footer button:first-child:hover {
  background-color: #0b7dda;
}
</style>
