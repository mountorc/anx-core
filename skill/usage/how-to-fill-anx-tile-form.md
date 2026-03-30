---
title: 填写ANX Tile表单
description: 通过uuid_tile获取markup并填表
---

# 填写ANX Tile表单

## 流程

### 1. 获取Markup
```javascript
const skill = new ANXCoreSkill();
const markup = await skill.convertAnxToMarkupByUuid(uuid_tile);
```


### 2. CLI填表
```javascript
// 批量填写
const command = `anx ${formCardKey} set_form '${JSON.stringify(formData)}' --replace`;
await skill.executeCliCommand(command);

// 或逐个填写
await skill.executeCliCommand(`anx input_lastName fill '张'`);
```

### 4. 验证
```javascript
const result = await skill.executeCliCommand(`anx ${formCardKey} get_form`);
```

## 完整示例
```javascript
async function fillForm(uuid_tile, formData) {
  const skill = new ANXCoreSkill();
  const nodes = await skill.convertAnxToNodesByUuid(uuid_tile);
  const cmd = `anx ${nodes.cardKey} set_form '${JSON.stringify(formData)}' --replace`;
  return await skill.executeCliCommand(cmd);
}
```

## 注意
- 动态选项使用id值填写
- 多选字段用数组格式
- 后端服务需在7887端口运行