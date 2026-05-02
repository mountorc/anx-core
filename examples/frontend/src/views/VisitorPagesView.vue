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
  background: #f1f5f9;
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
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.instruction-card h3 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.instruction-card p {
  margin: 12px 0;
  color: #64748b;
  font-size: 14px;
}

.instruction-card code {
  display: block;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  word-break: break-all;
  margin: 12px 0;
  color: #6366f1;
  border: 1px solid #e2e8f0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.input-wrapper input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-wrapper button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.input-wrapper button:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.input-wrapper button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>