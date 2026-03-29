# 如何使用 ANX Core Skill

## 详细操作指南

### 1. 环境准备

在使用 ANX Core Skill 之前，需要确保：

1. **后端服务已启动**：ANX 后端服务应在 http://localhost:7887 上运行
2. **Node.js 环境**：确保安装了 Node.js
3. **依赖安装**：在 skill 目录中运行 `npm install`

### 2. 基本使用流程

#### 步骤 1：导入技能包

```javascript
const ANXCoreSkill = require('./skill/index.js');
const skill = new ANXCoreSkill();
```

#### 步骤 2：准备 ANX 内容

```javascript
const anxContent = {
  "kind": "form",
  "title": "用户注册表单",
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
      "title": "电子邮箱",
      "placeholder": "请输入电子邮箱",
      "type": "email"
    },
    {
      "kind": "button",
      "label": "提交",
      "action": "/submit"
    }
  ]
};
```

#### 步骤 3：使用核心功能

##### 3.1 转换为 Markdown

```javascript
skill.execute('convertAnxToMarkdown', { anxContent })
  .then(markdown => {
    console.log('Markdown 输出:');
    console.log(markdown);
  })
  .catch(error => console.error('转换失败:', error));
```

##### 3.2 转换为节点结构

```javascript
skill.execute('convertAnxToNodes', { anxContent })
  .then(nodes => {
    console.log('节点结构:');
    console.log(JSON.stringify(nodes, null, 2));
  });
```

##### 3.3 执行 CLI 命令

```javascript
// 设置表单数据
const setFormCommand = 'anx card_123456 set_form \'{"username": "testuser", "email": "test@example.com"}\'';

skill.execute('executeCliCommand', { command: setFormCommand })
  .then(result => {
    console.log('命令执行结果:');
    console.log(result);
  });

// 获取表单数据
const getFormCommand = 'anx card_123456 get_form';

skill.execute('executeCliCommand', { command: getFormCommand })
  .then(result => {
    console.log('表单数据:');
    console.log(result);
  });
```

##### 3.4 生成节点可视化

```javascript
// 先获取节点结构
skill.execute('convertAnxToNodes', { anxContent })
  .then(nodes => {
    // 然后生成可视化
    return skill.execute('generateNodeVisualization', { node: nodes });
  })
  .then(visualization => {
    console.log('可视化 HTML:');
    console.log(visualization.html);
    console.log('可视化 CSS:');
    console.log(visualization.css);
  });
```

##### 3.5 获取 CLI 命令列表

```javascript
skill.execute('getCliCommands')
  .then(commands => {
    console.log('可用的 CLI 命令:');
    console.log(JSON.stringify(commands, null, 2));
  });
```

### 3. 高级用法

#### 3.1 批量处理

```javascript
async function processMultipleANX(anxContents) {
  const results = [];
  
  for (const anxContent of anxContents) {
    const markdown = await skill.execute('convertAnxToMarkdown', { anxContent });
    results.push({
      anx: anxContent,
      markdown: markdown
    });
  }
  
  return results;
}

// 使用示例
const multipleANX = [
  { /* ANX 内容 1 */ },
  { /* ANX 内容 2 */ }
];

processMultipleANX(multipleANX)
  .then(results => console.log(results));
```

#### 3.2 错误处理

```javascript
async function safeExecute(command, args) {
  try {
    const result = await skill.execute(command, args);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 使用示例
safeExecute('convertAnxToMarkdown', { anxContent })
  .then(result => {
    if (result.success) {
      console.log('转换成功:', result.result);
    } else {
      console.error('转换失败:', result.error);
    }
  });
```

### 4. 常见问题与解决方案

#### 4.1 后端服务连接失败

**症状**：API 调用返回连接错误

**解决方案**：
- 确认后端服务正在运行：`lsof -ti :7887`
- 确认服务地址正确：默认为 http://localhost:7887
- 检查网络防火墙设置

#### 4.2 转换失败

**症状**：转换 ANX 时返回错误

**解决方案**：
- 检查 ANX 内容格式是否正确
- 确保所有必要的字段都已提供
- 查看后端服务日志获取详细错误信息

#### 4.3 CLI 命令执行失败

**症状**：执行 CLI 命令返回错误

**解决方案**：
- 检查命令格式是否正确
- 确保 cardKey 存在且有效
- 验证 JSON 参数格式是否正确

### 5. 性能优化

1. **缓存结果**：对于相同的 ANX 内容，可以缓存转换结果
2. **批量处理**：使用 async/await 和 Promise.all 并行处理多个请求
3. **错误重试**：对网络请求添加重试机制

### 6. 最佳实践

1. **模块化**：将 ANX 处理逻辑封装为独立的模块
2. **错误处理**：始终使用 try/catch 捕获可能的错误
3. **日志记录**：记录关键操作和错误信息
4. **参数验证**：在调用 API 前验证输入参数
5. **测试覆盖**：为核心功能编写测试用例

## 总结

ANX Core Skill 提供了一套完整的 API 能力，用于处理 ANX 格式的内容。通过本指南，您应该能够：

- 安装和配置技能包
- 使用核心 API 功能
- 处理常见问题
- 应用最佳实践

如果您有任何问题或需要进一步的帮助，请参考项目文档或联系开发团队。