<template>
  <div class="command-logs-modal" v-if="isVisible">
    <div class="modal-overlay" @click="close"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>命令日志列表</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="modal-filters">
        <div class="filter-item">
          <label>uuid_visitor:</label>
          <input 
            v-model="filters.uuid_visitor" 
            type="text" 
            placeholder="输入 uuid_visitor"
            @keyup.enter="queryLogs"
          />
        </div>
        <div class="filter-item">
          <label>uuid_page:</label>
          <input 
            v-model="filters.uuid_page" 
            type="text" 
            placeholder="输入 uuid_page"
            @keyup.enter="queryLogs"
          />
        </div>
        <div class="filter-item">
          <label>uuid_tile:</label>
          <input 
            v-model="filters.uuid_tile" 
            type="text" 
            placeholder="输入 uuid_tile"
            @keyup.enter="queryLogs"
          />
        </div>
        <div class="filter-item">
          <label>url_tile:</label>
          <input 
            v-model="filters.url_tile" 
            type="text" 
            placeholder="输入 url_tile"
            @keyup.enter="queryLogs"
          />
        </div>
        <div class="filter-item">
          <label>命令类型:</label>
          <select v-model="filters.action" @change="queryLogs">
            <option value="">全部类型</option>
            <option value="update-node-data">更新节点数据</option>
            <option value="trigger-card-key">触发卡片Key</option>
            <option value="get-node-data">获取节点数据</option>
            <option value="call-api">调用API</option>
          </select>
        </div>
        <button @click="queryLogs" class="query-btn">查询</button>
        <button @click="clearFilters" class="clear-btn">清空</button>
      </div>
      
      <div class="modal-body">
        <div class="left-panel">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <div v-else-if="logs.length === 0" class="no-data">暂无数据</div>
          <div v-else class="logs-list">
            <div 
              v-for="(log, index) in logs" 
              :key="index" 
              :class="['log-item', { active: selectedIndex === index }]"
              @click="selectLog(index)"
            >
              <div class="log-summary">
                <span class="log-time">{{ log.timestamp }}</span>
                <span :class="['log-action', getActionClass(log.commandContent?.action)]">
                  <span class="action-icon">{{ getActionIcon(log.commandContent?.action) }}</span>
                  {{ getActionLabel(log.commandContent?.action) }}
                </span>
                <template v-if="getHighlightInfo(log)">
                  <span v-for="(info, key) in getHighlightInfo(log)" :key="key" :class="['log-tag', getTagClass(key)]">
                    <span class="tag-label">{{ getTagLabel(key) }}:</span>
                    <span class="tag-value">{{ info }}</span>
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
        
        <div class="right-panel">
          <div v-if="!selectedLog" class="empty-detail">
            <div class="empty-icon">📋</div>
            <div class="empty-text">请选择一条日志查看详情</div>
          </div>
          <div v-else class="log-details">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">日志ID</span>
                  <span class="cell-value">{{ selectedLog.uuid }}</span>
                </div>
                <div class="detail-cell" v-if="selectedLog.uuid_visitor">
                  <span class="cell-label">访问者ID</span>
                  <span class="cell-value">{{ selectedLog.uuid_visitor }}</span>
                </div>
                <div class="detail-cell" v-if="selectedLog.uuid_page">
                  <span class="cell-label">页面ID</span>
                  <span class="cell-value">{{ selectedLog.uuid_page }}</span>
                </div>
                <div class="detail-cell" v-if="selectedLog.uuid_tile">
                  <span class="cell-label">组件ID</span>
                  <span class="cell-value">{{ selectedLog.uuid_tile }}</span>
                </div>
                <div class="detail-cell" v-if="selectedLog.url_tile">
                  <span class="cell-label">组件URL</span>
                  <span class="cell-value url-link">{{ selectedLog.url_tile }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">时间</span>
                  <span class="cell-value">{{ selectedLog.timestamp }}</span>
                </div>
              </div>
            </div>
            <div class="detail-section" v-if="getCommandDetails(selectedLog)">
              <h4>命令详情</h4>
              <div class="detail-grid">
                <div v-for="(value, key) in getCommandDetails(selectedLog)" :key="key" class="detail-cell">
                  <span class="cell-label">{{ getDetailLabel(key) }}</span>
                  <span class="cell-value">{{ formatValue(value) }}</span>
                </div>
              </div>
            </div>
            <div class="detail-section">
              <h4>原始数据</h4>
              <pre class="json-content">{{ JSON.stringify(selectedLog.commandContent, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <span class="log-count">共 {{ logs.length }} 条记录</span>
        <button @click="close" class="close-modal-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommandLogsModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      filters: {
        uuid_visitor: '',
        uuid_page: '',
        uuid_tile: '',
        url_tile: '',
        action: ''
      },
      logs: [],
      loading: false,
      error: null,
      selectedIndex: null
    };
  },
  computed: {
    selectedLog() {
      if (this.selectedIndex !== null && this.selectedIndex >= 0 && this.selectedIndex < this.logs.length) {
        return this.logs[this.selectedIndex];
      }
      return null;
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.queryLogs();
      }
    },
    logs() {
      this.selectedIndex = null;
    }
  },
  methods: {
    async queryLogs() {
      this.loading = true;
      this.error = null;
      this.selectedIndex = null;
      
      try {
        const queryParams = new URLSearchParams();
        if (this.filters.uuid_visitor) queryParams.append('uuid_visitor', this.filters.uuid_visitor);
        if (this.filters.uuid_page) queryParams.append('uuid_page', this.filters.uuid_page);
        if (this.filters.uuid_tile) queryParams.append('uuid_tile', this.filters.uuid_tile);
        if (this.filters.url_tile) queryParams.append('url_tile', this.filters.url_tile);
        if (this.filters.action) queryParams.append('action', this.filters.action);
        
        const response = await fetch(`http://localhost:7887/api/command-logs?${queryParams.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          this.logs = data.list || [];
        } else {
          this.error = data.error || '查询失败';
        }
      } catch (error) {
        console.error('查询命令日志失败:', error);
        this.error = '查询失败: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    clearFilters() {
      this.filters = {
        uuid_visitor: '',
        uuid_page: '',
        uuid_tile: '',
        url_tile: '',
        action: ''
      };
      this.queryLogs();
    },
    selectLog(index) {
      this.selectedIndex = index;
    },
    close() {
      this.$emit('close');
    },
    getActionClass(action) {
      const classes = {
        'update-node-data': 'action-update',
        'trigger-card-key': 'action-trigger',
        'get-node-data': 'action-get',
        'call-api': 'action-api'
      };
      return classes[action] || 'action-default';
    },
    getActionIcon(action) {
      const icons = {
        'update-node-data': '✏️',
        'trigger-card-key': '🔑',
        'get-node-data': '📥',
        'call-api': '🌐'
      };
      return icons[action] || '📋';
    },
    getActionLabel(action) {
      const labels = {
        'update-node-data': '更新节点数据',
        'trigger-card-key': '触发卡片Key',
        'get-node-data': '获取节点数据',
        'call-api': '调用API'
      };
      return labels[action] || action || '未知命令';
    },
    getHighlightInfo(log) {
      const info = {};
      const action = log.commandContent?.action;
      
      if (action === 'update-node-data') {
        const nodeId = log.commandContent?.data?.nodeId || log.commandContent?.nodeId;
        const fieldName = log.commandContent?.data?.fieldName || log.commandContent?.fieldName;
        const fieldValue = log.commandContent?.data?.fieldValue || log.commandContent?.fieldValue;
        
        if (nodeId) info.nodeId = this.truncate(nodeId, 20);
        if (fieldName) info.fieldName = fieldName;
        if (fieldValue !== undefined && fieldValue !== null) {
          info.fieldValue = this.truncate(String(fieldValue), 30);
        }
      } else if (action === 'trigger-card-key') {
        const cardKey = log.commandContent?.cardKey || log.commandContent?.data?.cardKey;
        if (cardKey) info.cardKey = this.truncate(cardKey, 30);
      } else if (action === 'call-api') {
        const apiUrl = log.commandContent?.url || log.commandContent?.data?.url;
        const method = log.commandContent?.method || log.commandContent?.data?.method || 'GET';
        if (apiUrl) info.apiUrl = this.truncate(apiUrl, 30);
        info.method = method;
      } else if (action === 'get-node-data') {
        const nodeId = log.commandContent?.nodeId || log.commandContent?.data?.nodeId;
        if (nodeId) info.nodeId = this.truncate(nodeId, 20);
      }
      
      return Object.keys(info).length > 0 ? info : null;
    },
    getTagClass(key) {
      const classes = {
        nodeId: 'tag-node',
        fieldName: 'tag-field',
        fieldValue: 'tag-value-item',
        cardKey: 'tag-card',
        apiUrl: 'tag-api',
        method: 'tag-method'
      };
      return classes[key] || 'tag-default';
    },
    getTagLabel(key) {
      const labels = {
        nodeId: '节点',
        fieldName: '字段',
        fieldValue: '值',
        cardKey: '卡片Key',
        apiUrl: '接口',
        method: '方法'
      };
      return labels[key] || key;
    },
    getCommandDetails(log) {
      const action = log.commandContent?.action;
      const details = {};
      
      if (action === 'update-node-data') {
        const data = log.commandContent?.data || log.commandContent;
        if (data?.nodeId) details.nodeId = data.nodeId;
        if (data?.fieldName) details.fieldName = data.fieldName;
        if (data?.fieldValue !== undefined) details.fieldValue = data.fieldValue;
        if (data?.nodeType) details.nodeType = data.nodeType;
      } else if (action === 'trigger-card-key') {
        const data = log.commandContent?.data || log.commandContent;
        if (data?.cardKey) details.cardKey = data.cardKey;
        if (data?.params) details.params = data.params;
        if (data?.context) details.context = data.context;
      } else if (action === 'call-api') {
        const data = log.commandContent?.data || log.commandContent;
        if (data?.url) details.url = data.url;
        if (data?.method) details.method = data.method;
        if (data?.body) details.body = data.body;
        if (data?.headers) details.headers = data.headers;
      } else if (action === 'get-node-data') {
        const data = log.commandContent?.data || log.commandContent;
        if (data?.nodeId) details.nodeId = data.nodeId;
        if (data?.fields) details.fields = data.fields;
      }
      
      return Object.keys(details).length > 0 ? details : null;
    },
    getDetailLabel(key) {
      const labels = {
        nodeId: '节点ID',
        fieldName: '字段名称',
        fieldValue: '字段值',
        nodeType: '节点类型',
        cardKey: '卡片Key',
        params: '参数',
        context: '上下文',
        url: '接口地址',
        method: '请求方法',
        body: '请求体',
        headers: '请求头',
        fields: '请求字段'
      };
      return labels[key] || key;
    },
    formatValue(value) {
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    },
    truncate(str, length) {
      if (!str) return '';
      str = String(str);
      return str.length > length ? str.substring(0, length) + '...' : str;
    }
  }
};
</script>

<style scoped>
.command-logs-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.modal-container {
  position: relative;
  width: 95%;
  max-width: 1500px;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-filters {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item label {
  font-size: 12px;
  color: #666;
}

.filter-item input,
.filter-item select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  width: 180px;
}

.query-btn,
.clear-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  height: 32px;
}

.query-btn {
  background: #4CAF50;
  color: white;
}

.query-btn:hover {
  background: #45a049;
}

.clear-btn {
  background: #9e9e9e;
  color: white;
}

.clear-btn:hover {
  background: #757575;
}

.modal-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 400px;
}

.left-panel {
  width: 50%;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 12px;
}

.right-panel {
  width: 50%;
  overflow-y: auto;
  padding: 12px;
}

.loading,
.error,
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  font-size: 14px;
}

.error {
  color: #f44336;
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.log-item:hover {
  border-color: #2196F3;
  background: #f8f9fa;
}

.log-item.active {
  border-color: #2196F3;
  background: #e3f2fd;
}

.log-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  flex-wrap: wrap;
}

.log-time {
  font-size: 12px;
  color: #666;
  min-width: 130px;
  font-family: monospace;
}

.log-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: 13px;
  padding: 3px 8px;
  border-radius: 4px;
  min-width: 100px;
  justify-content: center;
}

.action-icon {
  font-size: 13px;
}

.action-update {
  background: #fff3e0;
  color: #e65100;
}

.action-trigger {
  background: #e3f2fd;
  color: #1976D2;
}

.action-get {
  background: #e8f5e9;
  color: #2E7D32;
}

.action-api {
  background: #f3e5f5;
  color: #7B1FA2;
}

.action-default {
  background: #f5f5f5;
  color: #666;
}

.log-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.tag-node {
  background: #fff3e0;
  color: #e65100;
}

.tag-field {
  background: #e3f2fd;
  color: #1976D2;
}

.tag-value-item {
  background: #e8f5e9;
  color: #2E7D32;
}

.tag-card {
  background: #f3e5f5;
  color: #7B1FA2;
}

.tag-api {
  background: #e0f2f1;
  color: #00897b;
}

.tag-method {
  background: #fff9c4;
  color: #f57f17;
}

.tag-default {
  background: #f5f5f5;
  color: #666;
}

.tag-label {
  font-weight: 500;
  opacity: 0.8;
}

.tag-value {
  font-family: monospace;
}

.log-details {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  height: 100%;
  box-sizing: border-box;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  padding-bottom: 6px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.cell-label {
  font-size: 11px;
  color: #999;
  font-weight: 500;
}

.cell-value {
  font-size: 12px;
  color: #333;
  font-family: monospace;
  word-break: break-all;
}

.cell-value.url-link {
  color: #2196F3;
  text-decoration: underline;
  cursor: pointer;
}

.json-content {
  margin: 0;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 250px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #e0e0e0;
}

.log-count {
  font-size: 13px;
  color: #666;
}

.close-modal-btn {
  padding: 8px 20px;
  background: #9e9e9e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.close-modal-btn:hover {
  background: #757575;
}

@media (max-width: 768px) {
  .modal-body {
    flex-direction: column;
  }
  .left-panel,
  .right-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    max-height: 300px;
  }
  .right-panel {
    border-bottom: none;
  }
}
</style>
