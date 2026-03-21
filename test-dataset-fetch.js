/**
 * 测试数据集获取
 */

async function testDatasetFetch() {
  try {
    const response = await fetch('http://localhost:4665/dataset');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Dataset response:', data);
    console.log('Is array:', Array.isArray(data));
    if (Array.isArray(data)) {
      console.log('Array length:', data.length);
      if (data.length > 0) {
        console.log('First item:', data[0]);
      }
    } else if (data.data) {
      console.log('data.data is array:', Array.isArray(data.data));
      if (Array.isArray(data.data)) {
        console.log('data.data length:', data.data.length);
        if (data.data.length > 0) {
          console.log('First item in data.data:', data.data[0]);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching dataset:', error);
  }
}

testDatasetFetch();
