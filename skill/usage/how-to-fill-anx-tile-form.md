---
title: 填写ANX Tile表单
description: 直接使用CLI填表的简洁步骤
---

# 填写ANX Tile表单

## 核心步骤

### 1. 获取表单标识
```javascript
const skill = new ANXCoreSkill();
const nodes = await skill.convertAnxToNodesByUuid(uuid_tile);
const cardKey = nodes.cardKey;
```

### 2. 批量填写表单
```javascript
const formData = {
  field1: '值1',
  field2: '值2',
  multiSelectField: ['选项1', '选项2']
};

await skill.executeCliCommand(`anx ${cardKey} set_form '${JSON.stringify(formData)}' --replace`);
```

### 3. 验证结果
```javascript
const result = await skill.executeCliCommand(`anx ${cardKey} get_form`);
```

## 简洁函数
```javascript
async function fillForm(uuid_tile, formData) {
  const skill = new ANXCoreSkill();
  const nodes = await skill.convertAnxToNodesByUuid(uuid_tile);
  await skill.executeCliCommand(`anx ${nodes.cardKey} set_form '${JSON.stringify(formData)}' --replace`);
  return await skill.executeCliCommand(`anx ${nodes.cardKey} get_form`);
}
```

## 关键说明
- **无需获取命令集**：直接使用上述步骤完成填表
- **批量操作**：使用 `set_form` 命令一次填写所有字段
- **数据格式**：
  - 普通字段：直接赋值
  - 多选字段：使用数组
  - 动态选项：使用选项值
- **后端要求**：服务需在7887端口运行
- **参数说明**：
  - `uuid_tile`：表单的唯一标识
  - `formData`：包含所有字段的对象
  - `--replace`：替换现有值

## 示例
```javascript
// 填写工作申请表
await fillForm('8dfe2709-0a95-470d-b28c-bbfa3d1c19b9', {
  lastName: '张',
  firstName: '三',
  email: 'zhangsan@example.com',
  industry: 'IT',
  jobType: ['fulltime']
});
```