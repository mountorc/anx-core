<template>
  <div class="system-logs-modal">
    <div class="modal-overlay" @click="close"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>系统日志列表</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
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
              <span :class="['log-level', getLevelClass(log.level)]">
                <span class="level-icon">{{ getLevelIcon(log.level) }}</span>
                {{ getLevelLabel(log.level) }}
              </span>
              <span class="log-message">{{ log.message }}</span>
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
  name: 'SystemLogsModal',
  emits: ['close'],
  data() {
    return {
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
  mounted() {
    this.queryLogs();
  },
  methods: {
    async queryLogs() {
      this.loading = true;
      this.error = null;
      this.selectedIndex = null;
      
      try {
        const response = await fetch('http://localhost:7887/log/system-logs.json');
        if (response.ok) {
          const data = await response.json();
          this.logs = data.list || data || [];
        } else {
          this.error = '查询失败';
        }
      } catch (error) {
        console.error('查询系统日志失败:', error);
        this.error = '查询失败: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    selectLog(index) {
      this.selectedIndex = index;
    },
    close() {
      this.$emit('close');
    },
    getLevelClass(level) {
      const classes = {
        'info': 'level-info',
        'warning': 'level-warning',
        'error': 'level-error',
        'debug': 'level-debug'
      };
      return classes[level] || 'level-default';
    },
    getLevelIcon(level) {
      const icons = {
        'info': 'ℹ️',
        'warning': '⚠️',
        'error': '❌',
        'debug': '🔍'
      };
      return icons[level] || '📋';
    },
    getLevelLabel(level) {
      const labels = {
        'info': '信息',
        'warning': '警告',
        'error': '错误',
        'debug': '调试'
      };
      return labels[level] || level || '未知';
    }
  }
};
</script>

<style scoped>
.system-logs-modal {
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
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  background: white;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
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
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 14px 14px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
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
  flex: 1;
  overflow-y: auto;
  min-height: 400px;
  padding: 12px;
}

.loading,
.error,
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #94a3b8;
  font-size: 13px;
}

.error {
  color: #ef4444;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.log-item:hover {
  border-color: #93c5fd;
  background: #f8fafc;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.08);
}

.log-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.log-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  flex-wrap: wrap;
}

.log-time {
  font-size: 11px;
  color: #64748b;
  min-width: 160px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.log-level {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  min-width: 60px;
  justify-content: center;
}

.level-icon {
  font-size: 12px;
}

.level-info {
  background: #dbeafe;
  color: #2563eb;
}

.level-warning {
  background: #fef3c7;
  color: #d97706;
}

.level-error {
  background: #fee2e2;
  color: #ef4444;
}

.level-debug {
  background: #f1f5f9;
  color: #64748b;
}

.level-default {
  background: #f1f5f9;
  color: #64748b;
}

.log-message {
  font-size: 13px;
  color: #334155;
  flex: 1;
  min-width: 200px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 0 0 14px 14px;
}

.log-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.close-modal-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.close-modal-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}
</style>
