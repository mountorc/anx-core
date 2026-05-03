<template>
  <div class="visitor-pages-container">
    <div class="visitor-pages-header">
      <h2>页面列表</h2>
      <span class="instance-count">{{ pages.length }} 个实例</span>
    </div>
    
    <div class="visitor-info-bar">
      <span class="visitor-label">Visitor:</span>
      <span class="visitor-value">{{ uuid_visitor }}</span>
    </div>
    
    <div class="pages-list" v-if="pages.length > 0">
      <div 
        class="page-item" 
        v-for="page in pages" 
        :key="page.uuid_page"
        :class="{ active: selectedPage?.uuid_page === page.uuid_page }"
        @click="handlePageClick(page)"
      >
        <div class="page-indicator"></div>
        <div class="page-content">
          <div class="page-title">{{ page.title || '未命名' }}</div>
          <div class="page-id" :title="page.uuid_page">{{ truncateUuid(page.uuid_page) }}</div>
          <div class="page-date">{{ formatDate(page.createdAt) }}</div>
        </div>
        <span class="status-badge" :class="getStatusClass(page)">
          {{ getStatusText(page) }}
        </span>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <div class="empty-icon">📋</div>
      <p>暂无页面数据</p>
      <p class="empty-hint">该 visitor 尚未创建任何页面</p>
    </div>
    
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ selectedPage?.title || '页面预览' }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modalLoading" class="loading-content">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="modalError" class="error-content">
            <p>{{ modalError }}</p>
          </div>
          <div v-else-if="nodesStructure && visualizationHTML" class="anx-view-container">
            <div ref="anxViewContainer"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VisitorPages',
  props: {
    uuid_visitor: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      pages: [],
      selectedPage: null,
      showModal: false,
      modalLoading: false,
      modalError: '',
      nodesStructure: null,
      visualizationHTML: ''
    };
  },
  refs: ['anxViewContainer'],
  mounted() {
    if (this.uuid_visitor) {
      this.loadPages();
    }
  },
  watch: {
    uuid_visitor: {
      handler(newValue) {
        if (newValue) {
          this.loadPages();
        }
      },
      immediate: true
    }
  },
  methods: {
    async loadPages() {
      console.log('[VisitorPages] loadPages called with uuid_visitor:', this.uuid_visitor);
      try {
        const url = `http://localhost:7887/api/pages/by-visitor/${this.uuid_visitor}`;
        console.log('[VisitorPages] Fetching:', url);
        const response = await fetch(url);
        console.log('[VisitorPages] Response status:', response.status);
        if (response.ok) {
          const result = await response.json();
          console.log('[VisitorPages] Response result:', result);
          if (result && result.success) {
            this.pages = result.data || [];
            console.log('[VisitorPages] Pages loaded:', this.pages.length);
            if (this.pages.length > 0 && !this.selectedPage) {
              this.selectedPage = this.pages[0];
            }
          } else {
            console.log('[VisitorPages] Result not successful:', result);
          }
        } else {
          console.log('[VisitorPages] Response not ok:', response.statusText);
        }
      } catch (error) {
        console.error('[VisitorPages] Error loading pages:', error);
        this.pages = [];
      }
    },
    async handlePageClick(page) {
      this.selectedPage = page;
      this.$emit('pageClick', page);
      
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PAGE_SELECTED',
          page: page,
          timestamp: new Date().toISOString()
        }, '*');
      }
      
      await this.openAnxViewModal(page);
    },
    async openAnxViewModal(page) {
      this.showModal = true;
      this.modalLoading = true;
      this.modalError = '';
      this.nodesStructure = null;
      this.visualizationHTML = '';
      
      try {
        const pageData = await this.fetchPageData(page);
        if (pageData && pageData.nodes) {
          this.nodesStructure = pageData.nodes;
        } else if (page.url_tile) {
          await this.fetchFromUrl(page.url_tile, page.uuid_page);
        } else if (page.uuid_tile) {
          await this.fetchFromTile(page.uuid_tile, page.uuid_page);
        }
        
        if (this.nodesStructure && !this.visualizationHTML) {
          await this.fetchVisualization(page.uuid_page);
        }
      } catch (error) {
        console.error('[VisitorPages] Error loading ANX view:', error);
        this.modalError = '加载页面失败: ' + error.message;
      } finally {
        this.modalLoading = false;
        await this.$nextTick();
        this.createAnxViewElement();
      }
    },
    async fetchVisualization(uuid_page) {
      const vizResponse = await fetch('http://localhost:7887/api/visualize-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          node: this.nodesStructure,
          uuid_page: uuid_page
        })
      });

      if (!vizResponse.ok) {
        throw new Error('Failed to fetch visualization');
      }

      const vizResult = await vizResponse.json();
      this.visualizationHTML = vizResult.html || '';
    },
    createAnxViewElement() {
      const container = this.$refs.anxViewContainer;
      if (!container || !this.nodesStructure || !this.visualizationHTML) {
        return;
      }
      
      container.innerHTML = '';
      
      const anxView = document.createElement('anx-view');
      anxView.setAttribute('nodes-structure', JSON.stringify(this.nodesStructure));
      anxView.setAttribute('visualization-html', this.visualizationHTML);
      container.appendChild(anxView);
    },
    async fetchPageData(page) {
      try {
        const response = await fetch(`http://localhost:7887/api/pages/${page.uuid_page}`);
        if (response.ok) {
          const result = await response.json();
          return result.data;
        }
      } catch (error) {
        console.error('[VisitorPages] Error fetching page data:', error);
      }
      return null;
    },
    async fetchFromUrl(url, uuid_page) {
      const nodesResponse = await fetch('http://localhost:7887/api/getNodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url_tile: url, 
          uuid_page: uuid_page,
          uuid_visitor: this.uuid_visitor
        })
      });

      if (!nodesResponse.ok) {
        throw new Error('Failed to fetch nodes structure');
      }

      const nodesResult = await nodesResponse.json();
      if (!nodesResult.nodes) {
        throw new Error('Failed to get nodes structure from response');
      }

      this.nodesStructure = nodesResult.nodes;

      const vizResponse = await fetch('http://localhost:7887/api/visualize-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nodes: this.nodesStructure,
          uuid_page: uuid_page
        })
      });

      if (!vizResponse.ok) {
        throw new Error('Failed to fetch visualization');
      }

      const vizResult = await vizResponse.json();
      this.visualizationHTML = vizResult.html || '';
    },
    async fetchFromTile(uuid_tile, uuid_page) {
      const nodesResponse = await fetch('http://localhost:7887/api/getNodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          uuid_tile: uuid_tile, 
          uuid_page: uuid_page,
          uuid_visitor: this.uuid_visitor
        })
      });

      if (!nodesResponse.ok) {
        throw new Error('Failed to fetch nodes structure');
      }

      const nodesResult = await nodesResponse.json();
      if (!nodesResult.nodes) {
        throw new Error('Failed to get nodes structure from response');
      }

      this.nodesStructure = nodesResult.nodes;

      const vizResponse = await fetch('http://localhost:7887/api/visualize-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nodes: this.nodesStructure,
          uuid_page: uuid_page
        })
      });

      if (!vizResponse.ok) {
        throw new Error('Failed to fetch visualization');
      }

      const vizResult = await vizResponse.json();
      this.visualizationHTML = vizResult.html || '';
    },
    closeModal() {
      this.showModal = false;
      this.modalLoading = false;
      this.modalError = '';
      this.nodesStructure = null;
      this.visualizationHTML = '';
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month}月${day}日 ${hours}:${minutes}`;
    },
    truncateUuid(uuid) {
      if (!uuid) return '';
      if (uuid.length <= 20) return uuid;
      return uuid.substring(0, 10) + '...' + uuid.substring(uuid.length - 8);
    },
    getStatusClass(page) {
      const submitStatus = page.data?.submitStatus;
      const processing = page.data?.processing;
      
      if (processing || submitStatus === 'running') {
        return 'status-processing';
      } else if (submitStatus === 'submitted') {
        return 'status-normal';
      } else if (submitStatus === 'completed') {
        return 'status-normal';
      } else {
        return 'status-pending';
      }
    },
    getStatusText(page) {
      const submitStatus = page.data?.submitStatus;
      const processing = page.data?.processing;
      
      if (processing || submitStatus === 'running') {
        return '处理中';
      } else if (submitStatus === 'submitted' || submitStatus === 'completed') {
        return '正常';
      } else {
        return '待提交';
      }
    }
  }
};
</script>

<style scoped>
.visitor-pages-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #f1f5f9;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.visitor-pages-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}

.visitor-pages-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.instance-count {
  margin-left: 8px;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.visitor-info-bar {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.visitor-label {
  font-size: 11px;
  color: #94a3b8;
  margin-right: 6px;
  font-weight: 500;
}

.visitor-value {
  font-size: 11px;
  color: #3b82f6;
  font-family: 'SF Mono', 'Fira Code', monospace;
  word-break: break-all;
}

.pages-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.pages-list::-webkit-scrollbar {
  width: 5px;
}

.pages-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.page-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.page-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.page-item.active {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.page-indicator {
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #3b82f6, #6366f1);
  border-radius: 2px;
  margin-right: 10px;
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.page-title {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-id {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-date {
  display: none;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 10px;
  flex-shrink: 0;
}

.status-normal {
  background: #dcfce7;
  color: #16a34a;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-processing {
  background: #dbeafe;
  color: #2563eb;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 12px;
  color: #cbd5e1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: #fff;
  border-radius: 14px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 14px 14px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: #e2e8f0;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: #f1f5f9;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  margin-top: 16px;
  color: #64748b;
  font-size: 13px;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #ef4444;
  font-size: 13px;
}

.anx-view-container {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  min-height: 400px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
</style>