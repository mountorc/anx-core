<template>
  <div class="anx-page">
    <div v-if="loading" class="loading-overlay">
      <p>Loading visualization...</p>
    </div>

    <div v-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-show="!error && nodesStructure && visualizationHTML" class="anx-page-layout">
      <div :class="['page-list-sidebar', { hidden: isSidebarHidden }]">
        <div class="sidebar-header">
          <h3>页面列表</h3>
          <div class="header-right">
            <span class="page-count">{{ pageList.length }} 个实例</span>
            <button class="add-page-btn" @click="createNewPage">+</button>
            <button class="collapse-btn" @click="toggleSidebar">‹</button>
          </div>
        </div>
        <div class="visitor-info">
          <span class="visitor-label">Visitor:</span>
          <span :class="['visitor-value', { 'unregistered': !currentUuidVisitor }]">
            {{ currentUuidVisitor || '未注册' }}
          </span>
        </div>
        <div class="page-list">
          <div
            v-for="page in pageList"
            :key="page.uuid_page"
            :class="['page-item', { active: page.uuid_page === uuidPage }]"
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
      <div class="visualization-container">
        <anx-view
          :nodes-structure="JSON.stringify(nodesStructure)"
          :visualization-html="visualizationHTML"
        ></anx-view>
      </div>
    </div>

    <div v-if="!(!error && nodesStructure && visualizationHTML)" class="no-data">
      <p>No visualization data available</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ANXPage',
  props: {
    uuidVisitor: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: true,
      error: '',
      nodesStructure: null,
      visualizationHTML: '',
      visualizationCSS: '',
      uuidPage: '',
      pageList: [],
      uuidTile: '',
      isSidebarHidden: false,
      currentUuidVisitor: null
    };
  },
  async mounted() {
    // 初始化 uuid_visitor（优先级：URL参数 > props）
    const urlUuidVisitor = this.$route.query.uuid_visitor;
    if (urlUuidVisitor) {
      this.currentUuidVisitor = urlUuidVisitor;
      console.log(`[ANXPage] uuid_visitor from URL: ${urlUuidVisitor}`);
    } else if (this.uuidVisitor) {
      this.currentUuidVisitor = this.uuidVisitor;
    }
    
    // 注册全局方法供外部调用
    if (typeof window !== 'undefined') {
      window.setUuidVisitorForANXPage = (uuid) => {
        console.log(`[ANXPage] setUuidVisitorForANXPage called with uuid: ${uuid}`);
        const result = this.setUuidVisitor(uuid);
        console.log(`[ANXPage] setUuidVisitorForANXPage result:`, result);
        return result;
      };
    }
    
    // 生成或获取 uuid_page
    this.uuidPage = await this.generateUuidPage();
    this.initTile();
    
    // 加载ANXView web component
    import('../webComponents/ANXView.js');
  },
  beforeUnmount() {
    // 清理全局方法
    if (typeof window !== 'undefined' && window.setUuidVisitorForANXPage) {
      delete window.setUuidVisitorForANXPage;
    }
  },
  watch: {
    '$route'(newRoute) {
      // 更新 uuid_visitor（如果URL参数中有变化）
      const urlUuidVisitor = newRoute.query.uuid_visitor;
      if (urlUuidVisitor && urlUuidVisitor !== this.currentUuidVisitor) {
        this.currentUuidVisitor = urlUuidVisitor;
        console.log(`[ANXPage] uuid_visitor updated from URL: ${urlUuidVisitor}`);
      }
      this.initTile();
    }
  },
  methods: {
    setUuidVisitor(uuid) {
      this.currentUuidVisitor = uuid;
      console.log(`[ANXPage] uuid_visitor set to: ${uuid}`);
      return { success: true, uuid_visitor: uuid };
    },
    async generateUuidPage() {
      if (this.$route.query.uuid_page) {
        return this.$route.query.uuid_page;
      }
      
      const uuid = this.$route.params.uuid_tile;
      const urlTile = this.$route.query.url_tile;
      
      if (uuid) {
        try {
          const response = await fetch(`http://localhost:7887/api/pages/by-tile/${uuid}`);
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              const lastPage = pages[0];
              console.log(`[ANXPage] Using last existing page by uuid_tile: ${lastPage.uuid_page}`);
              return lastPage.uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list for default:', error);
        }
      } else if (urlTile) {
        try {
          const response = await fetch(`http://localhost:7887/api/pages/by-url-tile?url_tile=${encodeURIComponent(urlTile)}`);
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              const lastPage = pages[0];
              console.log(`[ANXPage] Using last existing page by url_tile: ${lastPage.uuid_page}`);
              return lastPage.uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list by url_tile:', error);
        }
      }
      
      const newUuid = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log(`[ANXPage] Creating new page: ${newUuid}`);
      return newUuid;
    },
    async updateUrlWithUuidPage() {
      const currentUuidPage = this.$route.query.uuid_page;
      // 如果 URL 中没有 uuid_page 参数，或者参数不是有效的字符串，添加它
      if (!currentUuidPage || typeof currentUuidPage !== 'string') {
        // 确保 uuidPage 已生成
        if (!this.uuidPage || typeof this.uuidPage !== 'string') {
          this.uuidPage = await this.generateUuidPage();
        }
        this.$router.replace({
          query: {
            ...this.$route.query,
            uuid_page: this.uuidPage
          }
        });
      }
    },
    async initTile() {
      const uuid = this.$route.params.uuid_tile;
      const urlTile = this.$route.query.url_tile;
      
      this.uuidTile = uuid;
      
      if (!this.uuidPage) {
        this.uuidPage = await this.generateUuidPage();
      }
      
      await this.updateUrlWithUuidPage();
      
      if (uuid) {
        await this.fetchPageList(uuid);
      } else if (urlTile) {
        await this.fetchPageListByUrl(urlTile);
      }
      
      if (urlTile) {
        this.fetchNodeVisualizationFromUrl(urlTile);
      } else if (uuid) {
        this.fetchNodeVisualization(uuid);
      }
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
        const response = await fetch(`http://localhost:7887/api/pages/by-url-tile?url_tile=${encodeURIComponent(url_tile)}`);
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
      this.uuidPage = uuid_page;
      this.$router.replace({
        params: { ...this.$route.params },
        query: {
          ...this.$route.query,
          uuid_page: uuid_page
        }
      });
    },
    async createNewPage() {
      const newUuid = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.uuidPage = newUuid;
      this.$router.replace({
        params: { ...this.$route.params },
        query: {
          ...this.$route.query,
          uuid_page: newUuid
        }
      });
      
      // 更新页面列表
      const uuid = this.$route.params.uuid_tile;
      const urlTile = this.$route.query.url_tile;
      if (uuid) {
        await this.fetchPageList(uuid);
      } else if (urlTile) {
        await this.fetchPageListByUrl(urlTile);
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
    async fetchNodeVisualizationFromUrl(url) {
      this.loading = true;
      this.error = '';

      try {
        // 获取节点结构（通过URL）
        const nodesResponse = await fetch('http://localhost:7887/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            url_tile: url, 
            uuid_page: this.uuidPage,
            uuid_visitor: this.currentUuidVisitor
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

        // 获取可视化数据
        await this.generateNodeVisualization(this.nodesStructure);
      } catch (err) {
        console.error('Error fetching visualization:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchNodeVisualization(uuid) {
      this.loading = true;
      this.error = '';

      try {
        // 获取节点结构
        const nodesResponse = await fetch('http://localhost:7887/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            uuid_tile: uuid, 
            uuid_page: this.uuidPage,
            uuid_visitor: this.currentUuidVisitor
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

        // 获取可视化数据
        await this.generateNodeVisualization(this.nodesStructure);
      } catch (err) {
        console.error('Error fetching visualization:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
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
          throw new Error('Failed to fetch visualization');
        }

        const result = await response.json();
        this.visualizationHTML = result.html;
        this.visualizationCSS = result.css;

        // 动态注入 CSS
        this.$nextTick(() => {
          this.injectVisualizationCSS(result.css);
        });
      } catch (error) {
        console.error('Error generating node visualization:', error);
        this.visualizationHTML = '<div class="anx-error">Error generating node visualization</div>';
      }
    },
    injectVisualizationCSS(css) {
      if (!css) return;

      // 移除旧的样式标签
      const oldStyle = document.getElementById('anx-page-dynamic-style');
      if (oldStyle) {
        oldStyle.remove();
      }

      // 创建新的样式标签
      const style = document.createElement('style');
      style.id = 'anx-page-dynamic-style';
      style.textContent = css;
      document.head.appendChild(style);
    }
  },
  beforeUnmount() {
    // 清理动态样式
    const oldStyle = document.getElementById('anx-page-dynamic-style');
    if (oldStyle) {
      oldStyle.remove();
    }
  }
};
</script>

<style scoped>
.anx-page {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.anx-page-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.page-list-sidebar {
  width: 260px;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.page-list-sidebar.hidden {
  width: 0;
  border-right: none;
  overflow: hidden;
  padding: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-page-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.add-page-btn:hover {
  background-color: #40a9ff;
}

.collapse-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background-color: #f5f5f5;
  color: #666;
}

.expand-btn {
  width: 24px;
  height: 48px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.expand-btn:hover {
  background-color: #f5f5f5;
  color: #666;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.page-count {
  font-size: 12px;
  color: #999;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.page-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.page-item {
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-item:hover {
  background-color: #f5f5f5;
}

.page-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.page-status.normal {
  background-color: #f6ffed;
  color: #52c41a;
}

.page-status.pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.page-status.running {
  background-color: #e6f7ff;
  color: #1890ff;
}

.page-status.submitted {
  background-color: #f6ffed;
  color: #52c41a;
}

.page-uuid {
  font-size: 10px;
  color: #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.visitor-info {
  padding: 8px 16px;
  background-color: #f5f5f5;
  font-size: 11px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.visitor-label {
  color: #999;
}

.visitor-value {
  color: #1890ff;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visitor-value.unregistered {
  color: #999;
}

.page-date {
  font-size: 11px;
  color: #999;
}

.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.empty-list p {
  margin: 0;
  font-size: 13px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1000;
  color: #666;
  font-size: 18px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #666;
  font-size: 18px;
}

.error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #dc3545;
  background: #f8d7da;
  font-size: 18px;
  padding: 20px;
  text-align: center;
}

.visualization-container {
  flex: 1;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: auto;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 18px;
}
</style>
