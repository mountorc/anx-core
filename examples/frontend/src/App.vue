<template>
  <div class="app">
    <header class="header">
      <h1>ANX to Markup Converter</h1>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <p>© 2026 ANX to Markup Converter</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
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

.main {
  flex: 1;
  padding: 1rem;
}

.footer {
  background-color: #f1f1f1;
  padding: 1rem;
  text-align: center;
  margin-top: auto;
}
</style>
