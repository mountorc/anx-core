<template>
  <div class="converter-container">
    <div class="main-layout">
      <div :class="['page-list-sidebar', { hidden: isSidebarHidden }]">
        <div class="sidebar-header">
          <h3>页面列表</h3>
          <div class="header-right">
            <span class="page-count">{{ pageList.length }} 个实例</span>
            <button class="add-page-btn" @click="createNewPage">+</button>
            <button class="collapse-btn" @click="toggleSidebar">‹</button>
          </div>
        </div>
        <div class="page-list">
          <div
            v-for="page in pageList"
            :key="page.uuid_page"
            :class="['page-item', { active: page.uuid_page === currentUuidPage }]"
            @click="switchPage(page.uuid_page)"
          >
            <div class="page-header">
              <span class="page-name">{{ page.title || '未命名' }}</span>
              <span :class="['page-status', getPageStatusClass(page)]">{{ getPageStatusText(page) }}</span>
            </div>
            <span class="page-uuid">{{ page.uuid_page }}</span>
            <span class="page-date">{{ formatDate(page.createdAt) }}</span>
          </div>
          <div v-if="pageList.length === 0" class="empty-list">
            <p>暂无页面实例</p>
          </div>
        </div>
      </div>
      <button v-if="isSidebarHidden" class="expand-btn" @click="toggleSidebar">›</button>
      
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
            <JsonViewer :data="nodesStructure" :default-expand="false" />
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
        
        <!-- Command Logs Modal -->
        <CommandLogsModal 
          :is-visible="showCommandLogsModal" 
          @close="showCommandLogsModal = false"
        />
      </div>
    </div>
    
    <!-- Commands list modal -->
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
    
    <!-- Unified Logs modal -->
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
import CommandLogsModal from '../components/CommandLogsModal.vue';
import JsonViewer from '../components/JsonViewer.vue';

