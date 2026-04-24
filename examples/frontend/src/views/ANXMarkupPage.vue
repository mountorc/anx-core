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
      markup: '',
      uuidPage: '',
      uuidVisitor: null
    };
  },
  async mounted() {
    // 初始化 uuid_visitor（从 URL 参数）
    const urlUuidVisitor = this.$route.query.uuid_visitor;
    if (urlUuidVisitor) {
      this.uuidVisitor = urlUuidVisitor;
      console.log(`[ANXMarkupPage] uuid_visitor from URL: ${urlUuidVisitor}`);
    }
    
    // 生成或获取 uuid_page
    this.uuidPage = await this.generateUuidPage();
    this.initTile();
  },
  watch: {
    '$route'(newRoute) {
      // 更新 uuid_visitor（如果URL参数中有变化）
      const urlUuidVisitor = newRoute.query.uuid_visitor;
      if (urlUuidVisitor && urlUuidVisitor !== this.uuidVisitor) {
        this.uuidVisitor = urlUuidVisitor;
        console.log(`[ANXMarkupPage] uuid_visitor updated from URL: ${urlUuidVisitor}`);
      }
      this.initTile();
    }
  },
  methods: {
    async generateUuidPage() {
      if (this.$route.query.uuid_page) {
        return this.$route.query.uuid_page;
      }
      
      const uuid = this.$route.params.uuid_tile;
      const urlTile = this.$route.query.url_tile;
      
      if (uuid) {
        try {
          const response = await fetch(`http://localhost:7887/api/pages/by-tile/${uuid}`);
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              const lastPage = pages[0];
              console.log(`[ANXMarkupPage] Using last existing page by uuid_tile: ${lastPage.uuid_page}`);
              return lastPage.uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list for default:', error);
        }
      } else if (urlTile) {
        try {
          const url = new URL('http://localhost:7887/api/pages/by-url-tile');
          url.searchParams.set('url_tile', urlTile);
          if (this.uuidVisitor) {
            url.searchParams.set('uuid_visitor', this.uuidVisitor);
          }
          const response = await fetch(url.toString());
          if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            if (pages.length > 0) {
              const lastPage = pages[0];
              console.log(`[ANXMarkupPage] Using last existing page by url_tile: ${lastPage.uuid_page}`);
              return lastPage.uuid_page;
            }
          }
        } catch (error) {
          console.error('Error fetching page list by url_tile:', error);
        }
      }
      
      const newUuid = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log(`[ANXMarkupPage] Creating new page: ${newUuid}`);
      return newUuid;
    },
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
        const encodedUrl = encodeURIComponent(url);
        let apiUrl = `http://localhost:7887/api/markup?url_tile=${encodedUrl}`;
        
        // 添加 uuid_page 参数
        if (this.uuidPage) {
          apiUrl += `&uuid_page=${encodeURIComponent(this.uuidPage)}`;
        }
        
        // 添加 uuid_visitor 参数
        if (this.uuidVisitor) {
          apiUrl += `&uuid_visitor=${encodeURIComponent(this.uuidVisitor)}`;
        }
        
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          this.markup = await response.text();
        } else {
          this.error = await response.text() || 'Failed to load markup';
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
        let apiUrl = `http://localhost:7887/api/markup?uuid_tile=${uuid}`;
        
        // 添加 uuid_page 参数
        if (this.uuidPage) {
          apiUrl += `&uuid_page=${encodeURIComponent(this.uuidPage)}`;
        }
        
        // 添加 uuid_visitor 参数
        if (this.uuidVisitor) {
          apiUrl += `&uuid_visitor=${encodeURIComponent(this.uuidVisitor)}`;
        }
        
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          this.markup = await response.text();
        } else {
          this.error = await response.text() || 'Failed to load markup';
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