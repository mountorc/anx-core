# ANX Core Skill 使用说明

## 简介

ANX Core Skill 是一个为 Trae 平台提供 ANX 核心功能的技能包，主要提供以下能力：

- ANX 内容转换为 Markdown
- ANX 内容转换为节点结构
- 执行 CLI 命令
- 生成节点可视化
- 获取 CLI 命令列表

## 安装

```bash
# 进入 skill 目录
cd /Users/a1-6/Documents/code/trae/anx-core/skill

# 安装依赖
npm install
```

## 使用方法

### 1. 转换 ANX 到 Markdown

```javascript
const ANXCoreSkill = require('./skill/index.js');
const skill = new ANXCoreSkill();

const anxContent = {
  "kind": "form",
  "title": "测试表单",
  "kinds": [
    {
      "kind": "input",
      "nick": "name",
      "title": "姓名",
      "value": ""
    }
  ]
};

skill.execute('convertAnxToMarkdown', { anxContent })
  .then(markdown => console.log(markdown));
```

### 2. 转换 ANX 到节点结构

```javascript
skill.execute('convertAnxToNodes', { anxContent })
  .then(nodes => console.log(nodes));
```

### 3. 执行 CLI 命令

```javascript
const command = 'anx card_123456 set_form \'{"name": "张三", "age": 25}\'';
skill.execute('executeCliCommand', { command })
  .then(result => console.log(result));
```

### 4. 生成节点可视化

```javascript
skill.execute('generateNodeVisualization', { node: nodes })
  .then(visualization => console.log(visualization));
```

### 5. 获取 CLI 命令列表

```javascript
skill.execute('getCliCommands')
  .then(commands => console.log(commands));
```

## 可用命令

- `getUsageFiles` - 获取所有使用说明文件
- `readUsageFile` - 读取特定的使用说明文件
- `convertAnxToMarkdown` - 将 ANX 内容转换为 Markdown
- `convertAnxToNodes` - 将 ANX 内容转换为节点结构
- `executeCliCommand` - 执行 CLI 命令
- `generateNodeVisualization` - 生成节点可视化
- `getCliCommands` - 获取可用的 CLI 命令列表

## 后端服务要求

使用此技能包需要确保 ANX 后端服务正在运行：

- 后端服务地址：http://localhost:7887
- 确保所有 API 端点可用

## 故障排除

1. **后端服务未运行**：确保后端服务正在端口 7887 上运行
2. **API 调用失败**：检查后端服务日志，确认 API 端点是否正常
3. **依赖问题**：确保已安装所有依赖（`npm install`）

## 版本信息

- 版本：1.0.0
- 作者：ANX Team
- 许可证：MIT