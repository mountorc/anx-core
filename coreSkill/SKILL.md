---
name: "coreSkill"
description: "Guide for filling forms via ANX Core. Step 1: Get markup by uuid_tile. Step 2: Generate and execute CLI commands to fill form fields. Invoke when user needs to fill a form using ANX Core."
---

# ANX Core 填表任务指南

## 任务概述

这是一个**两步填表任务**：
1. **第一步**: 通过 `uuid_tile` 获取表单 markup
2. **第二步**: 生成 CLI 命令并执行，填写表单字段

---

## 第一步: 获取 Markup

通过 `uuid_tile` 获取表单的结构化 markup：

```javascript
async function getTileMarkup(uuid) {
  const response = await fetch(`http://host.docker.internal:7887/anxCore/getMarkup?uuid_tile=${uuid}`);
  const { markup } = await response.json();
  return markup;
}

// 示例: 获取服装图像处理表单
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const markup = await getTileMarkup(uuid);
console.log(markup);
```

### Markup 结构示例

```markdown
<x form card_1775042299455_9844>
## 服装图像处理

<x textarea card_1775042299455_2274>
**system_prompt:**
```
对图像中的服装进行精修处理...
```
</x>

<x input card_1775042299455_5335>
**seed:** 1424685757
</x>

<x button card_1775042299455_6341>
[Button](#)
</x>
</x>
```

### 字段识别

从 markup 中识别需要填写的字段：
- `system_prompt` - textarea 类型
- `seed` - input 类型，当前值 1424685757
- `display_style` - input 类型
- `aspect_ratio` - options 类型

---

## 第二步: 执行 CLI 填表

### 生成 CLI 命令

根据字段生成 `set_form` 命令：

```bash
anx <cardKey> set_form '{"field1":"value1","field2":"value2",...}'
```

### 执行 CLI

```javascript
async function executeCli(command) {
  const response = await fetch('http://host.docker.internal:7887/api/execute-cli', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  return await response.json();
}

// 填写表单字段
await executeCli('anx clothing_image_processing set_form \'{"seed":99999,"system_prompt":"Custom prompt"}\'');
```

### CLI 格式说明

| 格式 | 说明 | 示例 |
|------|------|------|
| `anx <cardKey> set_form '{"field":"value"}'` | 批量更新字段 | `anx form set_form '{"seed":123}'` |
| `anx <cardKey> set_form --replace '{...}'` | 全量替换所有字段 | `anx form set_form --replace '{"seed":123}'` |

---

## 完整填表示例

```javascript
// ========== 第一步: 获取 Markup ==========
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const markup = await getTileMarkup(uuid);

// 从 markup 解析字段:
// - system_prompt: textarea
// - seed: input (当前值: 1424685757)
// - display_style: input
// - aspect_ratio: options

// ========== 第二步: 生成并执行 CLI ==========
// 填写表单字段
const formData = {
  "seed": 99999,
  "system_prompt": "自定义处理指令",
  "display_style": "时尚风格"
};

const cliCommand = `anx clothing_image_processing set_form '${JSON.stringify(formData)}'`;
await executeCli(cliCommand);

// 填表完成!
console.log('表单已填写完成');
```

---

## Markup 标签参考

| 标签 | 组件类型 | 填写方式 |
|------|----------|----------|
| `<x input>` | 文本输入 | `set_form '{"field":"value"}'` |
| `<x textarea>` | 多行文本 | `set_form '{"field":"value"}'` |
| `<x options>` | 下拉选择 | `set_form '{"field":"option_value"}'` |
| `<x checkbox>` | 多选框 | `set_form '{"field":["value1","value2"]}'` |
| `<x file>` | 文件上传 | 通过文件上传接口 |
| `<x button>` | 按钮 | 触发提交或动作 |

---

## API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `http://host.docker.internal:7887/anxCore/getMarkup?uuid_tile=:uuid` | GET | **第一步**: 获取表单 markup |
| `http://host.docker.internal:7887/api/execute-cli` | POST | **第二步**: 执行 CLI 填表 |

---

## 字段值格式

### input / textarea
```json
{"field_name": "文本值"}
```

### options (单选)
```json
{"field_name": "option_value"}
```

### checkbox (多选)
```json
{"field_name": ["value1", "value2"]}
```

### number
```json
{"field_name": 12345}
```
