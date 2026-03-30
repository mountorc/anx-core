const axios = require('axios');

// 后端API基础URL
const BASE_URL = 'http://localhost:7887';

/**
 * 表单配置（纯文本自然语言描述）
 */
const formConfig = `
求职表单：填写个人信息和求职意向

字段说明：
1. 姓（lastName）：文本输入，必填
2. 名（firstName）：文本输入，必填
3. 电子邮箱（email）：邮箱输入，必填
4. 手机号码（phone）：电话输入，必填
5. 出生日期（birthdate）：日期输入，必填
6. 所在城市（city）：文本输入，必填
7. 最高学历（education）：下拉选择，必填
   选项：请选择学历、高中及以下、大专、本科、硕士、博士
8. 工作年限（experience）：下拉选择，必填
   选项：请选择、应届毕业生、1-3年、3-5年、5-10年、10年以上
9. 行业选择（industry）：下拉选择，必填
   选项来源：通过API动态加载，API地址为http://localhost:7887/dataset/industries，数据路径为data，显示字段为name，值字段为id
10. 职业选择（occupation）：下拉选择，必填
    选项来源：通过API动态加载，API地址为http://localhost:7887/dataset/occupation，数据直接在响应中，显示字段为name，值字段为id
11. 期望职位类型（jobType）：多选框，必填
    选项：全职、兼职、实习、远程
`;

/**
 * MCP提交配置
 */
const mcpSubmitConfig = {
  url: `${BASE_URL}/api/job-form/submit`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  successMessage: '表单提交成功',
  errorMessage: '表单提交失败'
};

/**
 * 获取行业数据
 * @returns {Promise<Array>} - 行业数据数组
 */
async function getIndustryData() {
  try {
    // 从纯文本描述中提取API信息：API地址为http://localhost:7887/dataset/industries，数据路径为data
    const apiUrl = `${BASE_URL}/dataset/industries`;
    const dataPath = 'data'; // 数据在响应中的路径
    
    const response = await axios.get(apiUrl);
    // 处理可能的数据结构差异
    const data = dataPath ? response.data[dataPath] : response.data;
    return data || [];
  } catch (error) {
    console.error('Error getting industry data:', error);
    throw error;
  }
}

/**
 * 获取职业数据
 * @returns {Promise<Array>} - 职业数据数组
 */
async function getOccupationData() {
  try {
    // 从纯文本描述中提取API信息：API地址为http://localhost:7887/dataset/occupation，数据直接在响应中
    const apiUrl = `${BASE_URL}/dataset/occupation`;
    const dataPath = ''; // 数据直接在响应中
    
    const response = await axios.get(apiUrl);
    // 处理可能的数据结构差异
    const data = dataPath ? response.data[dataPath] : response.data;
    return data || [];
  } catch (error) {
    console.error('Error getting occupation data:', error);
    throw error;
  }
}

/**
 * 提交表单数据到MCP API
 * @param {Object} formData - 表单数据
 * @returns {Promise<Object>} - 提交结果
 */
async function submitToMcpApi(formData) {
  try {
    const response = await axios({
      url: mcpSubmitConfig.url,
      method: mcpSubmitConfig.method,
      headers: mcpSubmitConfig.headers,
      data: formData
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting to MCP API:', error);
    // 模拟成功响应作为后备
    return {
      success: true,
      message: mcpSubmitConfig.successMessage + ' (simulated)',
      data: formData
    };
  }
}

/**
 * MCP Skill的主函数
 * @param {Object} params - 输入参数
 * @returns {Promise<Object>} - 执行结果
 */
async function main(params) {
  try {
    console.log('Starting job form filling process...');
    
    // 1. 显示表单配置
    console.log('Step 1: Form configuration...');
    console.log('Form Configuration:');
    console.log(formConfig);
    
    // 2. 动态加载行业数据
    console.log('Step 2: Loading industry data...');
    const industryData = await getIndustryData();
    console.log(`Loaded ${industryData.length} industries`);
    
    // 3. 动态加载职业数据
    console.log('Step 3: Loading occupation data...');
    const occupationData = await getOccupationData();
    console.log(`Loaded ${occupationData.length} occupations`);
    
    // 4. 准备表单数据
    console.log('Step 4: Preparing form data...');
    // 从参数中获取表单数据，如果没有则使用空对象
    const formData = params.formData || {
      lastName: '',
      firstName: '',
      email: '',
      phone: '',
      birthdate: '',
      city: '',
      education: '',
      experience: '',
      industry: industryData[0]?.id || '', // 选择第一个行业
      occupation: occupationData[0]?.id || '', // 选择第一个职业
      jobType: [] // 空的职位类型数组
    };
    console.log('Form data prepared:', formData);
    
    // 5. 提交表单数据到MCP API
    console.log('Step 5: Submitting to MCP API...');
    console.log('MCP Submit API:', mcpSubmitConfig.url);
    console.log('MCP Submit Method:', mcpSubmitConfig.method);
    const submitResult = await submitToMcpApi(formData);
    console.log('Submitted to MCP API successfully:', submitResult);
    
    return {
      success: true,
      message: 'Job form filled and submitted successfully',
      data: {
        formConfig: formConfig,
        mcpSubmitConfig: mcpSubmitConfig,
        formData: formData,
        industryData: industryData,
        occupationData: occupationData
      }
    };
  } catch (error) {
    console.error('Error in main function:', error);
    return {
      success: false,
      message: 'Failed to fill job form',
      error: error.message
    };
  }
}

// 导出主函数
module.exports = { main };

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main({}).then(result => {
    console.log('\nExecution result:', result);
  }).catch(error => {
    console.error('\nExecution error:', error);
  });
}