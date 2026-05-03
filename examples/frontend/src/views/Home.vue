<template>
  <div class="home-container">
    <!-- 页面列表侧边栏 -->
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
    
    <!-- AnxViewer 组件 -->
    <AnxViewer
      :url-tile="currentUrlTile"
      :uuid-tile="currentTileUuid"
      :uuid-visitor="uuidVisitor"
      :page-list="pageList"
      :current-uuid-page.sync="currentUuidPage"
      @update:page-list="pageList = $event"
    />
    
    <!-- 命令日志弹窗 -->
    <CommandLogsModal
      v-if="showCommandLogsModal"
      @close="showCommandLogsModal = false"
    />
    
    <!-- 系统日志弹窗 -->
    <SystemLogsModal
      v-if="showSystemLogsModal"
      @close="showSystemLogsModal = false"
    />
  </div>
</template>

<script>
import CommandLogsModal from '../components/CommandLogsModal.vue';
import SystemLogsModal from '../components/SystemLogsModal.vue';
import AnxViewer from '../components/AnxViewer.vue';

export default {
  name: 'Home',
  components: {
    CommandLogsModal,
    SystemLogsModal,
    AnxViewer
  },
  data() {
    return {
      anxInput: '',
      hubList: [],
      currentTileUuid: '',
      currentUrlTile: '',
      uuidVisitor: '',
      currentUuidPage: '',
      pageList: [],
      isSidebarHidden: false,
      showCommandLogsModal: false,
      showSystemLogsModal: false
    };
  },
  async mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlTile = !!urlParams.get('url_tile');
    const hasUuidTile = !!urlParams.get('uuid_tile');
    const uuidVisitor = urlParams.get('uuid_visitor');
    
    if (uuidVisitor) {
      this.uuidVisitor = uuidVisitor;
      this.$eventBus.emit('updateUuidVisitor', uuidVisitor);
    }

    // 先加载 hubList
    await this.loadHubList();

    // 然后检查 URL 参数并初始化
    if (hasUrlTile || hasUuidTile) {
      if (urlParams.get('url_tile')) {
        this.currentUrlTile = urlParams.get('url_tile');
        this.currentTileUuid = '';
      } else if (urlParams.get('uuid_tile')) {
        this.currentTileUuid = urlParams.get('uuid_tile');
        this.currentUrlTile = '';
      }
      this.updateUrlWithTileInfo();
      this.$eventBus.emit('updateTileInfo', {
        tileUuid: this.currentTileUuid,
        urlTile: this.currentUrlTile
      });
    } else {
      // 加载默认 tile
      const defaultTile = this.hubList.find(item => item.isDefault);
      if (defaultTile) {
        console.log('[Default] Loading default tile:', defaultTile);
        await this.loadTileByItem(defaultTile);
      }
    }

    // 绑定事件监听
    this.$eventBus.on('loadHubTestCase', this.loadHubTestCase);
    this.$eventBus.on('loadUrlTile', this.loadUrlTile);
    this.$eventBus.on('refreshWithUuidVisitor', this.refreshWithUuidVisitor);
    this.$eventBus.on('openCommandLogs', this.openCommandLogsModal);
    this.$eventBus.on('openLogs', this.openSystemLogsModal);

    // 初始化文件上传
    this.initFileUploads();
  },
  beforeUnmount() {
    this.$eventBus.off('loadHubTestCase');
    this.$eventBus.off('loadUrlTile');
    this.$eventBus.off('refreshWithUuidVisitor');
    this.$eventBus.off('openCommandLogs');
    this.$eventBus.off('openLogs');
  },
  methods: {
    async loadHubList() {
      try {
        const response = await fetch('http://localhost:7887/api/tiles/list');
        const data = await response.json();
        if (data.success) {
          this.hubList = data.data;
          this.$eventBus.emit('updateHubList', data.data);
        }
      } catch (error) {
        console.error('Error loading tiles list:', error);
      }
    },
    
    async loadTileByItem(item) {
      if (item.url) {
        await this.loadUrlTile(item.url);
      } else {
        await this.loadHubTestCase(item.uuid);
      }
    },
    
    async loadHubTestCase(uuid) {
      try {
        const response = await fetch(`http://localhost:7887/api/hub/${uuid}`);
        const data = await response.json();
        if (data.success) {
          this.currentTileUuid = uuid;
          this.currentUrlTile = '';
          this.updateUrlWithTileInfo();
          this.$eventBus.emit('updateTileInfo', {
            tileUuid: this.currentTileUuid,
            urlTile: ''
          });
          
          // 获取页面列表
          await this.fetchPageList(uuid);
        }
      } catch (error) {
        console.error('Error loading hub tile case:', error);
      }
    },
    
    async loadUrlTile(url) {
      try {
        this.currentUrlTile = url;
        this.currentTileUuid = '';
        this.updateUrlWithTileInfo();
        this.$eventBus.emit('updateTileInfo', {
          tileUuid: '',
          urlTile: this.currentUrlTile
        });
        
        // 获取页面列表
        await this.fetchPageListByUrl(url);
      } catch (error) {
        console.error('Error loading url tile:', error);
      }
    },
    
    updateUrlWithTileInfo() {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (this.uuidVisitor) {
        urlParams.set('uuid_visitor', this.uuidVisitor);
      }
      
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
    
    async refreshWithUuidVisitor(uuid) {
      if (uuid) {
        this.uuidVisitor = uuid;
        this.updateUrlWithTileInfo();
      }
    },
    
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
    
    switchPage(uuid_page) {
      this.currentUuidPage = uuid_page;
    },
    
    async createNewPage() {
      const newUuid = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.currentUuidPage = newUuid;
      
      if (this.currentUrlTile) {
        await this.fetchPageListByUrl(this.currentUrlTile);
      } else if (this.currentTileUuid) {
        await this.fetchPageList(this.currentTileUuid);
      }
    },
    
    toggleSidebar() {
      this.isSidebarHidden = !this.isSidebarHidden;
    },
    
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
    
    openCommandLogsModal() {
      this.showCommandLogsModal = true;
    },
    
    openSystemLogsModal() {
      this.showSystemLogsModal = true;
    },
    
    initFileUploads() {
      // 保留文件上传功能
      window.handleFileChange = () => {};
      window.removeFile = () => {};
    }
  }
};
</script>

<style scoped>
.home-container {
  display: flex;
  gap: 0;
  height: 100%;
}

/* 页面列表侧边栏样式 */
.page-list-sidebar {
  width: 280px;
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
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
  border-color: #6366f1;
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
</style>