export default {
  name: 'Home',
  components: {
    CommandLogsModal,
    JsonViewer
  },
  data() {
    return {
      anxInput: '',
      hubList: [], // 存储从hub获取的tile case列表
      currentTileUuid: '', // 当前选中的tile uuid
      currentUrlTile: '', // 当前选中的url_tile
      currentUuidPage: '', // 当前选中的页面uuid
      uuidVisitor: '', // 当前的访客uuid
      outputMode: 'markup', // 输出模式：markup 或 markdown
      pageList: [], // 页面列表
      isSidebarHidden: false, // 侧边栏是否隐藏
      hasUrlOrUuidTile: false, // 标记URL中是否有tile参数
      boxDatasetTest: `{
  "kind": "box",
  "title": "测试Box组件 dataset",
  "dataset": {
    "data": [
      { "name": "张三", "age": 25 },
      { "name": "李四", "age": 30 }
    ]
  },
  "template": "姓名: {{name}}, 年龄: {{age}}",
  "tapSet": {
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "age": "age"
      }
    }
  }
}`,
      boxDatasetUrlTest: `{
  "kind": "box",
  "title": "测试Box组件 dataset url",
  "dataset": {
    "url_dataset": "http://localhost:7887/dataset"
  },
  "template": "商品名称: {{name}}, 价格: {{price}}",
  "tapSet": {
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "price": "price"
      }
    }
  }
}`,
      boxTapTest: `{
  "kind": "box",
  "title": "测试Box组件 tapSet",
  "data": [
    { "name": "商品A", "price": 98 },
    { "name": "商品B", "price": 58 },
    { "name": "商品C", "price": 38 },
    { "name": "商品D", "price": 65 },
    { "name": "商品E", "price": 107 }
  ],
  "template": "商品名称: {{name}}, 价格: {{price}}",
  "tapSet": {
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "price": "price"
      }
    }
  }
}`,


      markupOutput: '',
      rawMarkupOutput: '',
      jsonStructure: '',
      nodesStructure: null,
      cliCommand: '',
      cliOutput: '',
      cliHistory: [],
      showCommandsModal: false,
      showLogsModal: false,
      showCommandLogsModal: false,
      cliCommands: [],
      cliLogs: [],
      allLogs: [],
      visualizationHTML: '',
      visualizationCSS: '',
      debounceTimer: null
    }
  },
  async mounted() {
    // 先检查URL参数并加载对应的tile
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlTile = !!urlParams.get('url_tile');
    const hasUuidTile = !!urlParams.get('uuid_tile');
    
    // 设置标记，告诉loadHubList不要加载默认示例
    if (hasUrlTile || hasUuidTile) {
      this.hasUrlOrUuidTile = true;
    }
    
    // 从URL参数中获取uuid_tile、uuid_visitor等并自动加载对应的tile
    await this.checkUrlForUuidTile();
    
    this.loadHubList();
    this.initFileUploads();
    
    // 监听 message 事件（来自可视化 iframe）
    window.addEventListener('message', this.handleVisualizationMessage);
    
    // 监听全局日志打开事件
    this.$eventBus.on('openLogs', this.handleOpenLogs);
    // 监听命令日志打开事件
    this.$eventBus.on('openCommandLogs', this.handleOpenCommandLogs);
    // 监听加载测试用例事件（来自App组件）
    this.$eventBus.on('loadHubTestCase', this.loadHubTestCase);
    // 监听刷新uuid_visitor事件（来自App组件）
    this.$eventBus.on('refreshWithUuidVisitor', (uuid) => {
      this.uuidVisitor = uuid;
      this.refreshWithUuidVisitor();
    });
    
    // 加载ANXView web component
    import('../webComponents/ANXView.js');
  },
  beforeUnmount() {
    // 移除事件监听
    window.removeEventListener('message', this.handleVisualizationMessage);
    // 移除日志事件监听
    window.removeEventListener('openLogs', this.handleOpenLogs);
    // 移除命令日志事件监听
    window.removeEventListener('openCommandLogs', this.handleOpenCommandLogs);
  },
  methods: {
    // 检查URL参数中是否包含uuid_tile、url_tile或uuid_visitor
    async checkUrlForUuidTile() {
      const urlParams = new URLSearchParams(window.location.search);
      const uuidTile = urlParams.get('uuid_tile');
      const urlTile = urlParams.get('url_tile');
      const uuidVisitor = urlParams.get('uuid_visitor');
      
      if (uuidVisitor) {
        console.log(`[URL] Found uuid_visitor parameter: ${uuidVisitor}`);
        this.uuidVisitor = uuidVisitor;
        // 通过事件总线通知App组件更新uuidVisitor
        this.$eventBus.emit('updateUuidVisitor', uuidVisitor);
      }
      
      // url_tile 优先
      if (urlTile) {
        console.log(`[URL] Found url_tile parameter: ${urlTile}`);
        await this.loadUrlTile(urlTile);
      } else if (uuidTile) {
        console.log(`[URL] Found uuid_tile parameter: ${uuidTile}`);
        await this.loadHubTestCase(uuidTile);
      }
    },
    // 更新URL中的tile信息参数（url_tile优先）
    updateUrlWithTileInfo() {
      const urlParams = new URLSearchParams(window.location.search);

      if (this.currentUrlTile) {
        urlParams.set('url_tile', this.currentUrlTile);
        urlParams.delete('uuid_tile');
      } else if (this.currentTileUuid) {
        urlParams.set('uuid_tile', this.currentTileUuid);
        urlParams.delete('url_tile');
      }

      const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
    },
    // 使用新的 uuid_visitor 刷新页面
    refreshWithUuidVisitor() {
      if (!this.uuidVisitor) {
        console.log('[UUID] No uuid_visitor provided');
        return;
      }
      
      // 更新URL参数
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('uuid_visitor', this.uuidVisitor);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
      
      console.log(`[UUID] Refreshing with uuid_visitor: ${this.uuidVisitor}`);
      
      // 通过事件总线通知App组件更新uuidVisitor
      this.$eventBus.emit('updateUuidVisitor', this.uuidVisitor);
      
      // 重新转换以应用新的 uuid_visitor
      this.convertAnxToMarkup();
    },
    // 防抖函数，避免频繁的API调用
    debouncedConvertAnxToMarkup() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.convertAnxToMarkup();
      }, 300); // 300毫秒的防抖延迟
    },
    // 加载所有tile case列表（包括hub.json和tiles.json）
    async loadHubList() {
      try {
        const response = await fetch('http://localhost:7887/api/tiles/list');
        const data = await response.json();
        if (data.success) {
          this.hubList = data.data;
          // 通过事件总线通知App组件更新hubList
          this.$eventBus.emit('updateHubList', data.data);
          
          // 如果URL中有tile参数，不要加载默认示例
          if (this.hasUrlOrUuidTile) {
            console.log(`[URL] Has url_tile or uuid_tile parameter, skipping default tile load`);
            return;
          }
          
          // 如果当前没有加载任何tile，自动加载默认示例
          if (!this.currentTileUuid && !this.anxInput.trim()) {
            const defaultTile = this.hubList.find(item => item.isDefault);
            if (defaultTile) {
              console.log(`[Default] Loading default tile: ${defaultTile.name}`);
              this.loadHubTestCase(defaultTile.uuid);
            }
          }
        }
      } catch (error) {
        console.error('Error loading tiles list:', error);
      }
    },
    // 加载指定的tile case
    async loadHubTestCase(uuid) {
      try {
        const response = await fetch(`http://localhost:7887/api/hub/${uuid}`);
        const data = await response.json();
        if (data.success) {
          this.anxInput = JSON.stringify(data.data.anxContent, null, 2);
          this.currentTileUuid = uuid;
          // 从hubList中查找对应的url_tile
          const tile = this.hubList.find(item => item.uuid === uuid);
          this.currentUrlTile = tile ? tile.url : '';
          // 更新URL参数
          this.updateUrlWithTileInfo();
          // 通过事件总线通知App组件更新tile信息
          this.$eventBus.emit('updateTileInfo', {
            tileUuid: this.currentTileUuid,
            urlTile: this.currentUrlTile
          });
          // 生成或获取当前页面uuid
          this.currentUuidPage = await this.generateUuidPage();
          // 加载页面列表（url_tile优先）
          if (this.currentUrlTile) {
            await this.fetchPageListByUrl(this.currentUrlTile);
          } else {
            await this.fetchPageList(uuid);
          }
          // 使用uuid_page进行转换
          this.convertAnxToMarkup();
        }
      } catch (error) {
        console.error('Error loading hub tile case:', error);
      }
    },
    // 通过URL加载tile
    async loadUrlTile(url) {
      try {
        const response = await fetch('http://localhost:7887/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url_tile: url })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.nodes) {
            // 获取原始ANX配置
            const anxResponse = await fetch(url);
            if (anxResponse.ok) {
              const anxContent = await anxResponse.json();
              this.anxInput = JSON.stringify(anxContent, null, 2);
            }
            this.currentUrlTile = url;
            this.currentTileUuid = '';
            // 更新URL参数
            this.updateUrlWithTileInfo();
            // 生成或获取当前页面uuid
            this.currentUuidPage = await this.generateUuidPage();
            // 加载页面列表（通过url_tile）
            await this.fetchPageListByUrl(url);
            // 使用uuid_page进行转换
            this.convertAnxToMarkup();
          }
        }
      } catch (error) {
        console.error('Error loading url tile:', error);
      }
    },
    // 生成或获取uuid_page（url_tile优先）
    async generateUuidPage() {
      if (this.currentUrlTile) {
        try {
          const url = new URL('http://localhost:7887/api/pages/by-url-tile');
          url.searchParams.set('url_tile', this.currentUrlTile);
          if (this.uuidVisitor) {
            url.searchParams.set('uuid_visitor', this.uuidVisitor);
          }
          const response = await fetch(url.toString());
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              return pages[0].uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list by url_tile:', error);
        }
      } else if (this.currentTileUuid) {
        try {
          const response = await fetch(`http://localhost:7887/api/pages/by-tile/${this.currentTileUuid}`);
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              return pages[0].uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list:', error);
        }
      }

      return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    // 获取页面列表
    async fetchPageList(uuid_tile) {
      try {
        const response = await fetch(`http://localhost:7887/api/pages/by-tile/${uuid_tile}`);
        if (response.ok) {
          const result = await response.json();
          this.pageList = (result.data || []).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          );
        }
      } catch (error) {
        console.error('Error fetching page list:', error);
      }
    },
    // 通过url_tile获取页面列表
    async fetchPageListByUrl(url_tile) {
      try {
        const url = new URL('http://localhost:7887/api/pages/by-url-tile');
        url.searchParams.set('url_tile', url_tile);
        if (this.uuidVisitor) {
          url.searchParams.set('uuid_visitor', this.uuidVisitor);
        }
        const response = await fetch(url.toString());
        if (response.ok) {
          const result = await response.json();
          this.pageList = (result.data || []).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          );
        }
      } catch (error) {
        console.error('Error fetching page list by url_tile:', error);
      }
    },
    // 切换页面
    switchPage(uuid_page) {
      this.currentUuidPage = uuid_page;
      // 重新转换ANX，使用新的uuid_page
      this.convertAnxToMarkup();
    },
    // 创建新页面
    async createNewPage() {
      const newUuid = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.currentUuidPage = newUuid;
      // 更新页面列表（url_tile优先）
      if (this.currentUrlTile) {
        await this.fetchPageListByUrl(this.currentUrlTile);
      } else if (this.currentTileUuid) {
        await this.fetchPageList(this.currentTileUuid);
      }
      // 重新转换ANX
      this.convertAnxToMarkup();
    },
    // 切换侧边栏显示
    toggleSidebar() {
      this.isSidebarHidden = !this.isSidebarHidden;
    },
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    // 获取页面状态文本
    getPageStatusText(page) {
      const pageData = page.data || {};
      const submitStatus = pageData.submitStatus;
      
      if (submitStatus === 'running') {
        return '运行中';
      } else if (submitStatus === 'submitted') {
        return '已提交';
      } else if (submitStatus === 'pending') {
        return '待提交';
      }
      
      return '正常';
    },
    // 获取页面状态样式类
    getPageStatusClass(page) {
      const pageData = page.data || {};
      const submitStatus = pageData.submitStatus;
      
      if (submitStatus === 'running') {
        return 'running';
      } else if (submitStatus === 'submitted') {
        return 'submitted';
      } else if (submitStatus === 'pending') {
        return 'pending';
      }
      
      return 'normal';
    },
    async convertAnxToMarkup() {
      try {
        // 构建请求参数
        const requestParams = {};
        
        // 如果有 url_tile，使用 url_tile 获取数据
        if (this.currentUrlTile) {
          requestParams.url_tile = this.currentUrlTile;
        } else {
          // 否则使用 anxContent
          const anxContent = JSON.parse(this.anxInput);
          requestParams.anxContent = anxContent;
        }
        
        // 添加 uuid_page 参数
        if (this.currentUuidPage) {
          requestParams.uuid_page = this.currentUuidPage;
        }
        
        // 添加 uuid_visitor 参数
        if (this.uuidVisitor) {
          requestParams.uuid_visitor = this.uuidVisitor;
        }
        
        // Get nodes structure from backend
        const nodesResponse = await fetch('http://localhost:7887/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestParams)
        });
        
        const nodesResult = await nodesResponse.json();
        this.jsonStructure = JSON.stringify(nodesResult.nodes, null, 2);
        this.nodesStructure = nodesResult.nodes;
        
        // Convert ANX to Markup
        const markupResponse = await fetch('http://localhost:7887/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestParams)
        });
        
        const markupResult = await markupResponse.json();
        this.rawMarkupOutput = markupResult.markup;
        this.markupOutput = this.convertMarkupToHtml(markupResult.markup);
        
        // Generate node visualization (can be done in parallel or after Markup conversion)
        this.generateNodeVisualization(this.nodesStructure);
      } catch (error) {
        console.error('Error converting ANX:', error);
        this.rawMarkupOutput = 'Error converting ANX to Markup. Please check your input.';
        this.markupOutput = '<p>Error converting ANX to Markup. Please check your input.</p>';
        this.jsonStructure = 'Invalid JSON. Please check your input.';
      }
    },
    async generateNodeVisualization(node) {
      try {
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
        this.visualizationHTML = result.html;
        this.visualizationCSS = result.css;
        
        // 动态注入 CSS 和 JavaScript
        this.$nextTick(() => {
          this.injectVisualizationCSS(result.css);
          this.injectVisualizationJS();
          // 执行 visualizationHTML 中的脚本
          this.executeVisualizationScripts();
        });
      } catch (error) {
        console.error('Error generating node visualization:', error);
        this.visualizationHTML = '<div class="anx-error">Error generating node visualization</div>';
      }
    },
    executeVisualizationScripts() {
      // 提取 visualizationHTML 中的脚本标签并执行
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
      // 移除旧的脚本标签
      const oldScript = document.getElementById('visualization-dynamic-script');
      if (oldScript) {
        oldScript.remove();
      }
      
      // 脚本已经在ANXView组件中处理
      console.log('Visualization JS injected through ANXView component');
    },
    injectVisualizationCSS(css) {
      if (!css) return;
      
      // 移除旧的样式标签
      const oldStyle = document.getElementById('visualization-dynamic-style');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      // 创建新的样式标签
      const style = document.createElement('style');
      style.id = 'visualization-dynamic-style';
      style.textContent = css;
      document.head.appendChild(style);
    },
    async handleVisualizationMessage(event) {
      // 检查消息类型
      if (event.data && event.data.type === 'UPDATE_NODE_DATA') {
        const { cardKey, field, value, log } = event.data;
        console.log('Node data changed from visualization:', { cardKey, field, value });
        
        // 记录view日志
        if (log) {
          this.addViewLog({
            timestamp: log.timestamp,
            action: log.action,
            details: log.details,
            message: `View field updated: ${field} = ${value}`
          });
        } else {
          // 如果没有log对象，创建一个
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'field_update',
            details: { cardKey, field, value },
            message: `View field updated: ${field} = ${value}`
          });
        }
        
        try {
          // 构建请求数据，携带所有必要的信息
          const requestData = { cardKey, field, value };
          
          // 添加 uuid_visitor
          if (this.uuidVisitor) {
            requestData.uuid_visitor = this.uuidVisitor;
          }
          
          // 添加 uuid_page
          if (this.currentUuidPage) {
            requestData.uuid_page = this.currentUuidPage;
          }
          
          // 添加 uuid_tile 或 url_tile（url_tile优先）
          if (this.currentUrlTile) {
            requestData.url_tile = this.currentUrlTile;
          } else if (this.currentTileUuid) {
            requestData.uuid_tile = this.currentTileUuid;
          }
          
          // 调用后端 API 更新节点数据
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
          
          // 更新 Core Nodes 显示
          if (result.nodes) {
            this.jsonStructure = JSON.stringify(result.nodes, null, 2);
            this.nodesStructure = result.nodes;
            // 重新生成节点可视化
            await this.generateNodeVisualization(this.nodesStructure);
            // 重新解析ANX输入，确保使用最新的数据
            this.convertAnxToMarkup();
          }
        } catch (error) {
          console.error('Error updating node data:', error);
          // 记录错误日志
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'field_update_error',
            details: { cardKey, field, value, error: error.message },
            message: `Error updating view field: ${field}`,
            status: 'error'
          });
        }
      } else if (event.data && event.data.type === 'TRIGGER_CARD_KEY') {
        // 处理 cardKey 触发事件
        const { cardKey } = event.data;
        console.log('Trigger card key from visualization:', cardKey);
        
        try {
          // 构建请求数据，携带所有必要的信息
          const requestData = { cardKey };
          
          // 添加 uuid_visitor
          if (this.uuidVisitor) {
            requestData.uuid_visitor = this.uuidVisitor;
          }
          
          // 添加 uuid_page
          if (this.currentUuidPage) {
            requestData.uuid_page = this.currentUuidPage;
          }
          
          // 添加 uuid_tile 或 url_tile（url_tile优先）
          if (this.currentUrlTile) {
            requestData.url_tile = this.currentUrlTile;
          } else if (this.currentTileUuid) {
            requestData.uuid_tile = this.currentTileUuid;
          }
          
          // 调用后端 API 触发 cardKey 节点点击
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
          
          // 更新 Core Nodes 显示
          if (result.nodes) {
            this.jsonStructure = JSON.stringify(result.nodes, null, 2);
            this.nodesStructure = result.nodes;
            // 重新生成节点可视化
            await this.generateNodeVisualization(this.nodesStructure);
          }
        } catch (error) {
          console.error('Error triggering card key:', error);
          // 记录错误日志
          this.addViewLog({
            timestamp: new Date().toISOString(),
            action: 'trigger_card_key_error',
            details: { cardKey: cardKey, error: error.message },
            message: `Error triggering card key: ${cardKey}`,
            status: 'error'
          });
        }
      } else if (event.data && event.data.type === 'HANDLE_TAP_SET') {
        // 处理 tapSet 动作
        const { cardKey, tapSet } = event.data;
        console.log('Handle tap set from visualization:', { cardKey, tapSet });
        
        // 记录日志
        this.addViewLog({
          timestamp: new Date().toISOString(),
          action: 'handle_tap_set',
          details: { cardKey: cardKey, tapSet: tapSet },
          message: `Tap set handled for card key: ${cardKey}`
        });
        
        try {
          // 构建请求数据，携带所有必要的信息
          const requestData = { cardKey, tapSet };
          
          // 添加 uuid_visitor
          if (this.uuidVisitor) {
            requestData.uuid_visitor = this.uuidVisitor;
          }
          
          // 添加 uuid_page
          if (this.currentUuidPage) {
            requestData.uuid_page = this.currentUuidPage;
          }
          
          // 添加 uuid_tile 或 url_tile（url_tile优先）
          if (this.currentUrlTile) {
            requestData.url_tile = this.currentUrlTile;
          } else if (this.currentTileUuid) {
            requestData.uuid_tile = this.currentTileUuid;
          }
          
          // 调用后端 API 触发卡片点击，由它处理 tapSet 动作
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
          
          // 更新 Core Nodes 显示
          if (result.nodes) {
            this.jsonStructure = JSON.stringify(result.nodes, null, 2);
            this.nodesStructure = result.nodes;
            // 重新生成节点可视化
            await this.generateNodeVisualization(this.nodesStructure);
          }
        } catch (error) {
          console.error('Error handling tap set:', error);
          // 记录错误日志
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
    async updateMarkupOutput() {
      try {
        // 解析ANX输入
        const anxContent = JSON.parse(this.anxInput);
        
        // 转换ANX到Markup
        const markupResponse = await fetch('http://localhost:7887/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const markupResult = await markupResponse.json();
        this.rawMarkupOutput = markupResult.markup;
        this.markupOutput = this.convertMarkupToHtml(markupResult.markup);
      } catch (error) {
        console.error('Error updating markup output:', error);
      }
    },
    convertMarkupToHtml(markup) {
      // Simple Markup to HTML conversion
      return markup
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\`\`\`[\s\S]*?\`\`\`/gim, (match) => {
          return `<pre><code>${match.replace(/\`\`\`/g, '')}</code></pre>`;
        })
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/^(.+)$/gim, '<p>$1</p>')
        .replace(/<p><\/p>/gim, '');
    },
    // Initialize file upload functionality
    initFileUploads() {
      // Add file upload functions to global scope
      window.handleFileChange = (event, cardKey, kind, maxSize, maxCount, preview) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // Handle file validation and upload
        if (kind === 'image' || kind === 'file') {
          this.handleSingleFile(files[0], cardKey, kind, maxSize, preview);
        } else if (kind === 'images') {
          this.handleMultipleFiles(files, cardKey, maxSize, maxCount, preview);
        }
        
        // Reset file input
        event.target.value = '';
      };
      
      window.removeFile = (cardKey, kind, index) => {
        if (kind === 'image' || kind === 'file') {
          this.updateNodeDataForFile(cardKey, '');
        } else if (kind === 'images') {
          const currentValue = this.getNodeValue(cardKey) || [];
          const newValues = currentValue.filter((_, i) => i !== index);
          this.updateNodeDataForFile(cardKey, newValues);
        }
      };
    },
    handleSingleFile(file, cardKey, kind, maxSize, preview) {
      // Validate file size
      if (file.size > maxSize) {
        alert('文件大小超过限制');
        return;
      }
      
      // Generate preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update node with preview URL temporarily
      this.updateNodeDataForFile(cardKey, previewUrl);
      
      // Upload file to server
      this.uploadFile(file, cardKey, kind);
    },
    handleMultipleFiles(files, cardKey, maxSize, maxCount, preview) {
      const currentValue = this.getNodeValue(cardKey) || [];
      const newFiles = [...currentValue];
      
      for (let i = 0; i < files.length; i++) {
        if (newFiles.length >= maxCount) {
          alert("最多只能上传" + maxCount + "个文件");
          break;
        }
        
        const file = files[i];
        
        // Validate file size
        if (file.size > maxSize) {
          alert('文件大小超过限制');
          return;
        }
        
        // Generate preview URL
        const previewUrl = URL.createObjectURL(file);
        newFiles.push(previewUrl);
        
        // Update node with preview URLs temporarily
        this.updateNodeDataForFile(cardKey, newFiles);
        
        // Upload file to server
        this.uploadFile(file, cardKey, 'images', newFiles.length - 1);
      }
    },
    uploadFile(file, cardKey, kind, index) {
      // 导入前端的OSS上传工具
      import('/src/utils/oss.js')
        .then(({ uploadImageToOSS }) => {
          // 直接上传到OSS
          uploadImageToOSS(file)
            .then(fileUrl => {
              if (kind === 'image' || kind === 'file') {
                // Update with server URL
                this.updateNodeDataForFile(cardKey, fileUrl);
              } else if (kind === 'images') {
                // Update specific index with server URL
                const currentValue = this.getNodeValue(cardKey) || [];
                const newValues = [...currentValue];
                newValues[index] = fileUrl;
                this.updateNodeDataForFile(cardKey, newValues);
              }
            })
            .catch(error => {
              console.error('File upload error:', error);
              alert('文件上传失败: ' + error.message);
            });
        })
        .catch(error => {
          console.error('Error loading OSS module:', error);
          alert('加载上传模块失败');
        });
    },
    updateNodeDataForFile(cardKey, value) {
      // Send message to parent window
      window.parent.postMessage({
        type: 'UPDATE_NODE_DATA',
        cardKey: cardKey,
        field: 'value',
        value: value
      }, '*');
    },
    getNodeValue(cardKey) {
      // This is a placeholder - in a real implementation, you would get the current value from the node
      return [];
    },
    loadOptionsDatasetTest() {
      this.anxInput = `{ 
  "kind": "options", 
  "nick": "product", 
  "value": "", 
  "optionsSet": { 
    "dataset": { 
      "url_dataset": "http://localhost:7887/dataset" 
    }, 
    "titleNick": "name", 
    "valueNick": "name" 
  } 
}`;
      this.convertAnxToMarkup();
    },
    loadFormTest() {
      this.anxInput = `{
  "kind": "form",
  "title": "用户注册表单",
  "kinds": [
    {
      "kind": "input",
      "nick": "username",
      "placeholder": "请输入用户名",
      "value": ""
    },
    {
      "kind": "input",
      "nick": "email",
      "placeholder": "请输入邮箱",
      "value": ""
    },
    {
      "kind": "date",
      "nick": "birthday",
      "placeholder": "请选择出生日期",
      "value": ""
    },
    {
      "kind": "input",
      "type": "number",
      "nick": "age",
      "placeholder": "请输入年龄",
      "value": ""
    },
    {
      "kind": "text",
      "type": "number",
      "nick": "yearsSinceAdult",
      "title": "成年年数",
      "formula": "age - 18"
    },
    {
      "kind": "options",
      "nick": "gender",
      "title": "性别",
      "options": [
        { "value": "male", "title": "男" },
        { "value": "female", "title": "女" },
        { "value": "other", "title": "其他" }
      ],
      "value": ""
    },
    {
      "kind": "checkbox",
      "nick": "hobbies",
      "title": "爱好",
      "options": [
        { "value": "reading", "title": "阅读" },
        { "value": "sports", "title": "运动" },
        { "value": "music", "title": "音乐" },
        { "value": "travel", "title": "旅行" }
      ],
      "value": []
    },
    {
      "kind": "textarea",
      "nick": "description",
      "placeholder": "请输入个人简介",
      "value": "",
      "rows": 4
    },
    {
      "kind": "list",
      "nick": "skills",
      "title": "技能列表",
      "itemList": [
        {
          "nick": "skillName",
          "title": "技能名称",
          "kind": "input",
          "type": "string",
          "lineEdit": "2",
          "defaultValue": ""
        },
        {
          "nick": "level",
          "title": "熟练度",
          "kind": "options",
          "type": "string",
          "lineEdit": "2",
          "optionsItem": [
            { "value": "beginner", "title": "初级" },
            { "value": "intermediate", "title": "中级" },
            { "value": "advanced", "title": "高级" },
            { "value": "expert", "title": "专家" }
          ]
        },
        {
          "nick": "years",
          "title": "使用年限",
          "kind": "input",
          "type": "number",
          "lineEdit": "2",
          "defaultValue": 0
        }
      ],
      "data": [
        {
          "skillName": "JavaScript",
          "level": "advanced",
          "years": 5
        },
        {
          "skillName": "Vue.js",
          "level": "intermediate",
          "years": 3
        }
      ],
      "addButton": {
        "iitemPre": -1
      },
      "moveButton": true
    },
    {
      "kind": "button",
      "label": "提交",
      "action": "/submit"
    }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadTableTest() {
      this.anxInput = `{
  "kind": "table",
  "title": "用户数据表",
  "titles": [
    { "nick": "id", "title": "ID", "width": 60 },
    { "nick": "name", "title": "姓名", "width": 120 },
    { "nick": "age", "title": "年龄", "width": 80 },
    { "nick": "email", "title": "邮箱", "width": 200 }
  ],
  "data": [
    { "id": 1, "name": "张三", "age": 25, "email": "zhangsan@example.com" },
    { "id": 2, "name": "李四", "age": 30, "email": "lisi@example.com" },
    { "id": 3, "name": "王五", "age": 28, "email": "wangwu@example.com" }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadJobCreationFormTest() {
      this.anxInput = `{
  "kind": "form",
  "title": "创建求职账户",
  "description": "加入我们，发现更多职业机会",
  "kinds": [
    {
      "kind": "text",
      "value": "加入我们，发现更多职业机会"
    },
    {
      "kind": "input",
      "nick": "lastName",
      "title": "姓",
      "placeholder": "请输入姓"
    },
    {
      "kind": "input",
      "nick": "firstName",
      "title": "名",
      "placeholder": "请输入名"
    },
    {
      "kind": "input",
      "nick": "email",
      "title": "电子邮箱",
      "placeholder": "请输入电子邮箱",
      "type": "email"
    },
    {
      "kind": "input",
      "nick": "phone",
      "title": "手机号码",
      "placeholder": "请输入手机号码",
      "type": "tel"
    },
    {
      "kind": "date",
      "nick": "birthdate",
      "title": "出生日期",
      "placeholder": "年 / 月 / 日"
    },
    {
      "kind": "input",
      "nick": "city",
      "title": "所在城市",
      "placeholder": "请输入所在城市"
    },
    {
      "kind": "options",
      "nick": "education",
      "title": "最高学历",
      "options": [
        { "value": "", "title": "请选择学历" },
        { "value": "highSchool", "title": "高中及以下" },
        { "value": "college", "title": "大专" },
        { "value": "bachelor", "title": "本科" },
        { "value": "master", "title": "硕士" },
        { "value": "phd", "title": "博士" }
      ]
    },
    {
      "kind": "options",
      "nick": "experience",
      "title": "工作年限",
      "options": [
        { "value": "", "title": "请选择" },
        { "value": "fresh", "title": "应届毕业生" },
        { "value": "1-3", "title": "1-3年" },
        { "value": "3-5", "title": "3-5年" },
        { "value": "5-10", "title": "5-10年" },
        { "value": "10+", "title": "10年以上" }
      ]
    },
    {
      "kind": "options",
      "nick": "industry",
      "title": "行业选择",
      "options": [
        { "value": "", "title": "请选择行业" },
        { "value": "it", "title": "信息技术" },
        { "value": "finance", "title": "金融" },
        { "value": "education", "title": "教育" },
        { "value": "healthcare", "title": "医疗健康" },
        { "value": "retail", "title": "零售" },
        { "value": "manufacturing", "title": "制造业" },
        { "value": "other", "title": "其他" }
      ]
    },
    {
      "kind": "options",
      "nick": "occupation",
      "title": "职业选择",
      "options": [
        { "value": "", "title": "请选择职业" },
        { "value": "developer", "title": "开发工程师" },
        { "value": "designer", "title": "设计师" },
        { "value": "product", "title": "产品经理" },
        { "value": "marketing", "title": "市场营销" },
        { "value": "hr", "title": "人力资源" },
        { "value": "other", "title": "其他" }
      ]
    },
    {
      "kind": "checkbox",
      "nick": "jobType",
      "title": "期望职位类型",
      "options": [
        { "value": "fulltime", "title": "全职" },
        { "value": "parttime", "title": "兼职" },
        { "value": "internship", "title": "实习" },
        { "value": "remote", "title": "远程" }
      ]
    },
    {
      "kind": "button",
      "label": "创建账户",
      "action": "/create-account",
      "style": "primary",
      "size": "large"
    }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadBoardTableTest() {
      this.anxInput = `{
  "kind": "board",
  "kinds": [
    {
      "kind": "text",
      "value": "## 数据管理系统"
    },
    {
      "kind": "table",
      "title": "商品表",
      "titles": [
        { "nick": "name", "title": "商品名称", "width": 120 },
        { "nick": "price", "title": "价格", "width": 100 }
      ],
      "dataset": {
        "url_dataset": "http://localhost:7887/dataset"
      }
    },
    {
      "kind": "table",
      "title": "产品数据表",
      "titles": [
        { "nick": "id", "title": "产品ID", "width": 80 },
        { "nick": "name", "title": "产品名称", "width": 150 },
        { "nick": "price", "title": "价格", "width": 100 },
        { "nick": "stock", "title": "库存", "width": 80 }
      ],
      "data": [
        { "id": 101, "name": "笔记本电脑", "price": 5999, "stock": 50 },
        { "id": 102, "name": "智能手机", "price": 3999, "stock": 100 },
        { "id": 103, "name": "平板电脑", "price": 2999, "stock": 30 }
      ]
    }
  ]
}`;
      this.convertAnxToMarkup();
    },
    loadBoxTapTest() {
      this.anxInput = this.boxTapTest;
      this.convertAnxToMarkup();
    },
    loadBoxDatasetTest() {
      this.anxInput = this.boxDatasetTest;
      this.convertAnxToMarkup();
    },
    loadBoxDatasetUrlTest() {
      this.anxInput = this.boxDatasetUrlTest;
      this.convertAnxToMarkup();
    },

    async executeCliCommand() {
      if (!this.cliCommand) {
        this.cliOutput = 'Please enter a CLI command.';
        return;
      }

      try {
        // 构建请求数据，携带所有必要的信息
        const requestData = { command: this.cliCommand };
        
        // 添加 uuid_visitor
        if (this.uuidVisitor) {
          requestData.uuid_visitor = this.uuidVisitor;
        }
        
        // 添加 uuid_page
        if (this.currentUuidPage) {
          requestData.uuid_page = this.currentUuidPage;
        }
        
        // 添加 uuid_tile 或 url_tile（url_tile优先）
        if (this.currentUrlTile) {
          requestData.url_tile = this.currentUrlTile;
        } else if (this.currentTileUuid) {
          requestData.uuid_tile = this.currentTileUuid;
        }
        
        // 发送CLI命令到后端
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
        // 格式化输出，显示cardKey、action和result
        this.cliOutput = `cardKey: ${result.cardKey}\naction: ${result.action}\nresult: ${JSON.stringify(result.result, null, 2)}`;
        
        // 添加到历史记录
        this.cliHistory.unshift({
          command: this.cliCommand,
          timestamp: new Date().toISOString(),
          cardKey: result.cardKey,
          action: result.action
        });
        
        // 限制历史记录数量，最多保留50条
        if (this.cliHistory.length > 50) {
          this.cliHistory = this.cliHistory.slice(0, 50);
        }
        
        // 重新获取节点结构以更新显示
        await this.refreshNodesStructure();
      } catch (error) {
        console.error('Error executing CLI command:', error);
        this.cliOutput = 'Error executing CLI command. Please check your input.';
      }
    },
    async refreshNodesStructure() {
      try {
        // 解析ANX输入
        const anxContent = JSON.parse(this.anxInput);
        
        // 获取更新后的节点结构
        const nodesResponse = await fetch('http://localhost:7887/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anxContent })
        });
        
        const nodesResult = await nodesResponse.json();
        this.jsonStructure = JSON.stringify(nodesResult.nodes, null, 2);
        this.nodesStructure = nodesResult.nodes;
        
        // 重新生成节点可视化
        await this.generateNodeVisualization(this.nodesStructure);
        // 更新 Markdown Output
        await this.updateMarkdownOutput();
      } catch (error) {
        console.error('Error refreshing nodes structure:', error);
        this.jsonStructure = 'Error refreshing nodes structure. Please check your input.';
      }
    },
    async showCommandsList() {
      try {
        // 获取CLI命令集
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
    handleOpenLogs() {
      this.showCliLogs();
    },
    handleOpenCommandLogs() {
      this.showCommandLogsModal = true;
    },
    async refreshLogs() {
      try {
        // 获取CLI日志
        const cliResponse = await fetch('http://localhost:7887/api/cli/logs');
        const cliData = await cliResponse.json();
        const cliLogs = cliData.logs || [];
        
        // 为CLI日志添加类型标识
        const formattedCLILogs = cliLogs.map(log => ({
          ...log,
          type: 'cli'
        }));
        
        // 获取本地存储的view日志
        const viewLogs = JSON.parse(localStorage.getItem('viewLogs') || '[]');
        
        // 合并并按时间戳排序
        this.allLogs = [...formattedCLILogs, ...viewLogs].sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
      } catch (error) {
        console.error('Error refreshing logs:', error);
        alert('Failed to refresh logs. Please try again.');
      }
    },
    addViewLog(log) {
      // 获取本地存储的view日志
      const viewLogs = JSON.parse(localStorage.getItem('viewLogs') || '[]');
      
      // 添加新日志
      viewLogs.unshift({
        ...log,
        type: 'view',
        status: 'success'
      });
      
      // 限制日志数量，只保留最近100条
      const limitedLogs = viewLogs.slice(0, 100);
      
      // 保存回本地存储
      localStorage.setItem('viewLogs', JSON.stringify(limitedLogs));
      
      // 刷新日志显示
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
    }
  }
}
</script>

<style scoped>
.converter-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.main-layout {
  display: flex;
  gap: 0;
}

/* Page列表侧边栏样式 */
.page-list-sidebar {
  width: 280px;
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: calc(80vh - 60px);
  transition: transform 0.3s ease;
  transform: translateX(0);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.page-list-sidebar.hidden {
  transform: translateX(-100%);
  position: absolute;
  left: 0;
  z-index: 100;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-count {
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.12);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.add-page-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-page-btn:hover {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transform: scale(1.05);
}

.collapse-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.expand-btn {
  width: 28px;
  height: 56px;
  border: none;
  border-radius: 0 6px 6px 0;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  margin-bottom: auto;
  z-index: 101;
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background: linear-gradient(135deg, #334155, #475569);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.page-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.page-list::-webkit-scrollbar {
  width: 6px;
}

.page-list::-webkit-scrollbar-track {
  background: transparent;
}

.page-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.page-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.page-item {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-item:hover {
  border-color: #93c5fd;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.page-item.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.page-name {
  font-weight: 500;
  font-size: 13px;
  color: #1e293b;
}

.page-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.page-status.running {
  background-color: #dbeafe;
  color: #2563eb;
}

.page-status.submitted {
  background-color: #dcfce7;
  color: #16a34a;
}

.page-status.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.page-status.normal {
  background-color: #f1f5f9;
  color: #64748b;
}

.page-uuid {
  font-size: 10px;
  color: #94a3b8;
  font-family: 'SF Mono', 'Fira Code', monospace;
  display: block;
  margin-bottom: 4px;
}

.page-date {
  font-size: 11px;
  color: #94a3b8;
}

.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
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
.visual-section h2,
.visual-section-header h2 {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 10px 14px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: -0.2px;
}

.visual-section-header {
  border: 1px solid #e2e8f0;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
}

.json-section {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.json-output {
  flex: 1;
  padding: 14px;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  overflow-y: auto;
  white-space: pre-wrap;
  background-color: #f8fafc;
  color: #475569;
  line-height: 1.6;
}

.json-viewer-container {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
  background-color: #1e1e1e;
  border-radius: 4px;
  max-height: 500px;
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
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.section-header h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  padding: 2px;
  border-radius: 8px;
}

.toggle-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: #334155;
}

.toggle-btn.active {
  background-color: #ffffff;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.markup-container {
  flex: 1;
  overflow-y: auto;
}

.markup-output {
  padding: 14px;
  background-color: white;
}

.raw-output {
  padding: 14px;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  background-color: #f8fafc;
  overflow-y: auto;
  white-space: pre-wrap;
  color: #475569;
  line-height: 1.6;
}

.visual-section {
  background-color: #ffffff;
}

.visual-output {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
}

.node-visualization {
  background-color: white;
  border-radius: 8px;
  padding: 0px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}

.test-cases {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}



.output-section .cli-section {
  border-top: 1px solid #e2e8f0;
  padding: 14px;
  background-color: #f8fafc;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #e2e8f0;
}

.cli-history {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
}

.history-header span {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.clear-history-btn {
  padding: 3px 10px;
  font-size: 11px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.clear-history-btn:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.history-list::-webkit-scrollbar {
  width: 5px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.history-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 20px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.15s ease;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background-color: #f8fafc;
}

.history-cardKey {
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
  background-color: #eef2ff;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.history-action {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}

.history-command {
  flex: 1;
  font-size: 12px;
  color: #334155;
  font-family: 'SF Mono', 'Fira Code', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
}

.cli-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  flex-shrink: 0;
}

.cli-input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.cli-input-container input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s ease;
  background: #ffffff;
}

.cli-input-container input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.cli-input-container button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cli-input-container button:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.cli-output {
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  max-height: 120px;
  overflow-y: auto;
  flex-shrink: 0;
}

.cli-output h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  position: sticky;
  top: 0;
  background-color: #f8fafc;
  padding-bottom: 5px;
}

.cli-output pre {
  margin: 0;
  padding: 10px;
  background-color: #f1f5f9;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 150px;
  overflow-y: auto;
  color: #475569;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .converter-content {
    flex-direction: column;
    height: auto;
  }
  
  .input-section,
  .json-section,
  .output-section {
    height: auto;
    min-height: 50vh;
    margin-bottom: 20px;
  }
  
  .cli-input-container {
    flex-direction: column;
  }
  
  .cli-input-container button {
    width: 100%;
  }
  
  .modal-content {
    width: 90%;
    max-height: 90vh;
  }
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.modal-body {
  padding: 20px;
}

.command-category {
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.command-category h4 {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 10px 16px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
}

.command-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.command-item {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.command-item:last-child {
  border-bottom: none;
}

.command-name {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 4px;
}

.command-description {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.command-usage {
  font-size: 12px;
  color: #6366f1;
  background-color: #eef2ff;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.command-example {
  font-size: 12px;
  color: #475569;
  background-color: #f1f5f9;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* CLI Logs styles */
.no-logs {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-style: italic;
  font-size: 13px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.log-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.log-item.success {
  border-left: 4px solid #22c55e;
}

.log-item.error {
  border-left: 4px solid #ef4444;
  background-color: #fef2f2;
}

.log-item.cli {
  background-color: #f8fafc;
}

.log-item.view {
  background-color: #eff6ff;
}

.log-type {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  margin-right: 8px;
  background-color: #f1f5f9;
  color: #475569;
  letter-spacing: 0.5px;
}

.log-item.cli .log-type {
  background-color: #e0e7ff;
  color: #6366f1;
}

.log-item.view .log-type {
  background-color: #dbeafe;
  color: #2563eb;
}

.log-message {
  font-size: 13px;
  margin: 10px 0;
  padding: 8px 10px;
  background-color: #f8fafc;
  border-radius: 6px;
  color: #475569;
}

.log-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
}

.log-details pre {
  margin: 5px 0 0 0;
  padding: 8px;
  background-color: #f1f5f9;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: #475569;
}

.log-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.log-header .log-timestamp {
  flex: 1;
}

.log-header .log-type {
  margin-right: 8px;
}

.log-header .log-status {
  margin-left: auto;
}

.log-timestamp {
  font-size: 11px;
  color: #64748b;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.log-status {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-item.success .log-status {
  background-color: #dcfce7;
  color: #16a34a;
}

.log-item.error .log-status {
  background-color: #fee2e2;
  color: #dc2626;
}

.log-command {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  margin-bottom: 10px;
  padding: 8px 10px;
  background-color: #f1f5f9;
  border-radius: 6px;
  word-break: break-all;
  color: #334155;
}

.log-response {
  margin-bottom: 10px;
}

.log-response pre {
  margin: 0;
  padding: 10px;
  background-color: #f8fafc;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: #475569;
}

.log-error {
  color: #dc2626;
  font-size: 12px;
  padding: 8px 10px;
  background-color: #fef2f2;
  border-radius: 6px;
  margin-top: 6px;
  border: 1px solid #fecaca;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 0 0 12px 12px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-footer button {
  padding: 8px 18px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.modal-footer button:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.modal-footer button:first-child {
  margin-left: 0;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.modal-footer button:first-child:hover {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
}
</style>
