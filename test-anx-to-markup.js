/**
 * 测试ANX转Markup功能
 */

import { anxToMarkup } from './core/index.js';

// 测试用例1: 文本组件
const textComponent = {
  "kind": "text",
  "title": "测试文本",
  "value": "这是一段测试文本"
};

// 测试用例2: 带有模板的Box组件
const boxComponent = {
  "kind": "box",
  "title": "测试Box",
  "data": [
    { "name": "张三", "age": 25 },
    { "name": "李四", "age": 30 }
  ],
  "template": "**姓名:** {{name}}\n**年龄:** {{age}}"
};

// 测试用例3: 表单组件
const formComponent = {
  "kind": "form",
  "title": "测试表单",
  "kinds": [
    {
      "kind": "input",
      "nick": "name",
      "placeholder": "请输入姓名"
    },
    {
      "kind": "textarea",
      "nick": "description",
      "placeholder": "请输入描述"
    }
  ]
};

// 测试用例4: 导航组件
const navigationComponent = {
  "kind": "navigation",
  "title": "测试导航",
  "items": [
    { "title": "首页", "url": "/" },
    { "title": "关于", "url": "/about" },
    { "title": "联系我们", "url": "/contact" }
  ]
};

// 测试用例5: 选项组件
const optionsComponent = {
  "kind": "options",
  "title": "测试选项",
  "options": [
    { "title": "选项1", "value": "1" },
    { "title": "选项2", "value": "2" },
    { "title": "选项3", "value": "3" }
  ],
  "value": "2"
};

// 测试用例6: 组件数组
const componentArray = [
  textComponent,
  boxComponent
];

// 执行测试
console.log('=== 测试ANX转Markup功能 ===\n');

// 测试文本组件
console.log('1. 文本组件:');
console.log(anxToMarkup(textComponent));
console.log('\n');

// 测试Box组件
console.log('2. Box组件:');
console.log(anxToMarkup(boxComponent));
console.log('\n');

// 测试表单组件
console.log('3. 表单组件:');
console.log(anxToMarkup(formComponent));
console.log('\n');

// 测试导航组件
console.log('4. 导航组件:');
console.log(anxToMarkup(navigationComponent));
console.log('\n');

// 测试选项组件
console.log('5. 选项组件:');
console.log(anxToMarkup(optionsComponent));
console.log('\n');

// 测试组件数组
console.log('6. 组件数组:');
console.log(anxToMarkup(componentArray));
console.log('\n');

console.log('=== 测试完成 ===');
