/**
 * 测试 SOP 组件转换（修复版）
 */

const fetch = require('node-fetch');

async function testSopMarkup() {
  try {
    console.log('=== 测试 SOP Hub Tile (修复版)...');
    console.log('');

    // Step 1: Get SOP tile by UUID
    console.log('1. 获取 SOP tile...');
    const hubResponse = await fetch('http://localhost:7887/api/hub/3a7f5c2e-8b9d-4e6f-a1c2-3d4e5f6a7b8c');
    const hubData = await hubResponse.json();
    console.log('✅ 成功获取 tile:', hubData.data.name);
    console.log('');

    // Step 2: Convert to markup
    console.log('2. 转换为 markup...');
    const convertResponse = await fetch('http://localhost:7887/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anxContent: hubData.data.anxContent })
    });
    const convertData = await convertResponse.json();
    console.log('✅ 成功转换为 markup');
    console.log('');
    console.log('=== Markup 输出:');
    console.log('');
    console.log(convertData.markup);
    console.log('');
    console.log('=== 测试完成 ===');

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

testSopMarkup();
