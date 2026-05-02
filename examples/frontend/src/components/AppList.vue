<template>
  <div class="app-list-section">
    <div class="category-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count">{{ getCategoryCount(tab.key) }}</span>
      </button>
    </div>
    
    <div class="tile-grid-wrapper">
      <div class="tile-grid">
        <div v-for="item in filteredItems" :key="item.uuid" class="tile-item" @click="handleSelectTile(item.uuid)">
          <div class="tile-icon">
            <div :class="['icon-background', { turan: activeTab === 'turan' }]">{{ item.name.charAt(0) }}</div>
          </div>
          <div class="tile-name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppList',
  props: {
    hubList: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-tile'],
  data() {
    return {
      activeTab: 'normal',
      tabs: [
        { key: 'normal', label: '普通组件' },
        { key: 'turan', label: 'Turan图片处理' }
      ]
    };
  },
  computed: {
    filteredItems() {
      if (this.activeTab === 'turan') {
        return this.hubList.filter(item => item.category === 'turan');
      }
      return this.hubList.filter(item => item.category !== 'turan');
    }
  },
  methods: {
    getCategoryCount(category) {
      if (category === 'turan') {
        return this.hubList.filter(item => item.category === 'turan').length;
      }
      return this.hubList.filter(item => item.category !== 'turan').length;
    },
    handleSelectTile(uuid) {
      this.$emit('select-tile', uuid);
    }
  }
}
</script>

<style scoped>
.app-list-section {
  background-color: #ffffff;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.category-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background-color: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.tab-btn.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.tab-count {
  font-size: 11px;
  background-color: rgba(0, 0, 0, 0.08);
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
}

.tab-btn.active .tab-count {
  background-color: rgba(255, 255, 255, 0.25);
}

.tile-grid-wrapper {
  flex: 1;
  max-height: 450px;
  overflow-y: auto;
  overflow-x: hidden;
}

.tile-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px;
}

.tile-grid-wrapper::-webkit-scrollbar {
  width: 6px;
}

.tile-grid-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.tile-grid-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.tile-grid-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.tile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 110px;
  padding: 8px;
  border-radius: 10px;
}

.tile-item:hover {
  transform: translateY(-4px);
  background: #f8fafc;
}

.tile-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-background {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  transition: all 0.2s ease;
}

.tile-item:hover .icon-background {
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
  transform: scale(1.05);
}

.icon-background.turan {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}

.tile-item:hover .icon-background.turan {
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
}

.tile-name {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>