<template>
  <div class="converter-container">
    <div class="converter-content">
      <div class="input-section">
        <h2>ANX Input</h2>
        <textarea 
          v-model="anxInput" 
          placeholder="Enter ANX format content here..."
          @input="convertAnxToMarkdown"
        ></textarea>
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
      rawMarkdownOutput: ''
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
        
        const response = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const result = await response.json();
        this.rawMarkdownOutput = result.markdown;
        this.markdownOutput = this.convertMarkdownToHtml(result.markdown);
      } catch (error) {
        console.error('Error converting ANX to Markdown:', error);
        this.rawMarkdownOutput = 'Error converting ANX to Markdown. Please check your input.';
        this.markdownOutput = '<p>Error converting ANX to Markdown. Please check your input.</p>';
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
.output-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.input-section h2,
.output-section h2 {
  background-color: #f5f5f5;
  padding: 10px;
  margin: 0;
  font-size: 16px;
  border-bottom: 1px solid #ddd;
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

@media (max-width: 768px) {
  .converter-content {
    flex-direction: column;
    height: auto;
  }
  
  .input-section,
  .output-section {
    height: 50vh;
  }
}
</style>
