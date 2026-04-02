---
name: "coreSkill"
description: "Guide for connecting to ANX Core via uuid_tile, fetching markup, and controlling form data via CLI. Invoke when user needs to integrate with ANX Core, work with uuid_tile, or execute form-related CLI commands."
---

# ANX Core Skill Guide

## 1. Connecting via uuid_tile

### Load Tile by UUID

```javascript
// Fetch tile
async function loadTile(uuid) {
  const response = await fetch(`http://host.docker.internal:7887/api/hub/${uuid}`);
  const data = await response.json();
  return data.data.anxContent;
}

// Example
loadTile('505619db-c096-46b8-8a1d-0c7754fc9219');
```

## 2. Understanding Markup

### ANX to Markup
```javascript
async function convertToMarkup(anxContent) {
  const response = await fetch('http://host.docker.internal:7887/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anxContent })
  });
  return (await response.json()).markup;
}
```

### Markup Examples

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

**Table → Markup:**
```json
{"kind": "table", "titles": [{"nick": "name"}], "data": [{"name": "Alice"}]}
```
↓
```markdown
| Name |
|------|
| Alice |
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

## 3. Form CLI Commands

### Set Form Data
```bash
set form <cardKey> <field> <value>

# Examples
set form clothing_image_processing seed 12345
set form clothing_image_processing system_prompt "Process image"
```

### Get Form Data
```bash
get form <cardKey>          # Get all fields
get form <cardKey> <field>  # Get specific field
```

### Submit Form
```bash
submit form <cardKey>
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
executeCli('set form clothing_image_processing seed 12345');
executeCli('get form clothing_image_processing');
executeCli('submit form clothing_image_processing');
```

## 4. Complete Workflow

```javascript
// 1. Load tile
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const anxContent = await loadTile(uuid);

// 2. Convert to markup
const markup = await convertToMarkup(anxContent);
console.log('Markup:', markup);

// 3. Update data
await executeCli('set form clothing_image_processing seed 99999');

// 4. Listen for changes
window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_NODE_DATA') {
    const { cardKey, field, value } = event.data;
    console.log(`${field} = ${value}`);
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
| `http://host.docker.internal:7887/api/hub` | GET | List tiles |
| `http://host.docker.internal:7887/api/hub/:uuid` | GET | Get tile |
| `http://host.docker.internal:7887/api/convert` | POST | ANX to Markup |
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
