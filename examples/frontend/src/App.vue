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

/* Running 状态动画 - 精美设计 */

/* 旋转动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 按钮加载状态 */
button.loading {
  opacity: 0.9;
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
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
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
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  color: #333;
  letter-spacing: 0.5px;
}

.loading-subtitle {
  font-size: 13px;
  color: #888;
}

/* 闪烁的点 */
.loading-dots {
  display: flex;
  justify-content: center;
  gap: 4px;
  font-size: 20px;
  color: #667eea;
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
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  animation: progress-fill 2s ease-in-out infinite;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
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
  color: #999;
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
  border-color: #667eea !important;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.15);
}
</style>
