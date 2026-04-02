# ANX Core

ANX Core 是一个用于处理 ANX (ANnotation eXtended) 格式的核心库，支持将 ANX 配置转换为可视化的 UI 组件和 Markdown 格式。

## 项目简介

ANX Core 提供了一套完整的工具链，用于：
- 将 ANX 配置转换为节点结构
- 生成可视化的 UI 组件
- 转换为 Markdown 格式
- 支持 CLI 命令操作
- 提供前后端示例实现

## 项目结构

```
anx-core/
├── core/                    # 核心功能模块
│   ├── kinds/              # 各种组件类型处理
│   │   ├── board.js        # 面板组件
│   │   ├── box.js          # 盒子组件
│   │   ├── form.js         # 表单组件
│   │   ├── list.js         # 列表组件
│   │   ├── navigation.js   # 导航组件
│   │   ├── options.js      # 选项组件
│   │   ├── table.js        # 表格组件
│   │   └── file.js         # 文件组件
│   ├── utils/              # 工具函数
│   │   ├── dataset.js      # 数据集处理
│   │   ├── template.js     # 模板处理
│   │   └── trigger-and-tap.js  # 事件处理
│   ├── cli/                # CLI 命令行工具
│   │   ├── cli.js          # CLI 实现
│   │   ├── commands.json   # 命令配置
│   │   └── index.js        # CLI 入口
│   ├── anx-to-markup.js    # ANX 转 Markup
│   └── index.js            # 核心入口
├── view/                    # 视图渲染模块
│   ├── kinds/              # 视图组件渲染器
│   │   ├── button.js       # 按钮渲染
│   │   ├── form.js         # 表单渲染
│   │   ├── input.js        # 输入框渲染
│   │   └── ...             # 其他渲染器
│   ├── utils/              # 视图工具
│   ├── index.js            # 视图入口
│   └── renderers.js        # 渲染器注册
├── examples/                # 示例项目
│   ├── backend/            # 后端示例 (Express)
│   │   ├── server.js       # 服务器入口
│   │   └── package.json
│   └── frontend/           # 前端示例 (Vue 3)
│       ├── src/
│       │   ├── views/
│       │   │   └── Home.vue
│       │   └── utils/
│       └── package.json
├── hub/                     # 预定义配置库
│   ├── 505619db-c096-46b8-8a1d-0c7754fc9219.json  # 服装图像处理
│   └── ...
├── skill/                   # Skill 模块
│   ├── index.js
│   └── SKILL.md
└── docs-*/                  # 文档目录
```

## 核心功能

### 1. ANX 格式转换

将 ANX JSON 配置转换为节点结构：

```javascript
const { anxToNodes } = require('./core');

const anxContent = {
  kind: "form",
  title: "用户表单",
  kinds: [
    {
      kind: "input",
      nick: "username",
      title: "用户名"
    },
    {
      kind: "button",
      title: "提交",
      tapSet: {
        requestSet: {
          method: "POST",
          url: "/api/submit"
        }
      }
    }
  ]
};

const nodes = anxToNodes(anxContent);
```

### 2. 可视化渲染

生成可交互的 HTML 可视化组件：

```javascript
const { generateNodeVisualization } = require('./view');

const html = generateNodeVisualization(node);
```

### 3. CLI 命令支持

支持命令行操作：

```bash
# 执行 CLI 命令
node cli.js --command="set form clothing_image_processing"
```

## 支持的组件类型

| 组件类型 | 说明 | 特性 |
|---------|------|------|
| `box` | 盒子容器 | 支持 tapSet 事件 |
| `board` | 面板布局 | 支持多种子组件 |
| `form` | 表单 | 支持输入验证、提交 |
| `table` | 表格 | 支持数据展示 |
| `list` | 列表 | 支持动态数据 |
| `input` | 输入框 | 支持多种类型 |
| `textarea` | 文本域 | 支持多行输入 |
| `button` | 按钮 | 支持 tapSet 事件 |
| `options` | 下拉选项 | 支持数据集 |
| `checkbox` | 复选框 | 支持多选 |
| `file` | 文件上传 | 支持图片预览 |
| `navigation` | 导航 | 支持页面跳转 |

