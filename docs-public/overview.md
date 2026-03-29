# ANX Core 概览

ANX Core 是一个用于处理 ANX 格式数据的核心库，提供了将 ANX 转换为 Markup 的功能。

## 主要功能

- ANX 到 Markup 的转换
- 节点结构生成
- 数据集处理
- 模板解析

## 快速开始

### 安装

```bash
npm install anx-core
```

### 基本使用

```javascript
import { anxToMarkup } from 'anx-core';

const anxContent = {
  "kind": "text",
  "title": "测试文本",
  "value": "这是一段测试文本"
};

anxToMarkup(anxContent)
  .then(markup => {
    console.log(markup);
  });
```
