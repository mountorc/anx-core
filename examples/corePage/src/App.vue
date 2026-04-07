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
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 16px;
}

.main {
  background: #f9f9f9;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
</style>