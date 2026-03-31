const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

/**
 * ANX Core Skill
 * OpenClaw compatible skill for ANX markup output and CLI execution
 */
class ANXCoreSkill {
  constructor(config = {}) {
    this.config = {
      backendUrl: config.backendUrl || 'http://localhost:7887',
      ...config
    };
    this.usagePath = path.join(__dirname, 'usage');
  }

  /**
   * Get skill metadata
   */
  getMetadata() {
    return {
      name: 'anx-core-skill',
      version: '1.0.0',
      description: 'ANX Core Skill - Provides API capabilities for ANX markup output and CLI execution',
      author: 'ANX Team'
    };
  }

  /**
   * Get skill capabilities
   */
  getCapabilities() {
    return [
      {
        name: 'convertAnxToMarkup',
        description: 'Convert ANX content to Markup format',
        parameters: {
          anxContent: { type: 'object', optional: true },
          uuid_tile: { type: 'string', optional: true }
        }
      },
      {
        name: 'convertAnxToNodes',
        description: 'Convert ANX content to nodes structure',
        parameters: {
          anxContent: { type: 'object', optional: true },
          uuid_tile: { type: 'string', optional: true }
        }
      },
      {
        name: 'executeCliCommand',
        description: 'Execute ANX CLI commands',
        parameters: {
          command: { type: 'string', required: true }
        }
      },
      {
        name: 'generateNodeVisualization',
        description: 'Generate node visualization HTML and CSS',
        parameters: {
          node: { type: 'object', required: true }
        }
      },
      {
        name: 'getCliCommands',
        description: 'Get list of available CLI commands'
      },
      {
        name: 'getUsageFiles',
        description: 'Get all usage documentation files'
      },
      {
        name: 'readUsageFile',
        description: 'Read a specific usage documentation file',
        parameters: {
          filename: { type: 'string', required: true }
        }
      }
    ];
  }

  // ==================== Core Methods ====================

  /**
   * Convert ANX content to Markup
   */
  async convertAnxToMarkup(args = {}) {
    const { anxContent, uuid_tile } = args;
    try {
      const payload = anxContent ? { anxContent } : { uuid_tile };
      const response = await fetch(`${this.config.backendUrl}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, data: result.markup };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert ANX content to nodes structure
   */
  async convertAnxToNodes(args = {}) {
    const { anxContent, uuid_tile } = args;
    try {
      const payload = anxContent ? { anxContent } : { uuid_tile };
      const response = await fetch(`${this.config.backendUrl}/api/convert-to-nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, data: result.nodes };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute CLI command
   */
  async executeCliCommand(args = {}) {
    const { command } = args;
    try {
      const response = await fetch(`${this.config.backendUrl}/api/execute-cli`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate node visualization
   */
  async generateNodeVisualization(args = {}) {
    const { node } = args;
    try {
      const response = await fetch(`${this.config.backendUrl}/api/visualize-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get CLI commands list
   */
  async getCliCommands() {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/cli/commands`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get usage files
   */
  async getUsageFiles() {
    try {
      const files = fs.readdirSync(this.usagePath);
      return { success: true, data: files.filter(file => file.endsWith('.md')) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Read usage file
   */
  async readUsageFile(args = {}) {
    const { filename } = args;
    try {
      const filePath = path.join(this.usagePath, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== OpenClaw Interface ====================

  /**
   * Main execute method - OpenClaw standard interface
   */
  async execute(capability, args = {}) {
    switch (capability) {
      case 'convertAnxToMarkup':
        return await this.convertAnxToMarkup(args);
      case 'convertAnxToNodes':
        return await this.convertAnxToNodes(args);
      case 'executeCliCommand':
        return await this.executeCliCommand(args);
      case 'generateNodeVisualization':
        return await this.generateNodeVisualization(args);
      case 'getCliCommands':
        return await this.getCliCommands();
      case 'getUsageFiles':
        return await this.getUsageFiles();
      case 'readUsageFile':
        return await this.readUsageFile(args);
      default:
        return { 
          success: false, 
          error: `Capability '${capability}' not found. Available: ${this.getCapabilities().map(c => c.name).join(', ')}` 
        };
    }
  }

  /**
   * Health check - OpenClaw standard
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/cli/commands`);
      return { 
        success: true, 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        backend: response.ok ? 'connected' : 'disconnected'
      };
    } catch (error) {
      return { 
        success: false, 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message 
      };
    }
  }
}

// Export for OpenClaw
module.exports = ANXCoreSkill;

// Default export
module.exports.default = ANXCoreSkill;
