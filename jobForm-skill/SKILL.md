---
name: job-form-skill
description: 填写求职表单，动态加载行业和职业数据，支持MCP方式提交
homepage: 
author: ANX Team
version: 1.0.0
license: MIT
---

# Job Form Skill

## 技能信息

- **名称**: Job Form Skill
- **版本**: 1.0.0
- **描述**: 填写求职表单，动态加载行业和职业数据，支持MCP方式提交
- **作者**: ANX Team
- **许可证**: MIT

## 核心功能

### 1. 表单配置获取

- **getFormConfig**: 获取表单配置的纯文本自然语言描述

### 2. 动态数据加载

- **getIndustryData**: 从API动态加载行业数据
- **getOccupationData**: 从API动态加载职业数据

### 3. 表单提交

- **submitForm**: 通过MCP API提交表单数据
- **fillJobForm**: 完整的表单填写流程（包括数据加载和提交）

## 技术架构

### 目录结构

```
jobForm-skill/
├── index.js          # 主入口文件
├── package.json      # 依赖配置
├── skill.json        # 技能清单
└── SKILL.md          # 使用说明
```

### 依赖项

- **axios**: 用于 API 调用

### API 端点

本技能连接到以下后端 API 端点：

- `GET /dataset/industries` - 获取行业数据
- `GET /dataset/occupation` - 获取职业数据
- `POST /api/job-form/submit` - 提交表单数据

## 安装与配置

### 安装依赖

```bash
cd /Users/a1-6/Documents/code/trae/anx-core/jobForm-skill
npm install
```

### 配置后端服务

确保 ANX 后端服务在以下地址运行：
- 地址: http://localhost:7887
- 端口: 7887

## 使用示例

### 基本用法

```javascript
const JobFormSkill = require('./jobForm-skill/index.js');
const skill = new JobFormSkill();

// 获取表单配置
const formConfig = skill.getFormConfig();
console.log(formConfig);

// 获取行业数据
skill.execute('getIndustryData')
  .then(industries => console.log(industries));

// 获取职业数据
skill.execute('getOccupationData')
  .then(occupations => console.log(occupations));

// 提交表单
const formData = {
  lastName: '张',
  firstName: '三',
  email: 'zhangsan@example.com',
  phone: '13800138000',
  birthdate: '1990-01-01',
  city: '北京',
  education: 'bachelor',
  experience: '3-5',
  industry: 'it',
  occupation: 'developer',
  jobType: ['fulltime', 'remote']
};
skill.execute('submitForm', { formData })
  .then(result => console.log(result));

// 完整的表单填写流程
skill.execute('fillJobForm', { formData })
  .then(result => console.log(result));
```

### 高级用法

```javascript
// 批量处理多个表单
async function processMultipleForms(formsData) {
  const results = [];
  for (const formData of formsData) {
    const result = await skill.execute('fillJobForm', { formData });
    results.push(result);
  }
  return results;
}

// 错误处理
async function safeExecute(command, args) {
  try {
    return await skill.execute(command, args);
  } catch (error) {
    console.error('执行失败:', error);
    return null;
  }
}
```

## 表单字段说明

### 基本信息字段

- **lastName**: 姓，文本输入，必填
- **firstName**: 名，文本输入，必填
- **email**: 电子邮箱，邮箱格式，必填
- **phone**: 手机号码，电话格式，必填
- **birthdate**: 出生日期，日期格式，必填
- **city**: 所在城市，文本输入，必填

### 教育和经验字段

- **education**: 最高学历，下拉选择，必填
  - 选项：请选择学历、高中及以下、大专、本科、硕士、博士
- **experience**: 工作年限，下拉选择，必填
  - 选项：请选择、应届毕业生、1-3年、3-5年、5-10年、10年以上

### 动态加载字段

- **industry**: 行业选择，下拉选择，必填
  - 选项来源：通过API动态加载
  - API地址：http://localhost:7887/dataset/industries
- **occupation**: 职业选择，下拉选择，必填
  - 选项来源：通过API动态加载
  - API地址：http://localhost:7887/dataset/occupation

### 职位类型字段

- **jobType**: 期望职位类型，多选框，必填
  - 选项：全职、兼职、实习、远程

## MCP 提交配置

- **URL**: http://localhost:7887/api/job-form/submit
- **Method**: POST
- **Headers**: Content-Type: application/json
- **Data**: 表单数据对象

## 故障排除

### 常见问题

1. **后端服务未运行**
   - 症状: API 调用返回连接错误
   - 解决: 启动后端服务 `node examples/backend/server.js`

2. **依赖未安装**
   - 症状: 运行时出现模块缺失错误
   - 解决: 执行 `npm install` 安装依赖

3. **API 调用失败**
   - 症状: 返回 HTTP 错误状态码
   - 解决: 检查后端服务日志，确认 API 端点是否正常

### 日志与调试

- 后端服务日志: 查看后端终端输出
- 技能执行日志: 在调用技能时添加错误捕获

## 版本历史

- **v1.0.0** (2026-03-31): 初始版本
  - 实现表单配置获取
  - 实现动态数据加载（行业、职业）
  - 实现MCP方式表单提交
  - 添加完整的使用文档

## 贡献指南

欢迎提交问题和改进建议！

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送分支
5. 开启 Pull Request

## 联系方式

- 项目地址: /Users/a1-6/Documents/code/trae/anx-core/jobForm-skill
- 作者: ANX Team
