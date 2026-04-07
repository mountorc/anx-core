<template>
  <div class="app">
    <header v-if="!isNodeVisualizationPage" class="header">
      <h1>ANX to Markup Converter</h1>
      <nav class="nav">
        <button @click="goToCorePage" class="nav-btn">Core Page</button>
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
      return this.$route.path.startsWith('/anx/view/')
    }
  },
  methods: {
    goToCorePage() {
      window.open('http://localhost:17888/', '_blank')
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
  padding: 1rem;
  text-align: center;
}

.nav {
  margin-top: 10px;
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
</style>
