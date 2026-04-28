<template>
  <div class="app">
    <header v-if="!isNodeVisualizationPage" class="header">
      <h1>ANX DEMO</h1>
      <nav class="nav">
        <button @click="goToCorePage" class="nav-btn">Core Page</button>
        <button @click="openLogs" class="nav-btn logs-btn">Logs</button>
      </nav>
    </header>
    <main :class="{ 'main-full': isNodeVisualizationPage, 'main': !isNodeVisualizationPage }">
      <router-view />
    </main>
    <footer v-if="!isNodeVisualizationPage" class="footer">
      <p>© 2026 ANX to Markup Converter</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isNodeVisualizationPage() {
      return this.$route.path.startsWith('/anx/view') || 
             this.$route.path.startsWith('/anx/markup') ||
             this.$route.path.startsWith('/anx/visitor-pages')
    }
  },
  methods: {
    goToCorePage() {
      window.open('http://localhost:17888/', '_blank')
    },
    openLogs() {
      // 通过事件总线触发日志弹窗
      this.$eventBus.emit('openLogs')
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #4CAF50;
  color: white;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 18px;
  margin: 0;
}

.nav {
  margin-top: 0;
}

.nav-btn {
  background-color: white;
  color: #4CAF50;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.nav-btn:hover {
  background-color: #f0f0f0;
}

.main {
  flex: 1;
  padding: 1rem;
}

.main-full {
  flex: 1;
  padding: 0;
  margin: 0;
  width: 100%;
}

.footer {
  background-color: #f1f1f1;
  padding: 1rem;
  text-align: center;
  margin-top: auto;
}

.required-mark {
  color: #dc3545;
  margin-left: 2px;
  font-weight: bold;
}

/* Running 状态动画 */

/* 加载旋转器 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 按钮脉冲动画 */
button.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 0 8px rgba(255, 152, 0, 0);
  }
}

/* 运行中状态显示区域 */
.running-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff3cd 100%);
  border-radius: 8px;
  border: 1px solid #ffeeba;
}

.status-icon {
  font-size: 24px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.status-text {
  font-size: 14px;
  color: #856404;
  font-weight: 500;
}

.status-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 152, 0, 0.3);
  border-radius: 50%;
  border-top-color: #ff9800;
  animation: spin 0.6s linear infinite;
}

/* 进度条动画 */
.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9800, #ff5722);
  border-radius: 3px;
  animation: progress 2s ease-in-out infinite;
}

@keyframes progress {
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

/* 波纹动画 */
.ripple-container {
  position: relative;
  overflow: hidden;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 152, 0, 0.3);
  transform: scale(0);
  animation: ripple 1.5s ease-out infinite;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 任务完成动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.task-completed {
  animation: fadeInUp 0.4s ease-out;
}

/* 卡片闪烁效果 */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 152, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 152, 0, 0.6);
  }
}

.card-running {
  animation: glow 1.5s ease-in-out infinite;
}
</style>
