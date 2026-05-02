<template>
  <div class="app">
    <header class="header">
      <h1>ANX Core Page</h1>
      <p>Core Components Rendering Test</p>
    </header>
    
    <main class="main">
      <CoreView />
    </main>
  </div>
</template>

<script setup>
import CoreView from './views/CoreView.vue'
</script>

<style scoped>
.app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h1 {
  color: #1e293b;
  margin-bottom: 8px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header p {
  color: #64748b;
  font-size: 15px;
}

.main {
  background: #ffffff;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}
</style>