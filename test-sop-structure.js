/**
 * 测试 SOP 结构
 */

const fetch = require('node-fetch');

async function testSopStructure() {
  try {
    console.log('=== 测试 SOP 结构...');
    console.log('');

    // Step 1: Get SOP tile by UUID
    const hubResponse = await fetch('http://localhost:7887/api/hub/3a7f5c2e-8b9d-4e6f-a1c2-3d4e5f6a7b8c');
    const hubData = await hubResponse.json();
    console.log('anxContent:', JSON.stringify(hubData.data.anxContent, null, 2));
    console.log('');
    console.log('kind:', hubData.data.anxContent.kind);

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

testSopStructure();
