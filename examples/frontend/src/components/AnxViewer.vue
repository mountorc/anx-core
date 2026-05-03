<template>
  <div class="anx-viewer">
    <div class="converter-content">
      <div class="input-section">
        <h2>ANX Config</h2>
        <textarea 
          v-model="anxInput" 
          placeholder="Enter ANX format content here..."
          @input="debouncedConvertAnxToMarkup"
        ></textarea>
      </div>

      <div class="json-section">
        <h2>Core Nodes</h2>
        <div class="json-viewer-container">
          <JsonViewer :data="nodesStructure" :default-expand="false" theme="light" />
        </div>
      </div>

      <div class="output-section">
        <div class="section-header">
          <h2>Markup Output</h2>
          <div class="view-toggle">
            <button 
              :class="['toggle-btn', { active: outputMode === 'markup' }]"
              @click="outputMode = 'markup'"
            >Markup</button>
            <button 
              :class="['toggle-btn', { active: outputMode === 'markdown' }]"
              @click="outputMode = 'markdown'"
            >Markdown</button>
          </div>
        </div>
        <div class="markup-container">
          <div v-if="outputMode === 'markdown'" class="markup-output" v-html="markupOutput"></div>
          <pre v-else class="raw-output">{{ rawMarkupOutput }}</pre>
        </div>

        <div class="cli-section">
          <h3>CLI Execution</h3>

          <div class="cli-history">
            <div class="history-header">
              <span>历史记录 ({{ cliHistory.length }})</span>
              <button class="clear-history-btn" @click="cliHistory = []" v-if="cliHistory.length > 0">清除</button>
            </div>
            <div class="history-list" v-if="cliHistory.length > 0">
              <div 
                v-for="(item, index) in cliHistory" 
                :key="index" 
                class="history-item"
                @click="cliCommand = item.command"
              >
                <span class="history-cardKey">{{ item.cardKey }}</span>
                <span class="history-action">{{ item.action }}</span>
                <span class="history-command">{{ item.command }}</span>
                <span class="history-time">{{ formatTime(item.timestamp) }}</span>
              </div>
            </div>
            <div class="history-empty" v-else>
              暂无执行记录
            </div>
          </div>

          <div class="cli-input-container">
            <input 
              v-model="cliCommand" 
              placeholder="Enter CLI command here..."
              @keyup.enter="executeCliCommand"
            />
            <button @click="executeCliCommand">Execute</button>
            <button @click="showCommandsList">Commands</button>
          </div>

          <div class="cli-output" v-if="cliOutput">
            <h4>Output:</h4>
            <pre>{{ cliOutput }}</pre>
          </div>
        </div>
      </div>

      <div class="visual-section">
        <h2>ANXView (Web Component)</h2>
        <anx-view 
          :nodes-structure="JSON.stringify(nodesStructure)"
          :visualization-html="visualizationHTML"
        ></anx-view>
      </div>
    </div>

    <div class="modal" v-if="showCommandsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>CLI Commands List</h3>
          <button @click="showCommandsModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-for="category in cliCommands" :key="category.category" class="command-category">
            <h4>{{ category.category }}</h4>
            <ul class="command-list">
              <li v-for="command in category.commands" :key="command.name" class="command-item">
                <div class="command-name">{{ command.name }}</div>
                <div class="command-description">{{ command.description }}</div>
                <div class="command-usage">{{ command.usage }}</div>
                <div class="command-example">{{ command.example }}</div>
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCommandsModal = false">Close</button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showLogsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>System Logs</h3>
          <div class="modal-header-actions">
            <button @click="refreshLogs" class="refresh-btn">↻ Refresh</button>
            <button @click="showLogsModal = false" class="close-btn">×</button>
          </div>
        </div>
        <div class="modal-body">
          <div v-if="allLogs.length === 0" class="no-logs">
            No logs available.
          </div>
          <div v-else class="logs-list">
            <div v-for="(log, index) in allLogs" :key="index" class="log-item" :class="[log.status, log.type]">
              <div class="log-header">
                <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
                <span class="log-type">{{ log.type.toUpperCase() }}</span>
                <span class="log-status">{{ (log.status || 'success').toUpperCase() }}</span>
              </div>
              <div v-if="log.command" class="log-command">{{ log.command }}</div>
              <div v-else-if="log.message" class="log-message">{{ log.message }}</div>
              <div v-if="log.response" class="log-response">
                <pre>{{ JSON.stringify(log.response, null, 2) }}</pre>
              </div>
              <div v-if="log.details" class="log-details">
                <strong>Details:</strong>
                <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
              </div>
              <div v-if="log.error" class="log-error">
                <strong>Error:</strong> {{ log.error }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="refreshLogs">Refresh</button>
          <button @click="showLogsModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JsonViewer from './JsonViewer.vue';

export default {
  name: 'AnxViewer',
  components: {
    JsonViewer
  },
  props: {
    urlTile: {
      type: String,
      default: ''
    },
    uuidTile: {
      type: String,
      default: ''
    },
    uuidVisitor: {
      type: String,
      default: ''
    },
    pageList: {
      type: Array,
      default: () => []
    },
    currentUuidPage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      anxInput: '',
      nodesStructure: null,
      jsonStructure: '',
      markupOutput: '',
      rawMarkupOutput: '',
      outputMode: 'markup',
      cliCommand: '',
      cliOutput: '',
      cliHistory: [],
      showCommandsModal: false,
      showLogsModal: false,
      cliCommands: [],
      cliLogs: [],
      allLogs: [],
      visualizationHTML: '',
      visualizationCSS: '',
      debounceTimer: null
    };
  },
  watch: {
    urlTile: {
      handler() {
        this.initializeWithTile();
      },
      immediate: true
    },
    uuidTile: {
      handler() {
        this.initializeWithTile();
      },
      immediate: true
    },
    currentUuidPage: {
      handler() {
        this.convertAnxToMarkup();
      }
    }
  },
  methods: {
    async initializeWithTile() {
      if (!this.urlTile && !this.uuidTile) {
        return;
      }

      try {
        const uuidPage = await this.getUuidPage();
        await this.loadTileContent(uuidPage);
        await this.convertAnxToMarkup(uuidPage);
      } catch (error) {
        console.error('Error initializing tile:', error);
      }
    },

    async getUuidPage() {
      if (this.urlTile) {
        try {
          const url = new URL('http://localhost:7887/api/pages/by-url-tile');
          url.searchParams.set('url_tile', this.urlTile);
          if (this.uuidVisitor) {
            url.searchParams.set('uuid_visitor', this.uuidVisitor);
          }
          const response = await fetch(url.toString());
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              this.$emit('update:currentUuidPage', pages[0].uuid_page);
              this.$emit('update:pageList', pages);
              return pages[0].uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list by url_tile:', error);
        }
      } else if (this.uuidTile) {
        try {
          const response = await fetch(`http://localhost:7887/api/pages/by-tile/${this.uuidTile}`);
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              this.$emit('update:currentUuidPage', pages[0].uuid_page);
              this.$emit('update:pageList', pages);
              return pages[0].uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list:', error);
        }
      }

      const newUuid = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.$emit('update:currentUuidPage', newUuid);
      return newUuid;
    },

    async loadTileContent(uuidPage) {
      try {
        const response = await fetch('http://localhost:7887/api/getConfig', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uuid_page: uuidPage,
            url_tile: this.urlTile,
            uuid_tile: this.uuidTile
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.config) {
            this.anxInput = JSON.stringify(result.config, null, 2);
          } else {
            console.error('Error loading config:', result.error || 'Config not found');
          }
        } else {
          console.error('Error loading config: HTTP error', response.status);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    },

    debouncedConvertAnxToMarkup() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.convertAnxToMarkup();
      }, 300);
    },

    async convertAnxToMarkup(uuidPage) {
      try {
        const requestParams = {};
        if (this.urlTile) {
          requestParams.url_tile = this.urlTile;
        } else if (this.uuidTile) {
          try {
            const anxContent = JSON.parse(this.anxInput);
            requestParams.anxContent = anxContent;
          } catch (e) {
            console.error('Error parsing anxInput:', e);
            return;
          }
        }

        if (uuidPage) {
          requestParams.uuid_page = uuidPage;
        } else if (this.currentUuidPage) {
          requestParams.uuid_page = this.currentUuidPage;
        }
        if (this.uuidVisitor) {
          requestParams.uuid_visitor = this.uuidVisitor;
        }

        const nodesResponse = await fetch('http://localhost:7887/api/getNodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestParams)
        });

        const nodesResult = await nodesResponse.json();
        this.jsonStructure = JSON.stringify(nodesResult.nodes, null, 2);
        this.nodesStructure = nodesResult.nodes;

        const markupParams = {
          uuid_page: requestParams.uuid_page,
          url_tile: requestParams.url_tile,
          uuid_tile: this.uuidTile,
          uuid_visitor: requestParams.uuid_visitor
        };

        const markupResponse = await fetch('http://localhost:7887/api/getMarkup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(markupParams)
        });

        const markupResult = await markupResponse.json();
        if (markupResult.success) {
          this.rawMarkupOutput = markupResult.markup;
          this.markupOutput = this.convertMarkupToHtml(markupResult.markup);
          if (markupResult.nodes) {
            this.nodesStructure = markupResult.nodes;
            this.jsonStructure = JSON.stringify(markupResult.nodes, null, 2);
          }
          this.generateNodeVisualization(this.nodesStructure);
        } else {
          console.error('Error getting markup:', markupResult.error);
          this.rawMarkupOutput = 'Error converting ANX to Markup. Please check your input.';
          this.markupOutput = '<p>Error converting ANX to Markup. Please check your input.</p>';
        }
      } catch (error) {
        console.error('Error converting ANX:', error);
        this.rawMarkupOutput = 'Error converting ANX to Markup. Please check your input.';
        this.markupOutput = '<p>Error converting ANX to Markup. Please check your input.</p>';
        this.jsonStructure = 'Invalid JSON. Please check your input.';
      }
    },

    async generateNodeVisualization(node) {
      try {
        console.log('[AnxViewer] generateNodeVisualization called with node:', node ? `kind=${node.config?.kind}` : 'null');
        
        if (!node || !node.config || !node.config.kind) {
          console.error('[AnxViewer] Invalid node structure for visualization');
          this.visualizationHTML = '<div class="anx-error">Invalid node structure</div>';
          return;
        }

        const response = await fetch('http://localhost:7887/api/visualize-node', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ node })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('[AnxViewer] visualize-node API response received, html length:', result.html?.length || 0);
        
        this.visualizationHTML = result.html;
        this.visualizationCSS = result.css;

        this.$nextTick(() => {
          this.injectVisualizationCSS(result.css);
          this.injectVisualizationJS();
          this.executeVisualizationScripts();
        });
      } catch (error) {
        console.error('Error generating node visualization:', error);
        this.visualizationHTML = '<div class="anx-error">Error generating node visualization</div>';
      }
    },

    executeVisualizationScripts() {
      const container = this.$refs.visualizationContainer;
      if (container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          newScript.textContent = script.textContent;
          document.head.appendChild(newScript);
        });
      }
    },

    injectVisualizationJS() {
      const oldScript = document.getElementById('visualization-dynamic-script');
      if (oldScript) {
        oldScript.remove();
      }
      console.log('Visualization JS injected through ANXView component');
    },

    injectVisualizationCSS(css) {
      if (!css) return;

      const oldStyle = document.getElementById('visualization-dynamic-style');
      if (oldStyle) {
        oldStyle.remove();
      }

      const style = document.createElement('style');
      style.id = 'visualization-dynamic-style';
      style.textContent = css;
      document.head.appendChild(style);
    },

    async handleVisualizationMessage(event) {
      if (event.data && event.data.type === 'UPDATE_NODE_DATA') {
        const { cardKey, field, value, log } = event.data;
        console.log('Node data changed from visualization:', { cardKey, field, value });

        if (log) {
          this.addViewLog({
            timestamp: log.timestamp,
            action: log.action,
            details: log.details,
            message: `View field updated: ${field} = ${value}`
          });
        } else {
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'field_update',
            details: { cardKey, field, value },
            message: `View field updated: ${field} = ${value}`
          });
        }

        try {
          const requestData = { cardKey, field, value };
          if (this.uuidVisitor) {
            requestData.uuid_visitor = this.uuidVisitor;
          }
          if (this.currentUuidPage) {
            requestData.uuid_page = this.currentUuidPage;
          }
          if (this.urlTile) {
            requestData.url_tile = this.urlTile;
          } else if (this.uuidTile) {
            requestData.uuid_tile = this.uuidTile;
          }

          const response = await fetch('http://localhost:7887/api/update-node-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          });

          if (!response.ok) {
            throw new Error('Failed to update node data');
          }

          const result = await response.json();
          console.log('Node data updated:', result);

          if (result.nodes) {
            this.jsonStructure = JSON.stringify(result.nodes, null, 2);
            this.nodesStructure = result.nodes;
            await this.generateNodeVisualization(this.nodesStructure);
            this.convertAnxToMarkup();
          }
        } catch (error) {
          console.error('Error updating node data:', error);
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'field_update_error',
            details: { cardKey, field, value, error: error.message },
            message: `Error updating view field: ${field}`,
            status: 'error'
          });
        }
      } else if (event.data && event.data.type === 'TRIGGER_CARD_KEY') {
        const { cardKey } = event.data;
        console.log('Trigger card key from visualization:', cardKey);

        try {
          const requestData = { cardKey };
          if (this.uuidVisitor) {
            requestData.uuid_visitor = this.uuidVisitor;
          }
          if (this.currentUuidPage) {
            requestData.uuid_page = this.currentUuidPage;
          }
          if (this.urlTile) {
            requestData.url_tile = this.urlTile;
          } else if (this.uuidTile) {
            requestData.uuid_tile = this.uuidTile;
          }

          const response = await fetch('http://localhost:7887/api/trigger-card-key', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          });

          if (!response.ok) {
            throw new Error('Failed to trigger card key');
          }

          const result = await response.json();
          console.log('Card key triggered:', result);

          if (result.nodes) {
            this.jsonStructure = JSON.stringify(result.nodes, null, 2);
            this.nodesStructure = result.nodes;
            await this.generateNodeVisualization(this.nodesStructure);
          }
        } catch (error) {
          console.error('Error triggering card key:', error);
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'trigger_card_key_error',
            details: { cardKey: cardKey, error: error.message },
            message: `Error triggering card key: ${cardKey}`,
            status: 'error'
          });
        }
      } else if (event.data && event.data.type === 'HANDLE_TAP_SET') {
        const { cardKey, tapSet } = event.data;
        console.log('Handle tap set from visualization:', { cardKey, tapSet });

        this.addViewLog({
          timestamp: new Date().toISOString(),
          action: 'handle_tap_set',
          details: { cardKey: cardKey, tapSet: tapSet },
          message: `Tap set handled for card key: ${cardKey}`
        });

        try {
          const requestData = { cardKey, tapSet };
          if (this.uuidVisitor) {
            requestData.uuid_visitor = this.uuidVisitor;
          }
          if (this.currentUuidPage) {
            requestData.uuid_page = this.currentUuidPage;
          }
          if (this.urlTile) {
            requestData.url_tile = this.urlTile;
          } else if (this.uuidTile) {
            requestData.uuid_tile = this.uuidTile;
          }

          const response = await fetch('http://localhost:7887/api/trigger-card-key', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          });

          if (!response.ok) {
            throw new Error('Failed to handle tap set');
          }

          const result = await response.json();
          console.log('Tap set handled:', result);

          if (result.nodes) {
            this.jsonStructure = JSON.stringify(result.nodes, null, 2);
            this.nodesStructure = result.nodes;
            await this.generateNodeVisualization(this.nodesStructure);
          }
        } catch (error) {
          console.error('Error handling tap set:', error);
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'handle_tap_set_error',
            details: { cardKey: cardKey, tapSet: tapSet, error: error.message },
            message: `Error handling tap set for card key: ${cardKey}`,
            status: 'error'
          });
        }
      }
    },

    convertMarkupToHtml(markup) {
      return markup
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/```[\s\S]*?```/gim, (match) => {
          return `<pre><code>${match.replace(/```/g, '')}</code></pre>`;
        })
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/^(.+)$/gim, '<p>$1</p>')
        .replace(/<p><\/p>/gim, '');
    },

    async executeCliCommand() {
      if (!this.cliCommand) {
        this.cliOutput = 'Please enter a CLI command.';
        return;
      }

      try {
        const requestData = { command: this.cliCommand };
        if (this.uuidVisitor) {
          requestData.uuid_visitor = this.uuidVisitor;
        }
        if (this.currentUuidPage) {
          requestData.uuid_page = this.currentUuidPage;
        }
        if (this.urlTile) {
          requestData.url_tile = this.urlTile;
        } else if (this.uuidTile) {
          requestData.uuid_tile = this.uuidTile;
        }

        const response = await fetch('http://localhost:7887/api/execute-cli', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        this.cliOutput = `cardKey: ${result.cardKey}\naction: ${result.action}\nresult: ${JSON.stringify(result.result, null, 2)}`;

        this.cliHistory.unshift({
          command: this.cliCommand,
          timestamp: new Date().toISOString(),
          cardKey: result.cardKey,
          action: result.action
        });

        if (this.cliHistory.length > 50) {
          this.cliHistory = this.cliHistory.slice(0, 50);
        }

        await this.refreshNodesStructure();
      } catch (error) {
        console.error('Error executing CLI command:', error);
        this.cliOutput = 'Error executing CLI command. Please check your input.';
      }
    },

    async refreshNodesStructure() {
      try {
        const anxContent = JSON.parse(this.anxInput);

        const nodesResponse = await fetch('http://localhost:7887/api/getNodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });

        const nodesResult = await nodesResponse.json();
        this.jsonStructure = JSON.stringify(nodesResult.nodes, null, 2);
        this.nodesStructure = nodesResult.nodes;

        await this.generateNodeVisualization(this.nodesStructure);
        await this.updateMarkupOutput();
      } catch (error) {
        console.error('Error refreshing nodes structure:', error);
        this.jsonStructure = 'Error refreshing nodes structure. Please check your input.';
      }
    },

    async showCommandsList() {
      try {
        const response = await fetch('http://localhost:7887/api/cli/commands');

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        this.cliCommands = data.commands;
        this.showCommandsModal = true;
      } catch (error) {
        console.error('Error fetching CLI commands:', error);
        alert('Failed to load CLI commands. Please try again.');
      }
    },

    async showCliLogs() {
      try {
        await this.refreshLogs();
        this.showLogsModal = true;
      } catch (error) {
        console.error('Error showing logs:', error);
        alert('Failed to load logs. Please try again.');
      }
    },

    async refreshLogs() {
      try {
        const cliResponse = await fetch('http://localhost:7887/api/cli/logs');
        const cliData = await cliResponse.json();
        const cliLogs = cliData.logs || [];

        const formattedCLILogs = cliLogs.map(log => ({
          ...log,
          type: 'cli'
        }));

        const viewLogs = JSON.parse(localStorage.getItem('viewLogs') || '[]');

        this.allLogs = [...formattedCLILogs, ...viewLogs].sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
      } catch (error) {
        console.error('Error refreshing logs:', error);
      }
    },

    addViewLog(log) {
      const viewLogs = JSON.parse(localStorage.getItem('viewLogs') || '[]');

      viewLogs.unshift({
        ...log,
        type: 'view',
        status: 'success'
      });

      const limitedLogs = viewLogs.slice(0, 100);

      localStorage.setItem('viewLogs', JSON.stringify(limitedLogs));

      if (this.showLogsModal) {
        this.refreshLogs();
      }
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    },

    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    },

    updateMarkupOutput() {
    }
  },

  mounted() {
    window.addEventListener('message', this.handleVisualizationMessage);
  },

  beforeUnmount() {
    window.removeEventListener('message', this.handleVisualizationMessage);
  }
};
</script>

<style scoped>
.anx-viewer {
  width: 100%;
}

.converter-content {
  display: flex;
  gap: 16px;
  height: 80vh;
  flex: 1;
}

.input-section,
.json-section,
.output-section,
.visual-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.input-section:hover,
.json-section:hover,
.output-section:hover,
.visual-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.visual-section > *:not(h2) {
  flex: 1;
  overflow: auto;
}

.input-section h2,
.json-section h2,
.output-section h2,
.visual-section h2 {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 10px 14px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: -0.2px;
}

.json-section {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.json-viewer-container {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
  background-color: #ffffff;
  border-radius: 4px;
  height: calc(100% - 40px);
  border: 1px solid #e2e8f0;
}

.input-section textarea {
  flex: 1;
  padding: 14px;
  border: none;
  resize: none;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: #1e293b;
  line-height: 1.6;
  background: #ffffff;
}

.input-section textarea:focus {
  outline: none;
  background: #fefefe;
}

.output-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  letter-spacing: -0.2px;
  background: none;
  padding: 0;
  border-bottom: none;
}

.view-toggle {
  display: flex;
  gap: 4px;
}

.toggle-btn {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-color: #6366f1;
}

.markup-container {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  background: #ffffff;
}

.raw-output {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
  white-space: pre-wrap;
  margin: 0;
}

.markup-output {
  line-height: 1.6;
  color: #1e293b;
}

.markup-output h1,
.markup-output h2 {
  margin-top: 0;
  color: #1e293b;
}

.cli-section {
  border-top: 1px solid #e2e8f0;
  padding: 12px 14px;
  background: #f8fafc;
}

.cli-section h3 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cli-history {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.history-header span {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.clear-history-btn {
  padding: 2px 8px;
  border: 1px solid #fee2e2;
  border-radius: 4px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-history-btn:hover {
  background: #fee2e2;
  border-color: #dc2626;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.history-item:hover {
  background: #e2e8f0;
}

.history-cardKey {
  color: #6366f1;
  font-weight: 500;
}

.history-action {
  color: #059669;
  font-weight: 500;
}

.history-command {
  color: #64748b;
  flex: 1;
}

.history-time {
  color: #94a3b8;
  white-space: nowrap;
}

.history-empty {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 12px;
}

.cli-input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.cli-input-container input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  background: #ffffff;
  color: #1e293b;
}

.cli-input-container input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.cli-input-container button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cli-input-container button:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.cli-output {
  background: #1e293b;
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.cli-output h4 {
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cli-output pre {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 700px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-header-actions {
  display: flex;
  gap: 8px;
}

.close-btn {
  width: 32px;
  height: 32px;
  background-color: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #fecaca;
  transform: scale(1.05);
}

.refresh-btn {
  width: 32px;
  height: 32px;
  background-color: #e0f2fe;
  color: #0284c7;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background-color: #bae6fd;
  transform: scale(1.05);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.command-category {
  margin-bottom: 20px;
}

.command-category h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #6366f1;
}

.command-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.command-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
}

.command-name {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 4px;
}

.command-description {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.command-usage,
.command-example {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: #475569;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 6px;
  margin-top: 4px;
}

.modal-footer {
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.modal-footer button {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-footer button:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.no-logs {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
}

.log-item.error {
  border-color: #fecaca;
  background: #fef2f2;
}

.log-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.log-timestamp {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: #94a3b8;
}

.log-type {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e0f2fe;
  color: #0284c7;
}

.log-status {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  background: #dcfce7;
  color: #16a34a;
}

.log-item.error .log-status {
  background: #fee2e2;
  color: #dc2626;
}

.log-command,
.log-message {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: #1e293b;
  margin-bottom: 8px;
}

.log-response,
.log-details,
.log-error {
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 4px;
}

.log-response pre,
.log-details pre {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: #475569;
  white-space: pre-wrap;
}

.log-error {
  color: #dc2626;
  font-weight: 500;
}
</style>
