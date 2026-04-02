---
name: "coreSkill"
description: "Guide for connecting to ANX Core via uuid_tile, fetching markup, and controlling form data via CLI. Invoke when user needs to integrate with ANX Core, work with uuid_tile, or execute form-related CLI commands."
---

# ANX Core Skill Guide

## 1. Get Markup by uuid_tile

```javascript
// Get markup directly by uuid_tile (one step!)
async function getTileMarkup(uuid) {
  const response = await fetch(`http://host.docker.internal:7887/anxCore/getMarkup?uuid_tile=${uuid}`);
  const { markup } = await response.json();
  return markup;
}

// Example: Get clothing image processing markup
const markup = await getTileMarkup('505619db-c096-46b8-8a1d-0c7754fc9219');
console.log('Markup:', markup);
```

## 2. Understanding Markup Structure

### Markup Example

**Form → Markup:**
```json
{"kind": "form", "title": "Login", "kinds": [
  {"kind": "input", "nick": "username", "title": "Username"},
  {"kind": "button", "title": "Submit"}
]}
```
↓
```markdown
## Login
<x input card_xxx>**Username:**</x>
<x button card_yyy>**Submit**</x>
```


### Markup Tags
| Tag | Component |
|-----|-----------|
| `<x input>` | Text input |
| `<x textarea>` | Multi-line input |
| `<x button>` | Action button |
| `<x options>` | Dropdown |
| `<x checkbox>` | Multi-select |
| `<x file>` | File upload |
| `<x table>` | Data table |

### Real Markup Output

From clothing image processing tile:
```markdown
<x form card_1775042299455_9844>
## 服装图像处理

<x file card_1775042299455_5553>
<!-- ANX Component: file -->
</x>

<x textarea card_1775042299455_2274>
**system_prompt:**

```
对图像中的服装进行精修处理...
```
</x>

<x input card_1775042299455_1701>
**display_style:** 请输入展示风格
</x>

<x button card_1775042299455_6341>
[Button](#)
</x>
</x>
```

## 3. Form CLI Commands

### Set Form Data

**方法1: JSON 批量更新**
```bash
anx <cardKey> set_form '{"field1":"value1","field2":"value2"}'

# Example
anx clothing_image_processing set_form '{"seed":12345,"system_prompt":"Process image"}'
```

**方法3: 全量替换（使用 --replace）**
```bash
anx <cardKey> set_form --replace '{"seed":12345,"system_prompt":"Process image"}'
```

### Get Form Data
```bash
anx <cardKey> get_form          # Get all fields
anx <cardKey> get_form <field>  # Get specific field

# Examples
anx clothing_image_processing get_form
anx clothing_image_processing get_form seed
```

### Submit Form
```bash
anx <cardKey> submit

# Example
anx clothing_image_processing submit
```

### Execute via API
```javascript
async function executeCli(command) {
  const response = await fetch('http://host.docker.internal:7887/api/execute-cli', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  return await response.json();
}

// Examples
executeCli('anx clothing_image_processing set_form \'{"seed":12345,"system_prompt":"Process image"}\'');
```

## 4. Complete Workflow

```javascript
// 1. Get markup by uuid_tile (one step!)
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const markup = await getTileMarkup(uuid);
console.log('Markup:', markup);

// 2. update multiple fields with JSON
await executeCli('anx clothing_image_processing set_form \'{"seed":99999,"system_prompt":"Custom prompt"}\'');

// 3. Listen for changes
window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_NODE_DATA') {
    const { cardKey, field, value } = event.data;
    console.log(`${field} = ${value}');
  }
});
```

## 5. Event System (tapSet)

Button actions triggered on click:

```json
{
  "kind": "button",
  "title": "Submit",
  "tapSet": {
    "requestSet": {
      "method": "POST",
      "url": "http://host.docker.internal:7887/api/submit",
      "paramMap": {
        "workflowId": "123",
        "data": "formData"
      }
    }
  }
}
```

### Action Types
| Action | Purpose | Parameters |
|--------|---------|------------|
| `requestSet` | HTTP request | method, url, paramMap |
| `navigateTo` | Page navigation | path, paramMap |

### paramMap Syntax
```json
{
  "workflowId": "123",      // Static value
  "data": "formData",       // Field reference
  "image": "images[0]",     // Array index
  "user.name": "profile.name"  // Nested path
}
```

## 6. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `http://host.docker.internal:7887/anxCore/getMarkup?uuid_tile=:uuid` | GET | Get markup by uuid_tile (one step) |
| `http://host.docker.internal:7887/anxCore/getMarkup` | POST | Get markup by anxContent or uuid_tile |
| `http://host.docker.internal:7887/api/hub` | GET | List tiles |
| `http://host.docker.internal:7887/api/hub/:uuid` | GET | Get tile |
| `http://host.docker.internal:7887/api/execute-cli` | POST | Execute CLI |
| `http://host.docker.internal:7887/api/update-node-data` | POST | Update node data |

## 7. Component Kinds

- `form` - Form container
- `input` - Text input
- `textarea` - Multi-line input
- `button` - Action button
- `options` - Dropdown select
- `checkbox` - Multi-select
- `file` - File upload
- `table` - Data table
- `list` - Dynamic list
