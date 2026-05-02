<template>
  <div class="app">
    <header v-if="!isNodeVisualizationPage" class="header">
      <h1>ANX DEMO</h1>
      <nav class="nav">
        <button @click="goToCorePage" class="nav-btn">Core Page</button>
        <button @click="openLogs" class="nav-btn logs-btn">System Logs</button>
        <button @click="openCommandLogs" class="nav-btn command-logs-btn">命令日志</button>
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
      // 通过事件总线触发系统日志弹窗
      this.$eventBus.emit('openLogs')
    },
    openCommandLogs() {
      // 通过事件总线触发命令日志弹窗
      this.$eventBus.emit('openCommandLogs')
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
  background-color: #f5f5f5;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #1a1a1a;
  color: #ffffff;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.nav {
  margin-top: 0;
}

.nav-btn {
  background-color: #333333;
  color: #ffffff;
  border: 1px solid #444444;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-btn:hover {
  background-color: #444444;
  border-color: #555555;
}

.command-logs-btn {
  background-color: #555555;
  color: #ffffff;
  border-color: #666666;
  margin-left: 8px;
}

.command-logs-btn:hover {
  background-color: #666666;
  border-color: #777777;
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
  background-color: #2a2a2a;
  color: #999999;
  padding: 1rem;
  text-align: center;
  margin-top: auto;
}

.required-mark {
  color: #999999;
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
  border: 3px solid #d0d0d0;
  border-top-color: #333333;
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
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  color: #666;
}

/* 闪烁的点 */
.loading-dots {
  display: flex;
  justify-content: center;
  gap: 4px;
  font-size: 20px;
  color: #666;
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
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #444 0%, #666 100%);
  border-radius: 3px;
  animation: progress-fill 2s ease-in-out infinite;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  color: #666;
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
  border-color: #555 !important;
  background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}
</style>
