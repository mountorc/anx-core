<template>
  <div class="converter-container">
    <div class="converter-content">
      <div class="input-section">
        <h2>ANX Config</h2>
        <textarea 
          v-model="anxInput" 
          placeholder="Enter ANX format content here..."
          @input="convertAnxToMarkdown"
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
          <div class="cli-output" v-if="cliOutput">
            <h4>Output:</h4>
            <pre>{{ cliOutput }}</pre>
          </div>
        </div>
      </div>
      <div class="output-section">
        <h2>Markdown Output</h2>
        <div class="markdown-output" v-html="markdownOutput"></div>
        <pre class="raw-output">{{ rawMarkdownOutput }}</pre>
      </div>
      <div class="visual-section">
        <h2>Node Visualization</h2>
        <div class="visual-output">
          <div class="node-visualization" v-if="nodesStructure">
            <div v-html="generateNodeVisualization(nodesStructure)"></div>
          </div>
          <div v-else class="no-data">
            No node data available
          </div>
        </div>
      </div>
    </div>
    <div class="test-cases">
      <h3>Test Cases</h3>
      <button @click="loadOptionsDatasetTest">Options Dataset Test</button>
      <button @click="loadFormTest">Form Test</button>
      <button @click="loadTableTest">Table Test</button>
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
  "template": "姓名: {{name}}, 年龄: {{age}}"
}`,
      markdownOutput: '',
      rawMarkdownOutput: '',
      jsonStructure: '',
      nodesStructure: null,
      cliCommand: '',
      cliOutput: '',
      showCommandsModal: false,
      cliCommands: []
    }
  },
  mounted() {
    this.convertAnxToMarkdown();
  },
  methods: {
    async convertAnxToMarkdown() {
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
        
        // Convert ANX to Markdown
        const markdownResponse = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const markdownResult = await markdownResponse.json();
        this.rawMarkdownOutput = markdownResult.markdown;
        this.markdownOutput = this.convertMarkdownToHtml(markdownResult.markdown);
      } catch (error) {
        console.error('Error converting ANX:', error);
        this.rawMarkdownOutput = 'Error converting ANX to Markdown. Please check your input.';
        this.markdownOutput = '<p>Error converting ANX to Markdown. Please check your input.</p>';
        this.jsonStructure = 'Invalid JSON. Please check your input.';
      }
    },
    convertMarkdownToHtml(markdown) {
      // Simple Markdown to HTML conversion
      return markdown
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
      this.convertAnxToMarkdown();
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
      "kind": "button",
      "label": "提交",
      "action": "/submit"
    }
  ]
}`;
      this.convertAnxToMarkdown();
    },
    loadTableTest() {
      this.anxInput = `{
  "kind": "table",
  "nick": "users_table",
  "title": "用户表",
  "data": [
    { "id": 1, "name": "张三", "email": "zhangsan@example.com", "status": "active" },
    { "id": 2, "name": "李四", "email": "lisi@example.com", "status": "inactive" },
    { "id": 3, "name": "王五", "email": "wangwu@example.com", "status": "active" }
  ],
  "titles": [
    { "title": "ID", "nick": "id", "width": 80 },
    { "title": "姓名", "nick": "name", "width": 120 },
    { "title": "邮箱", "nick": "email", "width": 200 },
    { "title": "状态", "nick": "status", "width": 100 }
  ],
  "pagination": {
    "pageSize": 10,
    "pageNum": 1
  },
  "sort": {
    "field": "id",
    "order": "asc"
  }
}`;
      this.convertAnxToMarkdown();
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
      } catch (error) {
        console.error('Error refreshing nodes structure:', error);
        this.jsonStructure = 'Error refreshing nodes structure. Please check your input.';
      }
    },
    generateNodeVisualization(node) {
      if (!node || !node.config || !node.config.kind) {
        return '';
      }
      
      switch (node.config.kind) {
        case 'box':
          return this.generateBoxVisualization(node);
        default:
          return this.generateDefaultVisualization(node);
      }
    },
    generateBoxVisualization(node) {
      let html = `
        <div class="box-visualization">
          <div class="box-header">
            <h3>${node.config.title || 'Box'} dataset</h3>
          </div>
          <div class="box-content">
      `;
      
      if (node.config.data && Array.isArray(node.config.data)) {
        node.config.data.forEach((item, index) => {
          const parsedContent = this.parseTemplate(node.config.template, item);
          html += `
            <x ${index}>
              <div class="box-data-item">
                ${parsedContent}
              </div>
            </x>
          `;
        });
      } else {
        html += `
          <div class="no-data">
            No data available
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
      
      return html;
    },
    generateDefaultVisualization(node) {
      let html = `
        <h3>${node.config.kind || 'Node'}</h3>
        <div class="node-info">
          <p><strong>Card Key:</strong> ${node.cardKey}</p>
          <p><strong>Title:</strong> ${node.config.title || 'N/A'}</p>
          <p><strong>Nick:</strong> ${node.config.nick || 'N/A'}</p>
      `;
      
      if (node.data && node.data.options) {
        html += `
          <div class="node-options">
            <h4>Options:</h4>
            <ul>
        `;
        
        node.data.options.forEach((option, index) => {
          html += `
              <li>${option.title} (${option.value})</li>
          `;
        });
        
        html += `
            </ul>
          </div>
        `;
      } else if (node.data && node.data.value) {
        html += `
          <div class="node-value">
            <h4>Value:</h4>
            <p>${JSON.stringify(node.data.value)}</p>
          </div>
        `;
      }
      
      html += `
        </div>
      `;
      
      return html;
    },
    parseTemplate(template, data) {
      if (!template) return '';
      
      let parsedTemplate = template;
      
      // 替换双大括号变量
      const doubleBracesRegex = /\{\{([^{}]+)\}\}/g;
      parsedTemplate = parsedTemplate.replace(doubleBracesRegex, (match, variable) => {
        const value = this.getPropertyValue(data, variable.trim());
        return value !== undefined ? value : match;
      });
      
      // 替换美元大括号变量
      const dollarBracesRegex = /\$\{([^{}]+)\}/g;
      parsedTemplate = parsedTemplate.replace(dollarBracesRegex, (match, variable) => {
        const value = this.getPropertyValue(data, variable.trim());
        return value !== undefined ? value : match;
      });
      
      // 替换单大括号变量
      const singleBracesRegex = /\{([^{}]+)\}/g;
      parsedTemplate = parsedTemplate.replace(singleBracesRegex, (match, variable) => {
        const value = this.getPropertyValue(data, variable.trim());
        return value !== undefined ? value : match;
      });
      
      return parsedTemplate;
    },
    getPropertyValue(obj, path) {
      if (!obj || typeof obj !== 'object') return undefined;

      const keys = path.split('.');
      let value = obj;

      for (const key of keys) {
        if (value[key] === undefined) {
          return undefined;
        }
        value = value[key];
      }

      return value;
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

.markdown-output {
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

.node-item h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.node-info p {
  margin: 8px 0;
  color: #666;
}

.node-options {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.node-options h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
}

.node-options ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.node-options li {
  margin: 5px 0;
}

.node-value {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.node-value h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-style: italic;
}

.box-visualization {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.box-header {
  background-color: #f5f5f5;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.box-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.box-content {
  padding: 15px;
}

.box-data-item {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  color: #333;
  font-size: 14px;
  margin-bottom: 10px;
}

.box-data-item:last-child {
  margin-bottom: 0;
}

.test-cases {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.test-cases button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-cases button:hover {
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
}

.modal-footer button:hover {
  background-color: #45a049;
}
</style>
