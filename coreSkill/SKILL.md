---
name: "coreSkill"
description: "Guide for filling forms via ANX Core. Step 1: Get markup by uuid_tile. Step 2: Generate and execute CLI commands to fill form fields. Invoke when user needs to fill a form using ANX Core."
---

# ANX Core Form Filling Guide

## Task Overview

This is a **two-step form filling task**:
1. **Step 1**: Get form markup via `uuid_tile` or `url_tile`
2. **Step 2**: Generate and execute CLI commands to fill form fields

---

## Step 1: Get Markup

Get structured form markup via `uuid_tile` or `url_tile`:

```javascript
async function getTileMarkup(uuid_tile, uuid_visitor = null) {
  const params = new URLSearchParams({ uuid_tile });
  if (uuid_visitor) {
    params.set('uuid_visitor', uuid_visitor);
  }
  const response = await fetch(`http://host.docker.internal:7887/api/markup?${params}`);
  const markup = await response.text();
  return markup;
}

// Example: Get clothing image processing form
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const markup = await getTileMarkup(uuid, '8393667a-7a2a-48f3-bc2c-c7a54b41292d');
console.log(markup);
```

### Using url_tile

```javascript
async function getTileMarkupByUrl(url_tile, uuid_visitor = null) {
  const params = new URLSearchParams({ url_tile });
  if (uuid_visitor) {
    params.set('uuid_visitor', uuid_visitor);
  }
  const response = await fetch(`http://host.docker.internal:7887/api/markup?${params}`);
  const markup = await response.text();
  return markup;
}

// Example: Get form via URL
const url = 'http://localhost:2427/ability/anx/config/turan.face_swap@1.0.0';
const markup = await getTileMarkupByUrl(url);
```

### Markup Structure Example

```markdown
uuid_page: page_1776611783355_6f99p6d68
uuid_visitor: 8393667a-7a2a-48f3-bc2c-c7a54b41292d

<x form card_1776755731076_8546>
## Clothing Image Processing

<x textarea card_1776755731076_7529>
**system_prompt:**
```
Process the clothing image with refinement...
```
</x>

<x input card_1776755731076_4163>
**display_style:** Fashion style
</x>

<x options card_1776755731076_5924>
**aspect_ratio:**
<x 0 randomize>随机</x>
<x 1 1:1 selected>1:1</x>
</x>

<x button card_1776755731076_9965>
[Submit](#)
</x>
</x>
```

### Field Identification

Identify fields to fill from markup:
- `system_prompt` - textarea type
- `display_style` - input type
- `aspect_ratio` - options type (selected: 1:1)
- `seed` - input type

---

## Step 2: Execute CLI to Fill Form

### Generate CLI Command

Generate `set_form` command based on fields:

```bash
anx <cardKey> set_form '{"field1":"value1","field2":"value2",...}'
```

### Execute CLI

```javascript
async function executeCli(command) {
  const response = await fetch('http://host.docker.internal:7887/api/execute-cli', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  return await response.json();
}

// Fill form fields
await executeCli('anx card_1776755731076_8546 set_form \'{"seed":99999,"system_prompt":"Custom prompt"}\'');
```

### CLI Format Reference

| Format | Description | Example |
|--------|-------------|---------|
| `anx <cardKey> set_form '{"field":"value"}'` | Batch update fields | `anx card_xxx set_form '{"seed":123}'` |
| `anx <cardKey> set_form --replace '{...}'` | Replace all fields | `anx card_xxx set_form --replace '{"seed":123}'` |
| `anx <cardKey> get_data` | Get current form data | `anx card_xxx get_data` |

---

## Complete Form Filling Example

```javascript
// ========== Step 1: Get Markup ==========
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const uuid_visitor = '8393667a-7a2a-48f3-bc2c-c7a54b41292d';
const markup = await getTileMarkup(uuid, uuid_visitor);

// Parse markup to extract:
// - uuid_page: page_1776611783355_6f99p6d68
// - Form cardKey: card_1776755731076_8546
// - Fields: system_prompt, display_style, aspect_ratio, seed

// ========== Step 2: Generate and Execute CLI ==========
// Fill form fields
const formData = {
  "seed": 99999,
  "system_prompt": "Custom processing instruction",
  "display_style": "Fashion style",
  "aspect_ratio": "1:1"
};

const cliCommand = `anx card_1776755731076_8546 set_form '${JSON.stringify(formData)}'`;
await executeCli(cliCommand);

// Form filling complete!
console.log('Form filled successfully');
```

---

## Markup Tag Reference

| Tag | Component Type | Filling Method |
|-----|----------------|----------------|
| `<x input>` | Text input | `set_form '{"field":"value"}'` |
| `<x textarea>` | Multi-line text | `set_form '{"field":"value"}'` |
| `<x options>` | Dropdown | `set_form '{"field":"option_value"}'` |
| `<x checkbox>` | Multi-select | `set_form '{"field":["value1","value2"]}'` |
| `<x file>` | File upload | Via file upload API |
| `<x button>` | Button | Trigger submit or action |
| `<x form>` | Form container | Parent container, use its cardKey |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `http://host.docker.internal:7887/api/markup?uuid_tile=:uuid` | GET | **Step 1**: Get form markup by tile UUID |
| `http://host.docker.internal:7887/api/markup?url_tile=:url` | GET | **Step 1**: Get form markup by tile URL |
| `http://host.docker.internal:7887/api/execute-cli` | POST | **Step 2**: Execute CLI to fill form |

### GET /api/markup Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `uuid_tile` | Yes (or url_tile) | Tile UUID to get markup for |
| `url_tile` | Yes (or uuid_tile) | Tile URL to get markup from |
| `uuid_visitor` | No | Visitor identifier for session tracking |
| `uuid_page` | No | Explicit page UUID (if not provided, auto-generated) |

---

## Field Value Formats

### input / textarea
```json
{"field_name": "text value"}
```

### options (single select)
```json
{"field_name": "option_value"}
```

### checkbox (multi-select)
```json
{"field_name": ["value1", "value2"]}
```

### number
```json
{"field_name": 12345}
```

---

## Response Structure

### Markup Response Format

The `/api/markup` endpoint returns plain text with:
1. `uuid_page` - Page identifier (first line)
2. `uuid_visitor` - Visitor identifier (second line, if provided)
3. Form markup content (from third line onwards)

```
uuid_page: page_1776611783355_6f99p6d68
uuid_visitor: 8393667a-7a2a-48f3-bc2c-c7a54b41292d

<x form card_xxx>
...form content...
</x>
```

### CLI Execute Response Format

```json
{
  "cardKey": "card_xxx",
  "action": "set_form",
  "result": "success",
  "data": {"field1": "value1", "field2": "value2"}
}
```
