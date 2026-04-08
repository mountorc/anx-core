<template>
  <div class="visual-section">
    <div class="visual-output">
      <div class="node-visualization" v-if="nodesStructure" ref="visualizationContainer">
        <div v-html="visualizationHTML"></div>
      </div>
      <div v-else class="no-data">
        No node data available
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ANXView',
  props: {
    nodesStructure: {
      type: Object,
      default: null
    },
    visualizationHTML: {
      type: String,
      default: ''
    }
  },
  mounted() {
    // 组件挂载时的处理
    this.setupEventListeners();
  },
  methods: {
    setupEventListeners() {
      // 监听来自可视化内容的事件
      window.addEventListener('triggerEvent', this.handleTriggerEvent);
      window.addEventListener('nodeDataChanged', this.handleNodeDataChanged);
    },
    handleTriggerEvent(event) {
      console.log('NodeVisualization: triggerEvent received:', event.detail);
      // 可以在这里处理触发事件
    },
    handleNodeDataChanged(event) {
      console.log('NodeVisualization: nodeDataChanged received:', event.detail);
      // 可以在这里处理节点数据变化
    }
  },
  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('triggerEvent', this.handleTriggerEvent);
    window.removeEventListener('nodeDataChanged', this.handleNodeDataChanged);
  }
}
</script>

<style scoped>
.visual-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.visual-output {
  overflow-y: auto;
  min-height: 0;
  height: 100%;
}

.node-visualization {
  min-height: 100%;
  height: 100%;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-style: italic;
}
</style>