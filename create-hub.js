const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 测试案例配置
const testCases = [
  {
    name: 'Box Tapset Test',
    file: 'examples/backend/test-box-tapset.json'
  },
  {
    name: 'Form Formula Test',
    file: 'examples/backend/test-form-formula.json'
  },
  {
    name: 'List Test',
    file: 'examples/backend/test-list.json'
  },
  {
    name: 'Job Creation Form Test',
    file: 'examples/job-creation-form.anx'
  },
  {
    name: 'Options Dataset Test',
    content: `{
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
}`
  },
  {
    name: 'Table Test',
    content: `{
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
}`
  },
  {
    name: 'Board with Table Test',
    content: `{
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
}`
  }
];

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// 生成hub文件
function generateHubFiles() {
  const index = [];
  
  testCases.forEach(testCase => {
    let content;
    
    // 优先使用content字段
    if (testCase.content) {
      content = testCase.content;
    } else if (testCase.file) {
      content = readFile(testCase.file);
    }
    
    if (content) {
      const uuid = uuidv4();
      let anxContent = JSON.parse(content);
      
      // 如果内容已经包含anxContent字段，则使用它
      if (anxContent.anxContent) {
        anxContent = anxContent.anxContent;
      }
      
      const hubFile = {
        uuid,
        name: testCase.name,
        anxContent
      };
      
      const hubFilePath = path.join('hub', `${uuid}.json`);
      fs.writeFileSync(hubFilePath, JSON.stringify(hubFile, null, 2));
      console.log(`Created hub file: ${hubFilePath}`);
      
      // 添加到索引
      index.push({
        uuid,
        name: testCase.name
      });
    }
  });
  
  // 创建索引文件
  fs.writeFileSync('hub/index.json', JSON.stringify(index, null, 2));
  console.log('Created hub index file: hub/index.json');
}

generateHubFiles();
