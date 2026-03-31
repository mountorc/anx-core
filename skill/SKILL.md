---
name: anx-core-skill
version: 1.0.0
description: ANX Core Skill - Provides API capabilities for ANX markup output and CLI execution
author: ANX Team
license: MIT
---

# ANX Core Skill

## 概述

ANX Core Skill 是一个 OpenClaw 兼容的技能，提供 ANX 格式转换、CLI 命令执行和节点可视化等功能。

## 功能特性

### 1. ANX 转换
- **convertAnxToMarkup**: 将 ANX 内容转换为 Markup 格式（通过 uuid_tile）

### 2. CLI 执行
- **executeCliCommand**: 执行 ANX CLI 命令



## 安装

```bash
cd /Users/a1-6/Documents/code/trae/anx-core/skill
npm install
```

## 配置

```javascript
const ANXCoreSkill = require('./index.js');
const skill = new ANXCoreSkill({
  backendUrl: 'http://localhost:7887'  // 后端服务地址
});
```

## 使用示例

### 基本用法

```javascript
// 初始化技能
const skill = new ANXCoreSkill();

// 通过 UUID 获取 Markup
const result = await skill.execute('convertAnxToMarkup', {
  uuid_tile: '8dfe2709-0a95-470d-b28c-bbfa3d1c19b9'
});

if (result.success) {
  console.log(result.data);  // Markup 内容
}

// 执行 CLI 命令 - 填写表单示例
const formData = {
  field1: '值1',
  field2: '值2',
  multiSelectField: ['选项1', '选项2']
};

const cliResult = await skill.execute('executeCliCommand', {
  command: `anx card_123456 set_form '${JSON.stringify(formData)}' --replace`
});

if (cliResult.success) {
  console.log(cliResult.data);  // CLI 执行结果
}

// 验证填写结果
const verifyResult = await skill.execute('executeCliCommand', {
  command: 'anx card_123456 get_form'
});
```

### 健康检查

```javascript
const health = await skill.healthCheck();
console.log(health.status);  // 'healthy' 或 'unhealthy'
```

## API 端点

本技能连接到以下后端 API：

- `POST /api/convert` - 转换 ANX 到 Markup
- `POST /api/execute-cli` - 执行 CLI 命令

## 返回值格式

所有方法返回标准格式：

```javascript
{
  success: boolean,    // 是否成功
  data: any,          // 成功时的数据
  error: string       // 失败时的错误信息
}
```

## 目录结构

```
skill/
├── index.js          # 主入口文件
├── skill.json        # 技能配置
├── package.json      # 依赖配置
├── manifest.json     # 清单文件
└── SKILL.md          # 技能文档
```

## 依赖

- node-fetch: ^3.3.2

## 兼容性

- OpenClaw
- Trae
- Claude Code

## 版本历史

- **v1.0.0** (2026-03-31): 初始版本，适配 OpenClaw 标准
