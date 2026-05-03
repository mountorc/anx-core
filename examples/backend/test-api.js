const fetch = require('node-fetch');

async function testAPI() {
  const uuid = 'ebc033a6-f2fb-4cf6-b64e-dfc13a240939';
  
  console.log('Testing API with uuid:', uuid);
  
  try {
    // 测试 /api/convert
    console.log('\n1. Testing /api/convert...');
    const convertResponse = await fetch('http://localhost:7887/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uuid_tile: uuid })
    });
    
    const convertData = await convertResponse.json();
    console.log('Convert response:', convertData);
    
    // 测试 /api/getNodes
    console.log('\n2. Testing /api/getNodes...');
    const nodesResponse = await fetch('http://localhost:7887/api/getNodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uuid_tile: uuid })
    });
    
    const nodesData = await nodesResponse.json();