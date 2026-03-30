---
title: 如何填写 ANX Tile 表单
description: 通过 uuid_tile 获取 ANX markup 并识别表单结构进行填表的完整指南
author: ANX Team
version: 1.0.0
date: 2026-03-31
---

# 如何填写 ANX Tile 表单

本文档介绍如何通过 `uuid_tile` 获取 ANX markup，识别表单结构，并通过 CLI 命令完成填表的完整流程。

## 前置条件

- ANX 后端服务已启动（默认端口 7887）
- 已安装 ANX Core Skill 依赖
- 已知要填写的 Tile 的 `uuid_tile`

## 填表流程

### 第一步：通过 uuid_tile 获取 ANX Markup

使用 `convertAnxToMarkupByUuid` 方法或调用 `/api/convert` 端点获取 Markup。

#### 方法 1：使用 Skill 方法

```javascript
const ANXCoreSkill = require('./skill/index.js');
const skill = new ANXCoreSkill();

const uuid_tile = '8dfe2709-0a95-470d-b28c-bbfa3d1c19b9';
const markup = await skill.convertAnxToMarkupByUuid(uuid_tile);
console.log(markup);
```

#### 方法 2：直接调用 API

```bash
curl -X POST http://localhost:7887/api/convert \
  -H "Content-Type: application/json" \
  -d '{"uuid_tile": "8dfe2709-0a95-470d-b28c-bbfa3d1c19b9"}'
```

#### 返回示例

```json
{
  "markup": "<x form card_1234567890>\n## 创建求职账户\n\n<x text card_1234567891>\n加入我们，发现更多职业机会\n</x>\n..."
}
```

### 第二步：识别表单结构

通过 `convertAnxToNodesByUuid` 方法获取节点结构，识别表单字段。

#### 获取节点结构

```javascript
const nodes = await skill.convertAnxToNodesByUuid(uuid_tile);
console.log(JSON.stringify(nodes, null, 2));
```

#### 节点结构示例

```json
{
  "cardKey": "form_1234567890",
  "config": {
    "kind": "form",
    "title": "创建求职账户"
  },
  "nodes": [
    {
      "cardKey": "input_1234567891",
      "config": {
        "kind": "input",
        "nick": "lastName",
        "title": "姓"
      }
    },
    {
      "cardKey": "input_1234567892",
      "config": {
        "kind": "input",
        "nick": "firstName",
        "title": "名"
      }
    },
    {
      "cardKey": "options_1234567893",
      "config": {
        "kind": "options",
        "nick": "education",
        "title": "最高学历"
      }
    }
  ]
}
```

#### 识别表单字段

从节点结构中提取表单字段信息：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `lastName` | input | 姓 |
| `firstName` | input | 名 |
| `email` | input | 电子邮箱 |
| `phone` | input | 手机号码 |
| `education` | options | 最高学历 |
| `experience` | options | 工作年限 |
| `industry` | options | 行业选择（动态加载）|
| `occupation` | options | 职业选择（动态加载）|
| `jobType` | checkbox | 期望职位类型 |

### 第三步：通过 CLI 填表

#### 1. 获取表单当前值

```javascript
const formCardKey = 'form_1234567890';
const result = await skill.executeCliCommand(`anx ${formCardKey} get_form`);
console.log(result);
```

#### 2. 设置表单值

使用 `set_form` 命令设置表单数据：

```javascript
const formData = {
  lastName: '张',
  firstName: '三',
  email: 'zhangsan@example.com',
  phone: '13800138000',
  education: 'bachelor',
  experience: '3-5',
  industry: 'it',
  occupation: 'developer',
  jobType: ['fulltime', 'remote']
};

const command = `anx ${formCardKey} set_form '${JSON.stringify(formData)}' --replace`;
const result = await skill.executeCliCommand(command);
console.log(result);
```

#### 3. 逐个字段填写

也可以逐个字段填写：

