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
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background-color: #e8e8e8;
}

.tab-btn.active {
  background-color: #555;
  color: white;
}

.tab-count {
  font-size: 12px;
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
}

.tab-btn.active .tab-count {
  background-color: rgba(255, 255, 255, 0.2);
}

.tile-grid-wrapper {
  flex: 1;
  max-height: 450px;
  overflow-y: auto;
  overflow-x: hidden;
}

.tile-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 16px;
}

.tile-grid-wrapper::-webkit-scrollbar {
  width: 8px;
}

.tile-grid-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tile-grid-wrapper::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.tile-grid-wrapper::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.tile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 110px;
}

.tile-item:hover {
  transform: translateY(-5px);
}

.tile-icon {
  width: 68px;
  height: 68px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-background {
  width: 68px;
  height: 68px;
  border-radius: 12px;
  background-color: #555;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: bold;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
}

.icon-background.turan {
  background-color: #6c757d;
  border: 2px solid #555;
}

.tile-name {
  text-align: center;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>