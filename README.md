# ANX Core

ANX Core is a core library for processing ANX (ANnotation eXtended) format, supporting the conversion of ANX configuration to visual UI components and Markdown format.

## Project Introduction

ANX Core provides a complete toolchain for:
- Converting ANX configuration to node structure
- Generating visual UI components
- Converting to Markdown format
- Supporting CLI command operations
- Providing front-end and back-end example implementations

## Project Structure

```
anx-core/
├── core/                    # Core functionality modules
│   ├── kinds/              # Various component type handlers
│   │   ├── board.js        # Board component
│   │   ├── box.js          # Box component
│   │   ├── form.js         # Form component
│   │   ├── list.js         # List component
│   │   ├── navigation.js   # Navigation component
│   │   ├── options.js      # Options component
│   │   ├── table.js        # Table component
│   │   └── file.js         # File component
│   ├── utils/              # Utility functions
│   │   ├── dataset.js      # Dataset processing
│   │   ├── template.js     # Template processing
│   │   └── trigger-and-tap.js  # Event processing
│   ├── cli/                # CLI command line tools
│   │   ├── cli.js          # CLI implementation
│   │   ├── commands.json   # Command configuration
│   │   └── index.js        # CLI entry
│   ├── anx-to-markup.js    # ANX to Markup
│   └── index.js            # Core entry
├── view/                    # View rendering module
│   ├── kinds/              # View component renderers
│   │   ├── button.js       # Button rendering
│   │   ├── form.js         # Form rendering
│   │   ├── input.js        # Input box rendering
│   │   └── ...             # Other renderers
│   ├── utils/              # View utilities
│   ├── index.js            # View entry
│   └── renderers.js        # Renderer registration
├── examples/                # Example projects
│   ├── backend/            # Backend example (Express)
│   │   ├── server.js       # Server entry
│   │   └── package.json
│   └── frontend/           # Frontend example (Vue 3)
│       ├── src/
│       │   ├── views/
│       │   │   └── Home.vue
│       │   └── utils/
│       └── package.json
├── hub/                     # Predefined configuration library
│   ├── 505619db-c096-46b8-8a1d-0c7754fc9219.json  # Clothing image processing
│   └── ...
├── skill/                   # Skill module
│   ├── index.js
│   └── SKILL.md
└── docs-*/                  # Documentation directories
```

## Core Features

### 1. ANX Format Conversion

Convert ANX JSON configuration to node structure:

```javascript
const { anxToNodes } = require('./core');

const anxContent = {
  kind: "form",
  title: "User Form",
  kinds: [
    {
      kind: "input",
      nick: "username",
      title: "Username"
    },
    {
      kind: "button",
      title: "Submit",
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

### 2. Visual Rendering

Generate interactive HTML visual components:

```javascript
const { generateNodeVisualization } = require('./view');

const html = generateNodeVisualization(node);
```

### 3. CLI Command Support

Support command line operations:

```bash
# Execute CLI command
node cli.js --command="set form clothing_image_processing"
```

## Supported Component Types

| Component Type | Description | Features |
|---------------|-------------|----------|
| `box` | Box container | Supports tapSet events |
| `board` | Board layout | Supports multiple sub-components |
| `form` | Form | Supports input validation, submission |
| `table` | Table | Supports data display |
| `list` | List | Supports dynamic data |
| `input` | Input box | Supports multiple types |
| `textarea` | Text area | Supports multi-line input |
| `button` | Button | Supports tapSet events |
| `options` | Dropdown options | Supports datasets |
| `checkbox` | Checkbox | Supports multiple selection |
| `file` | File upload | Supports image preview |
| `navigation` | Navigation | Supports page navigation |

## Event System (tapSet)

Supported event types:

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

## Quick Start

### Install Dependencies

```bash
# Install core dependencies
npm install

# Install backend dependencies
cd examples/backend && npm install

# Install frontend dependencies
cd examples/frontend && npm install
```

### Start Services

```bash
# Start backend service (port 7887)
cd examples/backend
npm run dev

# Start frontend service (port 17887)
cd examples/frontend
npm run dev
```

Visit http://localhost:17887/ to view examples.

### Usage Examples

#### 1. Basic Form

```json
{
  "kind": "form",
  "title": "User Registration",
  "kinds": [
    {
      "kind": "input",
      "nick": "username",
      "title": "Username",
      "placeholder": "Please enter username"
    },
    {
      "kind": "input",
      "nick": "email",
      "title": "Email",
      "type": "email"
    },
    {
      "kind": "button",
      "title": "Submit",
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

#### 2. Table with Dataset

```json
{
  "kind": "table",
  "title": "Product List",
  "titles": [
    { "nick": "name", "title": "Product Name" },
    { "nick": "price", "title": "Price" }
  ],
  "dataset": {
    "url_dataset": "http://localhost:4665/dataset"
  }
}
```

#### 3. File Upload

```json
{
  "kind": "file",
  "nick": "images",
  "title": "Upload Images",
  "accept": "image/*",
  "multiple": true,
  "maxCount": 8
}
```

## API Interfaces

### Backend API

| Interface | Method | Description |
|-----------|--------|-------------|
| `/api/convert` | POST | ANX to Markup |
| `/api/convert-to-nodes` | POST | ANX to node structure |
| `/api/visualize-node` | POST | Generate node visualization |
| `/api/update-node-data` | POST | Update node data |
| `/api/execute-cli` | POST | Execute CLI command |
| `/api/cli/commands` | GET | Get CLI command list |
| `/api/cli/logs` | GET | Get CLI logs |
| `/api/hub` | GET | Get Hub list |
| `/api/hub/:uuid` | GET | Get Hub details |

### Request Example

```bash
# Convert ANX to Markup
curl -X POST http://localhost:7887/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "anxContent": {
      "kind": "box",
      "title": "Test"
    }
  }'
```

## Configuration Notes

### Hub Configuration

The Hub directory stores predefined ANX configurations, each configuration file contains:

```json
{
  "uuid": "505619db-c096-46b8-8a1d-0c7754fc9219",
  "name": "Clothing Image Processing",
  "anxContent": {
    // ANX configuration
  }
}
```

### Button Color Rules

- **Blue (#409eff)**: Button contains `tapSet` configuration, can trigger requests
- **Green (#28a745)**: Button has no `tapSet` configuration, display only

## Development Guide

### Add New Component Type

1. Create component handler in `core/kinds/`
2. Create view renderer in `view/kinds/`
3. Register renderer in `view/renderers.js`

### Add CLI Command

Add command definition in `core/cli/commands.json`:

```json
{
  "commands": [
    {
      "name": "my-command",
      "description": "Command description",
      "usage": "my-command [args]",
      "example": "my-command arg1 arg2"
    }
  ]
}
```

## Technology Stack

- **Backend**: Node.js, Express
- **Frontend**: Vue 3, Vite
- **Core**: Native JavaScript

## License

MIT License

## Contribution

Welcome to submit Issues and Pull Requests.

## Contact

For questions, please contact through GitHub Issues.