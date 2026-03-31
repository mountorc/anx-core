const axios = require('axios');

class JobFormSkill {
  constructor() {
    this.backendUrl = 'http://localhost:7887';
  }

  /**
   * 表单配置（纯文本自然语言描述）
   */
  getFormConfig() {
    return `
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
  }

  /**
   * MCP提交配置
   */
  getMcpSubmitConfig() {
    return {
      url: `${this.backendUrl}/api/job-form/submit`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      successMessage: '表单提交成功',
      errorMessage: '表单提交失败'
    };
  }

  /**
   * 获取行业数据
   * @returns {Promise<Array>} - 行业数据数组
   */
  async getIndustryData() {
    try {
      // 从纯文本描述中提取API信息：API地址为http://localhost:7887/dataset/industries，数据路径为data
      const apiUrl = `${this.backendUrl}/dataset/industries`;
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
  async getOccupationData() {
    try {
      // 从纯文本描述中提取API信息：API地址为http://localhost:7887/dataset/occupation，数据直接在响应中
      const apiUrl = `${this.backendUrl}/dataset/occupation`;
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
  async submitForm(formData) {
    try {
      const mcpSubmitConfig = this.getMcpSubmitConfig();
      const response = await axios({
        url: mcpSubmitConfig.url,
        method: mcpSubmitConfig.method,
        headers: mcpSubmitConfig.headers,
        data: formData
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting to MCP API:', error);
      throw error;
    }
  }

  /**
   * 填写求职表单
   * @param {Object} formData - 表单数据
   * @returns {Promise<Object>} - 填写结果
   */
  async fillJobForm(formData = {}) {
    try {
      console.log('Starting job form filling process...');
      
      // 1. 显示表单配置
      console.log('Step 1: Form configuration...');
      const formConfig = this.getFormConfig();
      console.log('Form Configuration:');
      console.log(formConfig);
      
      // 2. 动态加载行业数据
      console.log('Step 2: Loading industry data...');
      const industryData = await this.getIndustryData();
      console.log(`Loaded ${industryData.length} industries`);
      
      // 3. 动态加载职业数据
      console.log('Step 3: Loading occupation data...');
      const occupationData = await this.getOccupationData();
      console.log(`Loaded ${occupationData.length} occupations`);
      
      // 4. 准备表单数据
      console.log('Step 4: Preparing form data...');
      // 确保所有必填字段都有值
      if (!formData.lastName || !formData.firstName || !formData.email || !formData.phone || !formData.birthdate || !formData.city || !formData.education || !formData.experience || !formData.industry || !formData.occupation || !formData.jobType) {
        throw new Error('Missing required form fields');
      }
      console.log('Form data prepared:', formData);
      
      // 5. 提交表单数据到MCP API
      console.log('Step 5: Submitting to MCP API...');
      const mcpSubmitConfig = this.getMcpSubmitConfig();
      console.log('MCP Submit API:', mcpSubmitConfig.url);
      console.log('MCP Submit Method:', mcpSubmitConfig.method);
      const submitResult = await this.submitForm(formData);
      console.log('Submitted to MCP API successfully:', submitResult);
      
      return {
        success: true,
        message: 'Job form filled and submitted successfully',
        data: {
          formConfig: formConfig,
          mcpSubmitConfig: mcpSubmitConfig,
          formData: formData,
          industryData: industryData,
          occupationData: occupationData,
          submitResult: submitResult
        }
      };
    } catch (error) {
      console.error('Error in fillJobForm:', error);
      return {
        success: false,
        message: 'Failed to fill job form',
        error: error.message
      };
    }
  }

  // Skill interface methods
  async execute(command, args = {}) {
    switch (command) {
      case 'getFormConfig':
        return this.getFormConfig();
      case 'getMcpSubmitConfig':
        return this.getMcpSubmitConfig();
      case 'getIndustryData':
        return await this.getIndustryData();
      case 'getOccupationData':
        return await this.getOccupationData();
      case 'submitForm':
        return await this.submitForm(args.formData);
      case 'fillJobForm':
        return await this.fillJobForm(args.formData);
      default:
        return 'Command not supported. Available commands: getFormConfig, getMcpSubmitConfig, getIndustryData, getOccupationData, submitForm, fillJobForm';
    }
  }

  // Health check
  async healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Get skill information
  async getInfo() {
    return {
      name: 'Job Form Skill',
      version: '1.0.0',
      description: '填写求职表单，动态加载行业和职业数据，支持MCP方式提交',
      commands: [
        'getFormConfig - Get form configuration in plain text',
        'getMcpSubmitConfig - Get MCP submit configuration',
        'getIndustryData - Load industry data from API',
        'getOccupationData - Load occupation data from API',
        'submitForm - Submit form data via MCP API',
        'fillJobForm - Fill job application form with provided data'
      ],
      backendUrl: this.backendUrl
    };
  }
}

// Export the skill
module.exports = JobFormSkill;

// For direct execution
if (require.main === module) {
  const skill = new JobFormSkill();
  skill.healthCheck().then(console.log);
  skill.getInfo().then(console.log);
}
