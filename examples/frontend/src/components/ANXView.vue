<template>
  <div class="visual-section">
    <div class="visual-output">
      <div class="node-visualization" v-if="nodesStructure" ref="visualizationContainer">
        <div ref="htmlContainer"></div>
      </div>
      <div v-else class="no-data">
        No node data available
      </div>
    </div>
  </div>
</template>

<script>
import { triggerDeal, buttonTap } from '../utils/utils.js';

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
  watch: {
    // 监听 visualizationHTML 变化，重新渲染和执行脚本
    visualizationHTML: {
      handler(newValue) {
        this.renderHTML(newValue);
      },
      immediate: true
    }
  },
  mounted() {
    // 组件挂载时的处理
    this.setupEventListeners();
    // 将 buttonTap 函数暴露到全局作用域
    window.buttonTap = buttonTap;
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
      // 调用 triggerDeal 函数
      if (event.detail && event.detail.node && event.detail.node.config) {
        const cardKey = event.detail.node.config.key || event.detail.node.config.id;
        if (cardKey) {
          triggerDeal(cardKey);
        }
      }
    },
    handleNodeDataChanged(event) {
      console.log('NodeVisualization: nodeDataChanged received:', event.detail);
      // 可以在这里处理节点数据变化
    },
    renderHTML(html) {
      const container = this.$refs.htmlContainer;
      if (container) {
        // 清空容器
        container.innerHTML = '';
        
        // 创建一个临时元素来解析 HTML
        const tempElement = document.createElement('div');
        tempElement.innerHTML = html;
        
        // 提取并执行脚本标签
        const scripts = tempElement.querySelectorAll('script');
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          newScript.textContent = script.textContent;
          document.head.appendChild(newScript);
          // 执行完后移除脚本标签
          setTimeout(() => {
            document.head.removeChild(newScript);
          }, 0);
        });
        
        // 移除脚本标签，只保留 HTML 内容
        scripts.forEach(script => {
          script.remove();
        });
        
        // 将剩余的 HTML 内容添加到容器中
        while (tempElement.firstChild) {
          container.appendChild(tempElement.firstChild);
        }
        
      }
    }
  },
  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('triggerEvent', this.handleTriggerEvent);
    window.removeEventListener('nodeDataChanged', this.handleNodeDataChanged);
    // 清理全局变量
    delete window.buttonTap;
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