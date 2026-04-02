/**
 * 测试通过 uuid_tile 获取 markup
 */

async function getMarkupByUuidTile(uuid) {
  try {
    console.log('=== 测试通过 uuid_tile 获取 markup ===\n');
    
    // Step 1: 通过 uuid 获取 tile
    console.log(`Step 1: 获取 tile (UUID: ${uuid})`);
    const hubResponse = await fetch(`http://localhost:7887/api/hub/${uuid}`);
    const hubData = await hubResponse.json();
    
    if (!hubData.success) {
      throw new Error('Failed to load tile: ' + hubData.error);
    }
    
    const anxContent = hubData.data.anxContent;
    console.log('✓ Tile 获取成功');
    console.log(`  - 名称: ${hubData.data.name}`);
    console.log(`  - Kind: ${anxContent.kind}`);
    console.log(`  - Title: ${anxContent.title}`);
    console.log(`  - 子组件数: ${anxContent.kinds?.length || 0}\n`);
    
    // Step 2: 将 ANX content 转换为 markup
    console.log('Step 2: 转换为 markup');
    const convertResponse = await fetch('http://localhost:7887/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anxContent })
    });
    
    const convertData = await convertResponse.json();
    
    // 检查是否有 markup 字段（API 直接返回 markup，没有 success 字段）
    if (!convertData.markup) {
      throw new Error('Failed to convert: ' + (convertData.error || 'No markup returned'));
    }
    
    console.log('✓ Markup 生成成功\n');
    console.log('=== Markup 输出（前 2000 字符）===');
    console.log(convertData.markup.substring(0, 2000));
    if (convertData.markup.length > 2000) {
      console.log('\n... (truncated)');
    }
    console.log('\n=== 测试完成 ===');
    
    return convertData.markup;
    
  } catch (error) {
    console.error('错误:', error.message);
    throw error;
  }
}

// 测试服装图像处理 tile
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
getMarkupByUuidTile(uuid);
