/**
 * 处理Table组件的ANX配置
 */

const { fetchDataset } = require('../utils/dataset.js');

/**
 * 转换Table组件为Markdown
 * @param {Object} component - Table组件
 * @returns {Promise<string>} - 转换后的Markdown内容
 */
async function convertTableToMarkdown(component) {
  const { title, data, dataset, titles } = component;
  let content = '';

  if (title) {
    content += `## ${title}\n\n`;
  }

  // 处理数据集
  let tableData = data;
  if (!tableData && dataset) {
    try {
      const datasetData = await fetchDataset(dataset);
      tableData = datasetData.data || [];
    } catch (error) {
      console.error('Error fetching dataset:', error);
    }
  }

  // 生成Markdown表格
  if (titles && Array.isArray(titles) && titles.length > 0 && tableData && Array.isArray(tableData)) {
    // 过滤掉隐藏的列
    const visibleTitles = titles.filter(title => !title.hide);
    
    if (visibleTitles.length > 0) {
      // 生成表头
      const headers = visibleTitles.map(title => title.title).join(' | ');
      const separators = visibleTitles.map(() => '---').join(' | ');
      
      content += `| ${headers} |\n`;
      content += `| ${separators} |\n`;
      
      // 生成表格行
      tableData.forEach(row => {
        let rowContent = '';
        
        // 处理不同格式的行数据
        if (Array.isArray(row)) {
          // 处理 [{"nick": "id", "value": 1}, ...] 格式
          visibleTitles.forEach(title => {
            const cell = row.find(item => item.nick === title.nick);
            rowContent += ` ${cell ? cell.value : ''} |`;
          });
        } else if (typeof row === 'object') {
          // 处理 {"id": 1, "name": "John"} 格式
          visibleTitles.forEach(title => {
            rowContent += ` ${row[title.nick] || ''} |`;
          });
        }
        
        content += `|${rowContent}\n`;
      });
      
      content += '\n';
    }
  } else if (titles && Array.isArray(titles) && titles.length > 0) {
    // 只有表头，没有数据
    const visibleTitles = titles.filter(title => !title.hide);
    if (visibleTitles.length > 0) {
      const headers = visibleTitles.map(title => title.title).join(' | ');
      const separators = visibleTitles.map(() => '---').join(' | ');
      
      content += `| ${headers} |\n`;
      content += `| ${separators} |\n`;
      content += `| ${visibleTitles.map(() => '').join(' | ')} |\n`;
      content += '\n';
    }
  }

  return content;
}

module.exports = {
  convertTableToMarkdown
};
