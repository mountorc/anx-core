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
        description: 'Convert ANX content to Markup format by uuid_tile',
        parameters: {
          uuid_tile: { type: 'string', description: 'UUID of the ANX tile', required: true }
        }
      },
      {
        name: 'executeCliCommand',
        description: 'Execute ANX CLI commands',
        parameters: {
          command: { type: 'string', required: true }
        }
      },

    ];
  }

  // ==================== Core Methods ====================

  /**
   * Convert ANX content to Markup
   */
  async convertAnxToMarkup(args = {}) {
    const { uuid_tile } = args;
    try {
      const payload = { uuid_tile };
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



  // ==================== OpenClaw Interface ====================

  /**
   * Main execute method - OpenClaw standard interface
   */
  async execute(capability, args = {}) {
    switch (capability) {
      case 'convertAnxToMarkup':
        return await this.convertAnxToMarkup(args);
      case 'executeCliCommand':
        return await this.executeCliCommand(args);
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
      const response = await fetch(`${this.config.backendUrl}/api/convert`);
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
