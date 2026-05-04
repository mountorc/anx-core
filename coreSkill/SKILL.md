---
name: "coreSkill"
description: "Guide for interacting with ANX Core via APIs. Step 1: Get markup by uuid_tile and remember uuid_page. Step 2: Use uuid_page to maintain stable page instance. Step 3: Execute CLI commands or use node APIs to interact with form fields. Also supports command logs querying for debugging."
---

# ANX Core API Guide

## Task Overview

This is a **multi-step form interaction task**:
1. **Step 1**: Get form markup via `uuid_tile` or `url_tile` and remember `uuid_page`
2. **Step 2**: **Extract and store `uuid_page`** - CRITICAL for maintaining stable page instance
3. **Step 3**: Use node APIs or execute CLI commands to interact with form fields
4. **Step 4** (Optional): Query command logs for debugging

---

## Important: uuid_page Management

**uuid_page is the key to maintaining a stable page instance!** Each page instance has:
- Unique `cardKey` values for all nodes
- Persisted form data
- Independent state

### Best Practices
1. **Always extract `uuid_page`** from the markup response
2. **Store `uuid_page`** in your session/context for subsequent requests
3. **Pass `uuid_page`** in all subsequent API calls to ensure you're accessing the same instance

---

## Core API Endpoints

### 1. Get Markup - `/api/getMarkup`

Get structured form markup via `uuid_tile` or `url_tile`:

**Request:**
```javascript
POST http://localhost:7887/api/getMarkup
Content-Type: application/json

{
  "uuid_tile": "uuid-of-tile",        // Required (or url_tile)
  "url_tile": "http://...",           // Required (or uuid_tile)
  "uuid_visitor": "visitor-uuid",     // Optional
  "uuid_page": "page-uuid"            // Optional (for same instance)
}
```

**Response:**
```json
{
  "success": true,
  "markup": "form markup content...",
  "uuid_page": "page_xxx"
}
```

---

### 2. Get Nodes - `/api/getNodes`

Get structured nodes from ANX content:

**Request:**
```javascript
POST http://localhost:7887/api/getNodes
Content-Type: application/json

{
  "uuid_tile": "uuid-of-tile",        // Required (or url_tile)
  "url_tile": "http://...",           // Required (or uuid_tile)
  "anxContent": {},                   // Optional ANX content object
  "uuid_page": "page-uuid",           // Optional
  "uuid_visitor": "visitor-uuid"      // Optional
}
```

**Response:**
```json
{
  "success": true,
  "nodes": {
    "cardKey": {
      "config": {},
      "data": {},
      "children": []
    }
  }
}
```

---

### 3. Execute CLI - `/api/execute-cli`

Execute CLI commands to interact with forms:

**Request:**
```javascript
POST http://localhost:7887/api/execute-cli
Content-Type: application/json

{
  "command": "anx card_xxx set_form '{\"field\":\"value\"}'",
  "uuid_page": "page-uuid",           // Required for page-specific commands
  "uuid_visitor": "visitor-uuid",     // Optional
  "uuid_tile": "uuid-of-tile",        // Optional
  "url_tile": "http://..."            // Optional
}
```

**CLI Commands:**

| Command | Description | Example |
|---------|-------------|---------|
| `anx <cardKey> set_form '{"field":"value"}'` | Batch update fields | `anx card_xxx set_form '{"seed":123}'` |
| `anx <cardKey> set_form --replace '{...}'` | Replace all fields | `anx card_xxx set_form --replace '{"seed":123}'` |
| `anx <cardKey> get_node` | Get current node data | `anx card_xxx get_node` |
| `anx <cardKey> fill "value"` | Fill a single field | `anx card_xxx fill "hello"` |
| `anx <cardKey> tap` | Click button / trigger action | `anx card_xxx tap` |

**Response:**
```json
{
  "success": true,
  "cardKey": "card_xxx",
  "action": "set_form",
  "result": "success",
  "data": {"field1": "value1"}
}
```

---

### 4. Get Node Data - `/api/get-node-data`

Get data from a specific node:

**Request:**
```javascript
POST http://localhost:7887/api/get-node-data
Content-Type: application/json

{
  "cardKey": "card_xxx",              // Required
  "uuid_page": "page-uuid",           // Required
  "uuid_visitor": "visitor-uuid",     // Optional
  "uuid_tile": "uuid-of-tile",        // Optional
  "url_tile": "http://..."            // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

---

### 5. Update Node Data - `/api/update-node-data`

Update data for a specific node:

**Request:**
```javascript
POST http://localhost:7887/api/update-node-data
Content-Type: application/json

{
  "cardKey": "card_xxx",              // Required
  "field": "fieldName",              // Required
  "value": "new value",              // Required
  "uuid_page": "page-uuid",           // Required
  "uuid_visitor": "visitor-uuid",     // Optional
  "uuid_tile": "uuid-of-tile",        // Optional
  "url_tile": "http://..."            // Optional
}
```

**Response:**
```json
{
  "success": true,
  "nodes": {}
}
```

---

### 6. Trigger Card Key - `/api/trigger-card-key`

Trigger a card key action:

**Request:**
```javascript
POST http://localhost:7887/api/trigger-card-key
Content-Type: application/json

