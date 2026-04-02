---
name: "coreSkill"
description: "Guide for filling forms via ANX Core. Step 1: Get markup by uuid_tile. Step 2: Generate and execute CLI commands to fill form fields. Invoke when user needs to fill a form using ANX Core."
---

# ANX Core Form Filling Guide

## Task Overview

This is a **two-step form filling task**:
1. **Step 1**: Get form markup via `uuid_tile`
2. **Step 2**: Generate and execute CLI commands to fill form fields

---

## Step 1: Get Markup

Get structured form markup via `uuid_tile`:

```javascript
async function getTileMarkup(uuid) {
  const response = await fetch(`http://host.docker.internal:7887/anxCore/getMarkup?uuid_tile=${uuid}`);
  const { markup } = await response.json();
  return markup;
}

// Example: Get clothing image processing form
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const markup = await getTileMarkup(uuid);
console.log(markup);
```

### Markup Structure Example

```markdown
<x form card_1775042299455_9844>
## Clothing Image Processing

<x textarea card_1775042299455_2274>
**system_prompt:**
```
Process the clothing image with refinement...
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

### Field Identification

Identify fields to fill from markup:
- `system_prompt` - textarea type
- `seed` - input type, current value 1424685757
- `display_style` - input type
- `aspect_ratio` - options type

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
await executeCli('anx clothing_image_processing set_form \'{"seed":99999,"system_prompt":"Custom prompt"}\'');
```

### CLI Format Reference

| Format | Description | Example |
|--------|-------------|---------|
| `anx <cardKey> set_form '{"field":"value"}'` | Batch update fields | `anx form set_form '{"seed":123}'` |
| `anx <cardKey> set_form --replace '{...}'` | Replace all fields | `anx form set_form --replace '{"seed":123}'` |

---

## Complete Form Filling Example

```javascript
// ========== Step 1: Get Markup ==========
const uuid = '505619db-c096-46b8-8a1d-0c7754fc9219';
const markup = await getTileMarkup(uuid);

// Parse fields from markup:
// - system_prompt: textarea
// - seed: input (current value: 1424685757)
// - display_style: input
// - aspect_ratio: options

// ========== Step 2: Generate and Execute CLI ==========
// Fill form fields
const formData = {
  "seed": 99999,
  "system_prompt": "Custom processing instruction",
  "display_style": "Fashion style"
};

const cliCommand = `anx clothing_image_processing set_form '${JSON.stringify(formData)}'`;
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

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `http://host.docker.internal:7887/anxCore/getMarkup?uuid_tile=:uuid` | GET | **Step 1**: Get form markup |
| `http://host.docker.internal:7887/api/execute-cli` | POST | **Step 2**: Execute CLI to fill form |

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
