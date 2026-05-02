<template>
  <div class="visual-section">
    <div class="visual-header">
      <button class="new-tile-btn" @click="handleNewTile">
        <span class="btn-icon">➕</span>
        <span class="btn-text">新建</span>
      </button>
    </div>
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
        console.log('ANXView: visualizationHTML updated:', newValue);
        this.renderHTML(newValue);
      },
      immediate: true
    },
    // 监听 nodesStructure 变化
    nodesStructure: {
      handler(newValue) {
        console.log('ANXView: nodesStructure updated:', newValue);
      },
      immediate: true
    }
  },
  mounted() {
    // 组件挂载时的处理
    console.log('ANXView: mounted with nodesStructure:', this.nodesStructure);
    console.log('ANXView: mounted with visualizationHTML:', this.visualizationHTML);
    this.setupEventListeners();
    // 将 buttonTap 函数暴露到全局作用域
    window.buttonTap = buttonTap;
  },
  methods: {
    handleNewTile() {
      console.log('=== Handle New Tile ===');
      
      if (!this.nodesStructure) {
        console.warn('No nodesStructure available to create new tile');
        alert('无法创建新 tile：没有可用的节点结构');
        return;
      }
      
      // 生成新的 cardKey
      const newCardKey = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // 深拷贝原始节点结构
      const newNode = JSON.parse(JSON.stringify(this.nodesStructure));
      
      // 更新 cardKey
      newNode.cardKey = newCardKey;
      
      // 更新子节点
      if (newNode.children && Array.isArray(newNode.children)) {
        newNode.children = newNode.children.map(child => {
          const childCopy = JSON.parse(JSON.stringify(child));
          childCopy.cardKey = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          childCopy.parentCardKey = newCardKey;
          return childCopy;
        });
      }
      
      // 重置数据
      if (newNode.data) {
        Object.keys(newNode.data).forEach(key => {
          if (key !== 'config' && key !== 'schema') {
            delete newNode.data[key];
          }
        });
      }
      
      newNode.rebuildTime = new Date().toISOString();
      
      console.log('New tile node created:', newNode);
      
      // 触发新建事件
      this.$emit('newTile', {
        originalCardKey: this.nodesStructure.cardKey,
        newCardKey: newCardKey,
        node: newNode
      });
      
      // 发送消息到父窗口
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'NEW_TILE',
          originalCardKey: this.nodesStructure.cardKey,
          newCardKey: newCardKey,
          node: newNode,
          timestamp: new Date().toISOString()
        }, '*');
      }
      
      alert('新 Tile 创建成功！\ncardKey: ' + newCardKey);
    },
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
        const uuid_visitor = this.getUuidVisitorFromURL();
        if (cardKey) {
          triggerDeal(cardKey, null, null, uuid_visitor);
        }
      }
    },
    handleNodeDataChanged(event) {
      console.log('NodeVisualization: nodeDataChanged received:', event.detail);
      // 可以在这里处理节点数据变化
    },
    renderHTML(html) {
      const container = this.$refs.htmlContainer;
      if (container && html) {
        // 清空容器
        container.innerHTML = '';
        
        try {
          // 直接设置 HTML 内容
          container.innerHTML = html;
          
          // 执行脚本标签
          const scripts = container.querySelectorAll('script');
          scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.head.appendChild(newScript);
            // 执行完后移除脚本标签
            setTimeout(() => {
              document.head.removeChild(newScript);
            }, 0);
          });
        } catch (error) {
          console.error('Error rendering HTML:', error);
          container.innerHTML = '<div class="error">Error rendering visualization</div>';
        }
      }
    },
    getUuidVisitorFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('uuid_visitor');
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

.visual-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
}

.new-tile-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.new-tile-btn:hover {
  background: linear-gradient(135deg, #16a34a, #15803d);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  transform: translateY(-1px);
}

.new-tile-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 14px;
}

.btn-text {
  font-weight: 500;
}

.visual-output {
  overflow-y: auto;
  min-height: 0;
  flex: 1;
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
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}
</style>