/**
 * 测试ANX转Markup功能（带options dataset）
 */

import { anxToMarkup } from './core/index.js';

// 测试用例: 带url_dataset的Options组件（用户提供的示例）
const optionsWithUrlDataset = {
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
};

// 执行测试
console.log('=== 测试ANX转Markup功能（带options dataset）===');
console.log('');

anxToMarkup(optionsWithUrlDataset)
  .then(markup => {
    console.log('Options组件（带url_dataset）:');
    console.log(markup);
    console.log('\n=== 测试完成 ===');
  })
  .catch(error => {
    console.error('测试失败:', error);
  });