<template>
  <div class="visitor-pages-container">
    <div class="visitor-pages-header">
      <h2>页面列表</h2>
      <span class="instance-count">{{ pages.length }} 个实例</span>
      <button class="add-btn" @click="handleAddPage">
        <span class="add-icon">+</span>
      </button>
      <button class="back-btn" @click="handleBack">
        <span class="back-icon">‹</span>
      </button>
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
          <div class="page-id">{{ page.uuid_page }}</div>
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
  </div>
</template>

<script>
import { communicateWithBackend } from '../utils/postCore.js';

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
      selectedPage: null
    };
  },
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
            // 默认选中第一个页面
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
    handlePageClick(page) {
      this.selectedPage = page;
      this.$emit('pageClick', page);
      
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PAGE_SELECTED',
          page: page,
          timestamp: new Date().toISOString()
        }, '*');
      }
    },
    handleAddPage() {
      this.$emit('addPage', { uuid_visitor: this.uuid_visitor });
    },
    handleBack() {
      this.$emit('back');
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
  background: #f5f5f5;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.visitor-pages-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: relative;
}

.visitor-pages-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.instance-count {
  margin-left: 12px;
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.add-btn {
  position: absolute;
  right: 50px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2196f3;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.add-btn:hover {
  background: #1976d2;
}

.add-icon {
  line-height: 1;
}

.back-btn {
  position: absolute;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  border: none;
  color: #666;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.back-btn:hover {
  background: #e0e0e0;
}

.back-icon {
  line-height: 1;
  font-size: 24px;
}

.visitor-info-bar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.visitor-label {
  font-size: 12px;
  color: #999;
  margin-right: 8px;
}

.visitor-value {
  font-size: 12px;
  color: #1976d2;
  font-family: monospace;
  word-break: break-all;
}

.pages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.page-item {
  display: flex;
  align-items: stretch;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.page-item:hover {
  background: #f8f9fa;
}

.page-item.active {
  background: #e3f2fd;
  border-color: #90caf9;
}

.page-indicator {
  width: 4px;
  background: #2196f3;
  border-radius: 2px;
  margin-right: 12px;
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  overflow: hidden;
}

.page-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  font-size: 14px;
}

.page-id {
  font-family: monospace;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  word-break: break-all;
}

.page-date {
  font-size: 12px;
  color: #bbb;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  align-self: flex-start;
  margin-left: 12px;
  flex-shrink: 0;
}

.status-normal {
  background: #e8f5e9;
  color: #4caf50;
}

.status-pending {
  background: #fff3e0;
  color: #ff9800;
}

.status-processing {
  background: #e3f2fd;
  color: #2196f3;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 12px;
  color: #bbb;
}
</style>