<template>
  <div class="converter-container">
    <div class="tile-cases-wrapper">
      <div class="tile-cases">
        <div class="tile-header">
          <h3>Tile Cases</h3>
          <div class="tile-info">
            <div class="visitor-input-wrapper">
              <label>uuid_visitor:</label>
              <input 
                v-model="uuidVisitor" 
                placeholder="输入访客uuid" 
                class="visitor-input"
                @keyup.enter="refreshWithUuidVisitor"
              />
              <button @click="refreshWithUuidVisitor" class="refresh-btn">刷新</button>
            </div>
            <div v-if="currentTileUuid || currentUrlTile">
              <span v-if="currentTileUuid" class="tile-uuid">uuid_tile: {{ currentTileUuid }}</span>
              <span v-if="currentUrlTile" class="tile-url">url_tile: {{ currentUrlTile }}</span>
            </div>
          </div>
        </div>
        <div class="tile-grid-wrapper">
          <div class="tile-grid">
            <div v-for="item in hubList" :key="item.uuid" class="tile-item" @click="loadHubTestCase(item.uuid)">
              <div class="tile-icon">
                <div class="icon-background">{{ item.name.charAt(0) }}</div>
              </div>
              <div class="tile-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
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
          <pre class="json-output">{{ jsonStructure }}</pre>
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
export default {
  name: 'Home',
  data() {
    return {
      anxInput: `{
  "kind": "box",
  "title": "测试Box组件",
  "data": [
    { "name": "张三", "age": 25 },
    { "name": "李四", "age": 30 }
  ],
  "template": "姓名: {{name}}, 年龄: {{age}}",
  "tapSet": {
    "title":"detail",
    "navigateTo": {
      "path": "/test",
      "paramMap": {
        "name": "name",
        "age": "age"
      }
    }
  }
}`,
      hubList: [], // 存储从hub获取的tile case列表
      currentTileUuid: '', // 当前选中的tile uuid
      currentUrlTile: '', // 当前选中的url_tile
      currentUuidPage: '', // 当前选中的页面uuid
      uuidVisitor: '', // 当前的访客uuid
      outputMode: 'markup', // 输出模式：markup 或 markdown
      pageList: [], // 页面列表
      isSidebarHidden: false, // 侧边栏是否隐藏
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
      cliCommands: [],
      cliLogs: [],
      allLogs: [],
      visualizationHTML: '',
      visualizationCSS: '',
      hubList: [], // 存储从hub获取的tile case列表
      debounceTimer: null
    }
  },
  mounted() {
    this.convertAnxToMarkup();
    this.loadHubList();
    this.initFileUploads();
    
    // 从URL参数中获取uuid_tile、uuid_visitor等并自动加载对应的tile
    this.checkUrlForUuidTile();
    
    // 监听 message 事件（来自可视化 iframe）
    window.addEventListener('message', this.handleVisualizationMessage);
    
    // 监听全局日志打开事件
    this.$eventBus.on('openLogs', this.handleOpenLogs);
    
    // 加载ANXView web component
    import('../webComponents/ANXView.js');
  },
  beforeUnmount() {
    // 移除事件监听
    window.removeEventListener('message', this.handleVisualizationMessage);
    // 移除日志事件监听
    window.removeEventListener('openLogs', this.handleOpenLogs);
  },
  methods: {
    // 检查URL参数中是否包含uuid_tile、url_tile或uuid_visitor
    checkUrlForUuidTile() {
      const urlParams = new URLSearchParams(window.location.search);
      const uuidTile = urlParams.get('uuid_tile');
      const urlTile = urlParams.get('url_tile');
      const uuidVisitor = urlParams.get('uuid_visitor');
      
      if (uuidVisitor) {
        console.log(`[URL] Found uuid_visitor parameter: ${uuidVisitor}`);
        this.uuidVisitor = uuidVisitor;
      }
      
      if (uuidTile) {
        console.log(`[URL] Found uuid_tile parameter: ${uuidTile}`);
        this.loadHubTestCase(uuidTile);
      } else if (urlTile) {
        console.log(`[URL] Found url_tile parameter: ${urlTile}`);
        this.loadUrlTile(urlTile);
      }
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
          // 生成或获取当前页面uuid
          this.currentUuidPage = await this.generateUuidPage();
          // 加载页面列表
          await this.fetchPageList(uuid);
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
    // 生成或获取uuid_page
    async generateUuidPage() {
      if (!this.currentTileUuid) {
        return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
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
      // 更新页面列表
      if (this.currentTileUuid) {
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
          // 调用后端 API 更新节点数据
          const response = await fetch('http://localhost:7887/api/update-node-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cardKey, field, value })
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
          // 调用后端 API 触发 cardKey 节点点击
          const response = await fetch('http://localhost:7887/api/trigger-card-key', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cardKey })
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
          // 调用后端 API 触发卡片点击，由它处理 tapSet 动作
          const response = await fetch('http://localhost:7887/api/trigger-card-key', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cardKey, tapSet })
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
        // 发送CLI命令到后端
        const response = await fetch('http://localhost:7887/api/execute-cli', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: this.cliCommand })
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
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: calc(80vh - 60px);
  transition: transform 0.3s ease;
  transform: translateX(0);
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
  padding: 15px;
  background-color: #4CAF50;
  color: white;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-count {
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.add-page-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-page-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.collapse-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.expand-btn {
  width: 30px;
  height: 60px;
  border: none;
  border-radius: 0 4px 4px 0;
  background-color: #4CAF50;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  margin-bottom: auto;
  z-index: 101;
}

.expand-btn:hover {
  background-color: #45a049;
}

.page-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.page-item {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-item:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.1);
}

.page-item.active {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.05);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.page-name {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.page-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.page-status.running {
  background-color: #ffc107;
  color: #333;
}

.page-status.submitted {
  background-color: #4CAF50;
  color: white;
}

.page-status.pending {
  background-color: #ff5722;
  color: white;
}

.page-status.normal {
  background-color: #e0e0e0;
  color: #666;
}

.page-uuid {
  font-size: 11px;
  color: #999;
  font-family: monospace;
  display: block;
  margin-bottom: 4px;
}

.page-date {
  font-size: 11px;
  color: #bbb;
}

.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.converter-content {
  display: flex;
  gap: 20px;
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
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
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
  background-color: #f5f5f5;
  padding: 10px;
  margin: 0;
  font-size: 16px;
  border-bottom: 1px solid #ddd;
}

.visual-section-header {
  border: 1px solid #ddd;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.json-section {
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.json-output {
  flex: 1;
  padding: 15px;
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  overflow-y: auto;
  white-space: pre-wrap;
  background-color: #f9f9f9;
}

.input-section textarea {
  flex: 1;
  padding: 15px;
  border: none;
  resize: none;
  font-family: monospace;
  font-size: 14px;
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
  background-color: #f5f5f5;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
}

.view-toggle {
  display: flex;
  gap: 4px;
}

.toggle-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background-color: #f0f0f0;
}

.toggle-btn.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.markup-container {
  flex: 1;
  overflow-y: auto;
}

.markup-output {
  padding: 15px;
  background-color: white;
}

.raw-output {
  padding: 15px;
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  background-color: #f9f9f9;
  overflow-y: auto;
  white-space: pre-wrap;
}

.visual-section {
  background-color: #f9f9f9;
}

.visual-output {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.node-visualization {
  background-color: white;
  border-radius: 8px;
  padding: 0px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-style: italic;
}

.test-cases {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

/* Tile Cases 收起/展开效果 */
.tile-cases-wrapper {
  position: relative;
  height: 40px;
  margin: 0;
  padding: 0;
  overflow: visible;
}

.tile-cases {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: white;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 10px 15px;
  margin: 0;
  max-height: 40px;
  overflow: hidden;
  transition: max-height 0.3s ease, box-shadow 0.3s ease;
  z-index: 100;
  border: none;
  border-top: none;
}

.tile-cases-wrapper:hover .tile-cases {
  max-height: 250px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.tile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
}

.tile-cases h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  cursor: pointer;
  padding: 5px 0;
}

.tile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.tile-uuid,
.tile-url {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-grid-wrapper {
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;
}

.tile-grid {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  padding: 5px 0;
}

/* 滚动条样式 */
.tile-grid-wrapper::-webkit-scrollbar {
  width: 6px;
}

.tile-grid-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tile-grid-wrapper::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.tile-grid-wrapper::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.tile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 100px;
}

.tile-item:hover {
  transform: translateY(-5px);
}

.tile-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-background {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tile-name {
  text-align: center;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tile-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.visitor-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visitor-input-wrapper label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.visitor-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  width: 200px;
  font-family: monospace;
}

.visitor-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.visitor-input-wrapper .refresh-btn {
  padding: 6px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.visitor-input-wrapper .refresh-btn:hover {
  background-color: #45a049;
}

.output-section .cli-section {
  border-top: 2px solid #e0e0e0;
  padding: 15px;
  background-color: #fafafa;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #ddd;
}

.cli-history {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
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
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  position: sticky;
  top: 0;
}

.history-header span {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.clear-history-btn {
  padding: 2px 8px;
  font-size: 11px;
  background-color: #ff5722;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.clear-history-btn:hover {
  background-color: #e64a19;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.history-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
  padding: 20px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background-color: #f9f9f9;
}

.history-cardKey {
  font-size: 11px;
  font-weight: 500;
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.history-action {
  font-size: 11px;
  color: #2196F3;
  white-space: nowrap;
}

.history-command {
  flex: 1;
  font-size: 13px;
  color: #333;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.cli-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
  flex-shrink: 0;
}

.cli-input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-shrink: 0;
}

.cli-input-container input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.cli-input-container button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cli-input-container button:hover {
  background-color: #45a049;
}

.cli-output {
  margin-top: 15px;
  border-top: 1px solid #ddd;
  padding-top: 15px;
  max-height: 120px;
  overflow-y: auto;
  flex-shrink: 0;
}

.cli-output h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
  position: sticky;
  top: 0;
  background-color: #f9f9f9;
  padding-bottom: 5px;
}

.cli-output pre {
  margin: 0;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 150px;
  overflow-y: auto;
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-btn {
  padding: 6px 12px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover {
  background-color: #0b7dda;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.command-category {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.command-category h4 {
  background-color: #f9f9f9;
  padding: 10px 15px;
  margin: 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #ddd;
}

.command-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.command-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.command-item:last-child {
  border-bottom: none;
}

.command-name {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.command-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.command-usage {
  font-size: 13px;
  color: #888;
  background-color: #f9f9f9;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 5px;
  font-family: monospace;
}

.command-example {
  font-size: 13px;
  color: #888;
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: monospace;
}

/* CLI Logs styles */
.no-logs {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.log-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background-color: #f9f9f9;
}

.log-item.success {
  border-left: 4px solid #4CAF50;
}

.log-item.error {
  border-left: 4px solid #f44336;
  background-color: #fff8f8;
}

.log-item.cli {
  background-color: #f9f9f9;
}

.log-item.view {
  background-color: #f0f8ff;
}

.log-type {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  margin-right: 8px;
  background-color: #e0e0e0;
  color: #333;
}

.log-item.cli .log-type {
  background-color: #ffc107;
  color: #333;
}

.log-item.view .log-type {
  background-color: #2196F3;
  color: white;
}

.log-message {
  font-size: 14px;
  margin: 10px 0;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.log-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 13px;
}

.log-details pre {
  margin: 5px 0 0 0;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
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
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.log-status {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.log-item.success .log-status {
  background-color: #e8f5e8;
  color: #4CAF50;
}

.log-item.error .log-status {
  background-color: #ffebee;
  color: #f44336;
}

.log-command {
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  word-break: break-all;
}

.log-response {
  margin-bottom: 10px;
}

.log-response pre {
  margin: 0;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-error {
  color: #f44336;
  font-size: 13px;
  padding: 8px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-top: 5px;
}

.modal-footer {
  padding: 15px;
  border-top: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 0 0 8px 8px;
  text-align: right;
}

.modal-footer button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.modal-footer button:hover {
  background-color: #45a049;
}

.modal-footer button:first-child {
  margin-left: 0;
  background-color: #2196F3;
}

.modal-footer button:first-child:hover {
  background-color: #0b7dda;
}
</style>
