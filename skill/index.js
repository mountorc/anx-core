const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

class ANXCoreSkill {
  constructor() {
    this.usagePath = path.join(__dirname, 'usage');
    this.backendUrl = 'http://localhost:7887';
  }

  // 读取使用说明文件
  async readUsageFile(filename) {
    try {
      const filePath = path.join(this.usagePath, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      return content;
    } catch (error) {
      return `Error reading usage file ${filename}: ${error.message}`;
    }
  }

  // 获取所有使用说明文件
  async getUsageFiles() {
    try {
      const files = fs.readdirSync(this.usagePath);
      return files.filter(file => file.endsWith('.md'));
    } catch (error) {
      return [];
    }
  }

  // 转换ANX到Markdown
  async convertAnxToMarkdown(anxContent) {
    try {
      const response = await fetch(`${this.backendUrl}/api/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ anxContent })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.markdown;
    } catch (error) {
      return `Error converting ANX to Markdown: ${error.message}`;
    }
  }

  // 转换ANX到节点结构
  async convertAnxToNodes(anxContent) {
    try {
      const response = await fetch(`${this.backendUrl}/api/convert-to-nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ anxContent })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.nodes;
    } catch (error) {
      return `Error converting ANX to nodes: ${error.message}`;
    }
  }

  // 执行CLI命令
  async executeCliCommand(command) {
    try {
      const response = await fetch(`${this.backendUrl}/api/execute-cli`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      return `Error executing CLI command: ${error.message}`;
    }
  }

  // 生成节点可视化
  async generateNodeVisualization(node) {
    try {
      const response = await fetch(`${this.backendUrl}/api/visualize-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ node })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      return `Error generating node visualization: ${error.message}`;
    }
  }

  // 获取CLI命令列表
  async getCliCommands() {
    try {
      const response = await fetch(`${this.backendUrl}/api/cli/commands`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      return `Error getting CLI commands: ${error.message}`;
    }
  }

  // Skill interface methods
  async execute(command, args) {
    switch (command) {
      case 'getUsageFiles':
        return await this.getUsageFiles();
      case 'readUsageFile':
        return await this.readUsageFile(args.filename);
      case 'convertAnxToMarkdown':
        return await this.convertAnxToMarkdown(args.anxContent);
      case 'convertAnxToNodes':
        return await this.convertAnxToNodes(args.anxContent);
      case 'executeCliCommand':
        return await this.executeCliCommand(args.command);
      case 'generateNodeVisualization':
        return await this.generateNodeVisualization(args.node);
      case 'getCliCommands':
        return await this.getCliCommands();
      default:
        return 'Command not supported. Available commands: getUsageFiles, readUsageFile, convertAnxToMarkdown, convertAnxToNodes, executeCliCommand, generateNodeVisualization, getCliCommands';
    }
  }

  // Health check
  async healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Get skill information
  async getInfo() {
    return {
      name: 'ANX Core Skill',
      version: '1.0.0',
      description: 'Provides API capabilities for ANX markup output and CLI execution',
      commands: [
        'getUsageFiles - Get all usage documentation files',
        'readUsageFile - Read a specific usage documentation file',
        'convertAnxToMarkdown - Convert ANX content to Markdown',
        'convertAnxToNodes - Convert ANX content to nodes structure',
        'executeCliCommand - Execute CLI commands',
        'generateNodeVisualization - Generate node visualization',
        'getCliCommands - Get list of available CLI commands'
      ],
      backendUrl: this.backendUrl
    };
  }
}

// Export the skill
module.exports = ANXCoreSkill;

// For direct execution
if (require.main === module) {
  const skill = new ANXCoreSkill();
  skill.healthCheck().then(console.log);
  skill.getInfo().then(console.log);
  skill.getUsageFiles().then(console.log);
}