```javascript
// 填写姓
await skill.executeCliCommand(`anx input_lastName fill '张'`);

// 填写名
await skill.executeCliCommand(`anx input_firstName fill '三'`);

// 选择学历
await skill.executeCliCommand(`anx options_education fill 'bachelor'`);

// 选择职位类型（多选）
await skill.executeCliCommand(`anx checkbox_jobType fill 'fulltime,remote'`);
```

### 第四步：验证填写结果

#### 1. 重新获取表单值

```javascript
const updatedForm = await skill.executeCliCommand(`anx ${formCardKey} get_form`);
console.log('Updated form data:', updatedForm);
```

#### 2. 生成更新后的 Markup

```javascript
const updatedMarkup = await skill.convertAnxToMarkupByUuid(uuid_tile);
console.log('Updated markup:', updatedMarkup);
```

## 完整示例代码

```javascript
const ANXCoreSkill = require('./skill/index.js');

async function fillAnxTileForm(uuid_tile, formData) {
  const skill = new ANXCoreSkill();
  
  try {
    console.log('Step 1: 获取 ANX Markup...');
    const markup = await skill.convertAnxToMarkupByUuid(uuid_tile);
    console.log('Markup 获取成功');
    
    console.log('\nStep 2: 获取节点结构...');
    const nodes = await skill.convertAnxToNodesByUuid(uuid_tile);
    const formCardKey = nodes.cardKey;
    console.log('Form CardKey:', formCardKey);
    
    // 识别表单字段
    const fields = nodes.nodes.map(node => ({
      nick: node.config.nick,
      kind: node.config.kind,
      title: node.config.title
    }));
    console.log('识别到的表单字段:', fields);
    
    console.log('\nStep 3: 填写表单...');
    const command = `anx ${formCardKey} set_form '${JSON.stringify(formData)}' --replace`;
    const result = await skill.executeCliCommand(command);
    console.log('填表结果:', result);
    
    console.log('\nStep 4: 验证结果...');
    const updatedForm = await skill.executeCliCommand(`anx ${formCardKey} get_form`);
    console.log('更新后的表单数据:', updatedForm);
    
    return {
      success: true,
      markup: markup,
      formData: updatedForm
    };
  } catch (error) {
    console.error('填表失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 使用示例
const uuid_tile = '8dfe2709-0a95-470d-b28c-bbfa3d1c19b9';
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

fillAnxTileForm(uuid_tile, formData).then(console.log);
```

## 常见问题

### 1. 如何获取 uuid_tile？

uuid_tile 可以在 hub 配置文件中找到，例如：
- 文件路径：`/hub/8dfe2709-0a95-470d-b28c-bbfa3d1c19b9.json`
- uuid_tile：`8dfe2709-0a95-470d-b28c-bbfa3d1c19b9`

### 2. 动态加载的选项如何填写？

对于 industry 和 occupation 等动态加载的字段：
1. 先调用 `/dataset/industries` 或 `/dataset/occupation` 获取选项数据
2. 根据返回的 `id` 值填写表单

```javascript
// 获取行业数据
const industries = await fetch('http://localhost:7887/dataset/industries').then(r => r.json());
console.log(industries); // [{ id: 'it', name: '信息技术' }, ...]

// 使用 id 值填写
formData.industry = 'it'; // 使用 id，不是 name
```

### 3. 如何处理多选字段？

多选字段（如 jobType）使用数组格式：

```javascript
formData.jobType = ['fulltime', 'remote']; // 数组格式
```

### 4. 填表后 Markup 没有更新？

确保：
1. 后端服务已正确存储节点数据
2. 调用 `convertAnxToMarkupByUuid` 时使用的是同一个 `uuid_tile`
3. 检查 `nodeStorage` 中是否已更新数据

## 相关文档

- [ANX Core Skill 使用说明](./how-to-use-anx-core-skill.md)
- [SKILL.md](../SKILL.md)
- [Backend API 文档](../../docs-public/)
