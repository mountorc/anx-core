<template>
  <div v-if="loading" class="loading">Loading...</div>
  <pre v-else-if="markup" class="markup-pre">{{ markup }}</pre>
  <div v-else class="error">{{ error || 'No markup data' }}</div>
</template>

<script>
export default {
  name: 'ANXMarkupPage',
  data() {
    return {
      loading: true,
      error: '',
      markup: ''
    };
  },
  mounted() {
    this.initTile();
  },
  watch: {
    '$route'(newRoute) {
      this.initTile();
    }
  },
  methods: {
    initTile() {
      const uuid = this.$route.params.uuid_tile;
      const urlTile = this.$route.query.url_tile;
      
      if (urlTile) {
        this.fetchMarkupFromUrl(urlTile);
      } else if (uuid) {
        this.fetchMarkup(uuid);
      }
    },
    async fetchMarkupFromUrl(url) {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await fetch('/api/convert-to-markup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url_tile: url })
        });
        
        const result = await response.json();
        
        if (result.markup) {
          this.markup = result.markup;
        } else {
          this.error = result.error || 'Failed to load markup';
        }
      } catch (error) {
        this.error = 'Error loading markup: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchMarkup(uuid) {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await fetch('/api/convert-to-markup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uuid_tile: uuid })
        });
        
        const result = await response.json();
        
        if (result.markup) {
          this.markup = result.markup;
        } else {
          this.error = result.error || 'Failed to load markup';
        }
      } catch (error) {
        this.error = 'Error loading markup: ' + error.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.loading, .error {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  margin: 0;
  padding: 0;
}

.markup-pre {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  padding: 20px;
  overflow: auto;
  box-sizing: border-box;
}
</style>