/**
 * 测试ANX转Markdown功能（带dataset）
 */

import { anxToMarkdown } from './core/index.js';

// 测试用例1: 带本地dataset的Box组件
const boxWithLocalDataset = {
  kind: 'box',
  title: '带本地数据集的Box组件',
  dataset: {
    data: [
      { name: '张三', age: 25 },
      { name: '李四', age: 30 }
    ]
  },
  template: '姓名: {{name}}, 年龄: {{age}}'
};

// 测试用例2: 带远程dataset的Options组件
const optionsWithRemoteDataset = {
  kind: 'options',
  title: '带远程数据集的选项组件',
  optionsSet: {
    dataset: {
      url: 'https://jsonplaceholder.typicode.com/posts'
    }
  }
};

// 执行测试
console.log('=== 测试ANX转Markdown功能（带dataset）===');
console.log('');

// 测试本地dataset
console.log('1. 带本地dataset的Box组件:');
anxToMarkdown(boxWithLocalDataset)
  .then(markdown => {
    console.log(markdown);
    
    // 测试远程dataset
    console.log('\n2. 带远程dataset的Options组件:');
    return anxToMarkdown(optionsWithRemoteDataset);
  })
  .then(markdown => {
    console.log(markdown);
    console.log('\n=== 测试完成 ===');
  })
  .catch(error => {
    console.error('测试失败:', error);
  });
