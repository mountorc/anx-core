# ANX Core Skill

name: anx-core-skill
description: Provides API capabilities for ANX markup output and CLI execution
homepage: 
author: ANX Team
version: 1.0.0
license: MIT

## 技能信息

- **名称**: ANX Core Skill
- **版本**: 1.0.0
- **描述**: 提供 ANX 核心功能的 API 能力，包括 ANX 转换、CLI 执行等
- **作者**: ANX Team
- **许可证**: MIT

## 核心功能

### 1. ANX 转换能力

- **convertAnxToMarkdown**: 将 ANX 内容转换为 Markdown 格式
- **convertAnxToNodes**: 将 ANX 内容转换为节点结构
- **generateNodeVisualization**: 生成节点的可视化 HTML 和 CSS

### 2. CLI 命令执行

- **executeCliCommand**: 执行 ANX CLI 命令
- **getCliCommands**: 获取可用的 CLI 命令列表

### 3. 文档管理

- **getUsageFiles**: 获取所有使用说明文件
- **readUsageFile**: 读取特定的使用说明文件

## 技术架构

### 目录结构

```
skill/
├── index.js          # 主入口文件
├── package.json      # 依赖配置
├── manifest.json     # 技能清单
├── usage.md          # 使用说明
└── usage/            # 使用说明文件夹
    └── how-to-use-anx-core-skill.md  # 详细操作指南
```

### 依赖项

- **node-fetch**: 用于 API 调用
- **fs**: 文件系统操作
- **path**: 路径处理

### API 端点

本技能连接到以下后端 API 端点：

- `POST /api/convert` - 转换 ANX 到 Markdown
- `POST /api/convert-to-nodes` - 转换 ANX 到节点结构
- `POST /api/execute-cli` - 执行 CLI 命令
- `POST /api/visualize-node` - 生成节点可视化
- `GET /api/cli/commands` - 获取 CLI 命令列表

## 安装与配置

### 安装依赖

```bash
cd /Users/a1-6/Documents/code/trae/anx-core/skill
npm install
```

### 配置后端服务

确保 ANX 后端服务在以下地址运行：
- 地址: http://localhost:7887
- 端口: 7887

## 使用示例

### 基本用法

```javascript
const ANXCoreSkill = require('./skill/index.js');
const skill = new ANXCoreSkill();

// 转换 ANX 到 Markdown
const anxContent = {
  "kind": "form",
  "title": "测试表单",
  "kinds": [
    {
      "kind": "input",
      "nick": "name",
      "title": "姓名"
    }
  ]
};

skill.execute('convertAnxToMarkdown', { anxContent })
  .then(markdown => console.log(markdown));

// 执行 CLI 命令
const command = 'anx card_123456 get_form';
skill.execute('executeCliCommand', { command })
  .then(result => console.log(result));
```

### 高级用法

```javascript
// 批量处理多个 ANX 内容
async function processMultipleANX(anxContents) {
  const results = [];
  for (const anxContent of anxContents) {
    const markdown = await skill.execute('convertAnxToMarkdown', { anxContent });
    results.push({ anx: anxContent, markdown });
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

- **v1.0.0** (2026-03-29): 初始版本
  - 实现 ANX 转换功能
  - 实现 CLI 命令执行
  - 实现节点可视化生成
  - 添加完整的使用文档

## 贡献指南

欢迎提交问题和改进建议！

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送分支
5. 开启 Pull Request

## 联系方式

- 项目地址: /Users/a1-6/Documents/code/trae/anx-core/skill
- 作者: ANX Team