## 事件系统 (tapSet)

支持的事件类型：

```json
{
  "tapSet": {
    "requestSet": {
      "method": "POST",
      "url": "http://localhost:3002/api/run-workflow",
      "paramMap": {
        "workflowId": "2028318219441803266",
        "image1": "images[0]"
      }
    },
    "navigateTo": {
      "path": "/detail",
      "paramMap": {
        "id": "id"
      }
    },
    "updateData": {
      "tableName": "users",
      "paramMap": {
        "name": "username"
      }
    }
  }
}
```

## 快速开始

### 安装依赖

```bash
# 安装核心依赖
npm install

# 安装后端依赖
cd examples/backend && npm install

# 安装前端依赖
cd examples/frontend && npm install
```

### 启动服务

```bash
# 启动后端服务 (端口 7887)
cd examples/backend
npm run dev

# 启动前端服务 (端口 17887)
cd examples/frontend
npm run dev
```

访问 http://localhost:17887/ 查看示例。

### 使用示例

#### 1. 基本表单

```json
{
  "kind": "form",
  "title": "用户注册",
  "kinds": [
    {
      "kind": "input",
      "nick": "username",
      "title": "用户名",
      "placeholder": "请输入用户名"
    },
    {
      "kind": "input",
      "nick": "email",
      "title": "邮箱",
      "type": "email"
    },
    {
      "kind": "button",
      "title": "提交",
      "tapSet": {
        "requestSet": {
          "method": "POST",
          "url": "/api/register"
        }
      }
    }
  ]
}
```

#### 2. 带数据集的表格

```json
{
  "kind": "table",
  "title": "商品列表",
  "titles": [
    { "nick": "name", "title": "商品名称" },
    { "nick": "price", "title": "价格" }
  ],
  "dataset": {
    "url_dataset": "http://localhost:4665/dataset"
  }
}
```

#### 3. 文件上传

```json
{
  "kind": "file",
  "nick": "images",
  "title": "上传图片",
  "accept": "image/*",
  "multiple": true,
  "maxCount": 8
}
```

## API 接口

### 后端 API

| 接口 | 方法 | 说明 |
|-----|------|------|
| `/api/convert` | POST | ANX 转 Markup |
| `/api/convert-to-nodes` | POST | ANX 转节点结构 |
| `/api/visualize-node` | POST | 生成节点可视化 |
| `/api/update-node-data` | POST | 更新节点数据 |
| `/api/execute-cli` | POST | 执行 CLI 命令 |
| `/api/cli/commands` | GET | 获取 CLI 命令列表 |
| `/api/cli/logs` | GET | 获取 CLI 日志 |
| `/api/hub` | GET | 获取 Hub 列表 |
| `/api/hub/:uuid` | GET | 获取 Hub 详情 |

### 请求示例

```bash
# 转换 ANX 到 Markup
curl -X POST http://localhost:7887/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "anxContent": {
      "kind": "box",
      "title": "测试"
    }
  }'
```

## 配置说明

### Hub 配置

Hub 目录存储预定义的 ANX 配置，每个配置文件包含：

```json
{
  "uuid": "505619db-c096-46b8-8a1d-0c7754fc9219",
  "name": "服装图像处理",
  "anxContent": {
    // ANX 配置
  }
}
```

### 按钮颜色规则

- **蓝色 (#409eff)**: 按钮包含 `tapSet` 配置，可触发请求
- **绿色 (#28a745)**: 按钮无 `tapSet` 配置，仅显示

## 开发指南

### 添加新的组件类型

1. 在 `core/kinds/` 创建组件处理器
2. 在 `view/kinds/` 创建视图渲染器
3. 在 `view/renderers.js` 注册渲染器

### 添加 CLI 命令

在 `core/cli/commands.json` 中添加命令定义：

```json
{
  "commands": [
    {
      "name": "my-command",
      "description": "命令描述",
      "usage": "my-command [args]",
      "example": "my-command arg1 arg2"
    }
  ]
}
```

## 技术栈

- **后端**: Node.js, Express
- **前端**: Vue 3, Vite
- **核心**: 原生 JavaScript

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。

## 联系方式

如有问题，请通过 GitHub Issues 联系。
