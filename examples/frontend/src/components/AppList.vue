<template>
  <div class="app-list-section">
    <div class="tile-grid-wrapper">
      <div class="tile-grid">
        <div v-for="item in hubList" :key="item.uuid" class="tile-item" @click="handleSelectTile(item.uuid)">
          <div class="tile-icon">
            <div class="icon-background">{{ item.name.charAt(0) }}</div>
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
  methods: {
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
}

.tile-grid-wrapper {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
}

.tile-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 5px 0;
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
  width: 120px;
}

.tile-item:hover {
  transform: translateY(-5px);
}

.tile-icon {
  width: 72px;
  height: 72px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-background {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background-color: #555;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
}

.tile-name {
  text-align: center;
  font-size: 15px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
