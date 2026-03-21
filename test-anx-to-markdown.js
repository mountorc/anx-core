/**
 * 测试ANX转Markdown功能
 */

import { anxToMarkdown } from './core/index.js';

// 测试用例1: 简单的文本组件
const textComponent = {
  kind: 'text',
  value: '这是一段文本内容'
};

// 测试用例2: Box组件
const boxComponent = {
  kind: 'box',
  title: '测试Box组件',
  data: [
    { name: '张三', age: 25 },
    { name: '李四', age: 30 }
  ],
  template: '姓名: {{name}}, 年龄: {{age}}'
};

// 测试用例3: 表单组件
const formComponent = {
  kind: 'form',
  title: '测试表单',
  kinds: [
    {
      kind: 'input',
      nick: 'name',
      placeholder: '请输入姓名'
    },
    {
      kind: 'date',
      nick: 'birthday',
      placeholder: '请选择出生日期'
    }
  ]
};

// 测试用例4: 导航组件
const navigationComponent = {
  kind: 'navigation',
  title: '测试导航',
  items: [
    { title: '首页', url: '/' },
    { title: '关于我们', url: '/about' },
    { title: '联系方式', url: '/contact' }
  ]
};

// 测试用例5: 选项组件
const optionsComponent = {
  kind: 'options',
  title: '测试选项',
  options: [
    { title: '选项1', value: 'option1' },
    { title: '选项2', value: 'option2' },
    { title: '选项3', value: 'option3' }
  ],
  value: 'option2'
};

// 测试用例6: 组件数组
const componentArray = [
  textComponent,
  boxComponent,
  navigationComponent
];

// 执行测试
console.log('=== 测试ANX转Markdown功能 ===\n');

console.log('1. 文本组件:');
console.log(anxToMarkdown(textComponent));
console.log('\n2. Box组件:');
console.log(anxToMarkdown(boxComponent));
console.log('\n3. 表单组件:');
console.log(anxToMarkdown(formComponent));
console.log('\n4. 导航组件:');
console.log(anxToMarkdown(navigationComponent));
console.log('\n5. 选项组件:');
console.log(anxToMarkdown(optionsComponent));
console.log('\n6. 组件数组:');
console.log(anxToMarkdown(componentArray));

console.log('\n=== 测试完成 ===');
