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
    </div>
    <div class="test-cases">
      <h3>Test Cases</h3>
      <button @click="loadOptionsDatasetTest">Options Dataset Test</button>
      <button @click="loadFormTest">Form Test</button>
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
      cliCommand: '',
      cliOutput: ''
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
      } catch (error) {
        console.error('Error executing CLI command:', error);
        this.cliOutput = 'Error executing CLI command. Please check your input.';
      }
    }
  }
}
</script>

<style scoped>
.converter-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.converter-content {
  display: flex;
  gap: 20px;
  height: 80vh;
}

.input-section,
.json-section,
.output-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.input-section h2,
.json-section h2,
.output-section h2 {
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
}
</style>