{
  "cardKey": "card_xxx",              // Required
  "uuid_page": "page-uuid",           // Required
  "uuid_visitor": "visitor-uuid",     // Optional
  "uuid_tile": "uuid-of-tile",        // Optional
  "url_tile": "http://...",           // Optional
  "params": {},                       // Optional additional params
  "context": {}                       // Optional context data
}
```

**Response:**
```json
{
  "success": true,
  "nodes": {}
}
```

---

## Command Logs APIs

### 7. Query Command Logs - `/api/command-logs`

Query command execution logs with filters:

**Request:**
```javascript
GET http://localhost:7887/api/command-logs?uuid_page=xxx&uuid_visitor=xxx&action=xxx&limit=100
```

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `uuid_page` | No | Filter by page UUID |
| `uuid_visitor` | No | Filter by visitor UUID |
| `uuid_tile` | No | Filter by tile UUID |
| `url_tile` | No | Filter by tile URL |
| `action` | No | Filter by action type (update-node-data, trigger-card-key, get-node-data, call-api) |
| `limit` | No | Limit results (default: 100) |

**Response:**
```json
{
  "success": true,
  "list": [
    {
      "uuid": "log-uuid",
      "uuid_page": "page-uuid",
      "uuid_visitor": "visitor-uuid",
      "uuid_tile": "tile-uuid",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "commandContent": {
        "action": "update-node-data",
        "data": {
          "cardKey": "card_xxx",
          "fieldName": "field1",
          "fieldValue": "value1"
        }
      }
    }
  ]
}
```

---

### 8. Get CLI Records - `/api/getCliRecord`

Get CLI records for a specific page:

**Request:**
```javascript
GET http://localhost:7887/api/getCliRecord?uuid_page=page_xxx
```

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `uuid_page` | **Yes** | Page UUID to get records for |

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "uuid": "record-uuid",
      "cardKey": "card_xxx",
      "action": "set_form",
      "command": "anx card_xxx set_form...",
      "commandContent": {},
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Page Management APIs

### 9. Get Pages by Tile - `/api/pages/by-tile/:uuid_tile`

Get all pages for a tile:

**Request:**
```javascript
GET http://localhost:7887/api/pages/by-tile/:uuid_tile
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid_page": "page_xxx",
      "uuid_tile": "tile_xxx",
      "title": "Page Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "data": {}
    }
  ]
}
```

---

### 10. Get Pages by URL Tile - `/api/pages/by-url-tile`

Get all pages for a URL tile:

**Request:**
```javascript
GET http://localhost:7887/api/pages/by-url-tile?url_tile=http://...&uuid_visitor=xxx
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid_page": "page_xxx",
      "url_tile": "http://...",
      "uuid_visitor": "visitor-uuid",
      "title": "Page Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "data": {}
    }
  ]
}
```

---

## Complete Workflow Example

### Step 1: Get Markup and Extract uuid_page

```javascript
const response = await fetch('http://localhost:7887/api/getMarkup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uuid_tile: '505619db-c096-46b8-8a1d-0c7754fc9219',
    uuid_visitor: '8393667a-7a2a-48f3-bc2c-c7a54b41292d'
  })
});

const result = await response.json();
const { markup, uuid_page } = result;

// Store uuid_page for subsequent requests!
console.log('Page ID to remember:', uuid_page);
```

### Step 2: Use uuid_page for Same Instance

```javascript
// Access the SAME page instance
const samePageResponse = await fetch('http://localhost:7887/api/getMarkup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uuid_tile: '505619db-c096-46b8-8a1d-0c7754fc9219',
    uuid_visitor: '8393667a-7a2a-48f3-bc2c-c7a54b41292d',
    uuid_page: 'page_xxx'  // Use the stored uuid_page
  })
});
```

### Step 3: Execute CLI Commands

```javascript
// Fill form fields using CLI
await fetch('http://localhost:7887/api/execute-cli', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'anx card_1776755731076_8546 set_form \'{"seed":99999,"system_prompt":"Custom prompt"}\'',
    uuid_page: 'page_xxx'
  })
});

// Or use Node APIs
await fetch('http://localhost:7887/api/update-node-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cardKey: 'card_xxx',
    field: 'seed',
    value: 99999,
    uuid_page: 'page_xxx'
  })
});
```

### Step 4: Query Command Logs

```javascript
// Get all logs for a page
const logsResponse = await fetch('http://localhost:7887/api/command-logs?uuid_page=page_xxx');
const logsData = await logsResponse.json();
console.log('Command logs:', logsData.list);

// Get CLI records specifically
const cliResponse = await fetch('http://localhost:7887/api/getCliRecord?uuid_page=page_xxx');
const cliData = await cliResponse.json();
console.log('CLI records:', cliData.logs);
```

---

## Why uuid_page Matters

```javascript
// WITHOUT uuid_page - each call creates a NEW page instance
const response1 = await getMarkup(uuid);  // page_xxx_1
const response2 = await getMarkup(uuid);  // page_xxx_2 (DIFFERENT!)

// WITH uuid_page - same instance every time
const { uuid_page } = await getMarkup(uuid);  // page_xxx
const samePage = await getMarkup(uuid, null, uuid_page);  // SAME page!
```

---

## Markup Tag Reference

| Tag | Component Type | Interaction Method |
|-----|----------------|-------------------|
| `<x input>` | Text input | `set_form` or `update-node-data` |
| `<x textarea>` | Multi-line text | `set_form` or `update-node-data` |
| `<x options>` | Dropdown | `set_form` or `update-node-data` |
| `<x checkbox>` | Multi-select | `set_form` |
| `<x file>` | File upload | Via file upload API |
| `<x button>` | Button | `tap` or `trigger-card-key` |
| `<x form>` | Form container | Parent container, use its cardKey |

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

### Success Response
```json
{
  "success": true,
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```
