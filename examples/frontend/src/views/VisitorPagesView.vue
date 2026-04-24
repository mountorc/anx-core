<template>
  <div class="visitor-pages-view">
    <VisitorPages 
      v-if="currentVisitor"
      :uuid_visitor="currentVisitor" 
      @pageClick="handlePageSelect"
      @addPage="handleAddPage"
    />
    
    <div class="instructions" v-else>
      <div class="instruction-card">
        <h3>📖 使用说明</h3>
        <p>通过 URL 参数传递 uuid_visitor</p>
        <code>http://localhost:17888/anx/visitor-pages?uuid_visitor=xxx</code>
        
        <div class="input-wrapper">
          <input 
            type="text" 
            v-model="inputVisitor" 
            placeholder="请输入 visitor UUID"
            @keyup.enter="loadPages"
          />
          <button @click="loadPages" :disabled="!inputVisitor">加载页面</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VisitorPages from '../components/VisitorPages.vue';

export default {
  name: 'VisitorPagesView',
  components: {
    VisitorPages
  },
  data() {
    return {
      inputVisitor: '',
      currentVisitor: ''
    };
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const uuid_visitor = urlParams.get('uuid_visitor');
    
    if (uuid_visitor) {
      this.inputVisitor = uuid_visitor;
      this.loadPages();
    }
  },
  methods: {
    loadPages() {
      if (!this.inputVisitor.trim()) {
        alert('请输入 visitor UUID');
        return;
      }
      this.currentVisitor = this.inputVisitor.trim();
    },
    handlePageSelect(page) {
      console.log('Selected page:', page);
    },
    handleAddPage({ uuid_visitor }) {
      if (!uuid_visitor) {
        alert('请先选择一个 visitor');
        return;
      }
      
      const urlParams = new URLSearchParams({ uuid_visitor });
      window.open(`/anx/view?${urlParams.toString()}`, '_blank');
    }
  }
};
</script>

<style scoped>
.visitor-pages-view {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  background: #f5f5f5;
}

.instructions {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.instruction-card {
  width: 100%;
  max-width: 500px;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.instruction-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.instruction-card p {
  margin: 12px 0;
  color: #666;
  font-size: 14px;
}

.instruction-card code {
  display: block;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  margin: 12px 0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.input-wrapper input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.input-wrapper button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.input-wrapper button:hover:not(:disabled) {
  background: #5a6fd6;
}

.input-wrapper button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>