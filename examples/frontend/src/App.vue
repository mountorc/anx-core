<template>
  <div class="app">
    <header v-if="!isNodeVisualizationPage" class="header">
      <div class="header-left">
        <h1>ANX DEMO <button @click="toggleAppList" class="app-list-toggle-btn">{{ isAppListOpen ? '▼' : '▶' }}</button></h1>
        <div class="uuid-info">
          <span v-if="currentTileUuid" class="uuid-item">uuid_tile: {{ currentTileUuid }}</span>
          <span v-if="currentUrlTile" class="uuid-item">url_tile: {{ currentUrlTile }}</span>
          <div class="visitor-input-header">
            <label>uuid_visitor:</label>
            <input
              v-model="uuidVisitor"
              placeholder="输入访客uuid"
              class="visitor-input"
              @keyup.enter="handleUpdateUuidVisitor(uuidVisitor)"
            />
            <button @click="handleUpdateUuidVisitor(uuidVisitor)" class="refresh-btn">刷新</button>
          </div>
        </div>
      </div>
      <nav class="nav">
        <button @click="goToCorePage" class="nav-btn">Core Page</button>
        <button @click="openLogs" class="nav-btn logs-btn">System Logs</button>
        <button @click="openCommandLogs" class="nav-btn command-logs-btn">命令日志</button>
      </nav>
    </header>
    
    <!-- 应用列表浮动弹窗 -->
    <div v-if="!isNodeVisualizationPage && isAppListOpen" class="app-list-overlay" @click.self="toggleAppList">
      <div class="app-list-popup">
        <div class="popup-header">
          <h3>Tile Cases</h3>
          <button @click="toggleAppList" class="popup-close-btn">×</button>
        </div>
        <div class="popup-body">
          <AppList
            :hub-list="hubList"
            @select-tile="handleSelectTile"
          />
        </div>
      </div>
    </div>
    
    <main :class="{ 'main-full': isNodeVisualizationPage, 'main': !isNodeVisualizationPage }">
      <router-view />
    </main>
    <footer v-if="!isNodeVisualizationPage" class="footer">
      <p>© 2026 ANX to Markup Converter</p>
    </footer>
  </div>
</template>

<script>
import AppList from './components/AppList.vue';

export default {
  name: 'App',
  components: {
    AppList
  },
  data() {
    return {
      isAppListOpen: false,
      hubList: [],
      uuidVisitor: '',
      currentTileUuid: '',
      currentUrlTile: ''
    };
  },
  computed: {
    isNodeVisualizationPage() {
      return this.$route.path.startsWith('/anx/view') || 
             this.$route.path.startsWith('/anx/markup') ||
             this.$route.path.startsWith('/anx/visitor-pages')
    }
  },
  mounted() {
    this.$eventBus.on('updateHubList', (list) => {
      this.hubList = list;
    });
    this.$eventBus.on('updateUuidVisitor', (uuid) => {
      this.uuidVisitor = uuid;
    });
    this.$eventBus.on('updateTileInfo', (info) => {
      this.currentTileUuid = info.tileUuid;
      this.currentUrlTile = info.urlTile;
    });
  },
  beforeUnmount() {
    this.$eventBus.off('updateHubList');
    this.$eventBus.off('updateUuidVisitor');
    this.$eventBus.off('updateTileInfo');
  },
  methods: {
    toggleAppList() {
      this.isAppListOpen = !this.isAppListOpen;
    },
    handleSelectTile(item) {
      this.isAppListOpen = false;
      if (item.url) {
        this.$eventBus.emit('loadUrlTile', item.url);
      } else {
        this.$eventBus.emit('loadHubTestCase', item.uuid);
      }
    },
    handleUpdateUuidVisitor() {
      this.$eventBus.emit('refreshWithUuidVisitor', this.uuidVisitor);
    },
    goToCorePage() {
      window.open('http://localhost:17888/', '_blank')
    },
    openLogs() {
      this.$eventBus.emit('openLogs')
    },
    openCommandLogs() {
      this.$eventBus.emit('openCommandLogs')
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1e293b;
  background-color: #f1f5f9;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  color: #ffffff;
  padding: 0.65rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header h1 {
  font-size: 18px;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.uuid-info {
  display: flex;
  gap: 10px;
  font-size: 11px;
  flex-wrap: wrap;
  align-items: center;
}

.uuid-item {
  background-color: rgba(255, 255, 255, 0.08);
  padding: 3px 10px;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
}

.visitor-input-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visitor-input-header label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  font-weight: 500;
}

.visitor-input-header .visitor-input {
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  font-size: 12px;
  width: 200px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background-color: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  transition: all 0.2s ease;
}

.visitor-input-header .visitor-input:focus {
  outline: none;
  border-color: #60a5fa;
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.visitor-input-header .refresh-btn {
  padding: 5px 14px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.visitor-input-header .refresh-btn:hover {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.nav {
  margin-top: 0;
  display: flex;
  gap: 8px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 7px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.command-logs-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
  color: #c7d2fe;
  border-color: rgba(139, 92, 246, 0.3);
  margin-left: 0;
}

.command-logs-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.45), rgba(139, 92, 246, 0.45));
  border-color: rgba(139, 92, 246, 0.5);
}

.main {
  flex: 1;
  padding: 1.25rem;
}

.main-full {
  flex: 1;
  padding: 0;
  margin: 0;
  width: 100%;
}

.footer {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #64748b;
  padding: 1rem;
  text-align: center;
  margin-top: auto;
  font-size: 13px;
}

.required-mark {
  color: #94a3b8;
  margin-left: 2px;
  font-weight: bold;
}

/* Running 状态动画 - 黑白设计 */

/* 旋转动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 按钮加载状态 */
button.loading {
  opacity: 0.7;
}

/* 运行中容器 */
.running-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 24px;
}

/* 加载圆环 */
.loading-ring {
  position: relative;
  width: 64px;
  height: 64px;
}

.loading-ring-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  animation: spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.loading-ring-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 加载内容 */
.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.5px;
}

.loading-subtitle {
  font-size: 13px;
  color: #64748b;
}

/* 闪烁的点 */
.loading-dots {
  display: flex;
  justify-content: center;
  gap: 4px;
  font-size: 20px;
  color: #6366f1;
}

.dot {
  animation: dot-blink 1.4s ease-in-out infinite;
}

.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }

@keyframes dot-blink {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 进度条容器 */
.progress-bar-container {
  width: 100%;
  max-width: 200px;
  margin-top: 8px;
}

.progress-bar-track {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 3px;
  animation: progress-fill 2s ease-in-out infinite;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
}

@keyframes progress-fill {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

.progress-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

/* 任务完成动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.task-completed {
  animation: fadeInUp 0.4s ease-out;
}

/* 卡片运行状态 */
.card-running {
  border-color: #6366f1 !important;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.12);
}

/* 应用列表展开按钮 */
.app-list-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
  transition: all 0.2s ease;
}

.app-list-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

/* 应用列表浮动弹窗 */
.app-list-overlay {
  position: fixed;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.app-list-popup {
  background-color: #ffffff;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 100%;
  max-height: 280px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.popup-close-btn {
  width: 32px;
  height: 32px;
  background-color: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.popup-close-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.popup-body {
  flex: 1;
  overflow: auto;
}

.app-list-popup :deep(.app-list-section) {
  border: none;
  padding: 0;
}
</style>
