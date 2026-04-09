<template>
  <div class="anx-page">
    <div v-if="loading" class="loading">
      <p>Loading visualization...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="nodesStructure && visualizationHTML" class="visualization-container">
      <anx-view
        :nodes-structure="JSON.stringify(nodesStructure)"
        :visualization-html="visualizationHTML"
      ></anx-view>
    </div>

    <div v-else class="no-data">
      <p>No visualization data available</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ANXPage',
  data() {
    return {
      loading: true,
      error: '',
      nodesStructure: null,
      visualizationHTML: '',
      visualizationCSS: ''
    };
  },
  mounted() {
    const uuid = this.$route.params.uuid_tile;
    if (uuid) {
      this.fetchNodeVisualization(uuid);
    }
    
    // 加载ANXView web component
    import('../webComponents/ANXView.js');
  },
  watch: {
    '$route.params.uuid_tile'(newUuid) {
      if (newUuid) {
        this.fetchNodeVisualization(newUuid);
      }
    }
  },
  methods: {
    async fetchNodeVisualization(uuid) {
      this.loading = true;
      this.error = '';
      this.nodesStructure = null;
      this.visualizationHTML = '';
      this.visualizationCSS = '';

      try {
        // 获取节点结构
        const nodesResponse = await fetch('/api/convert-to-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uuid_tile: uuid })
        });

        if (!nodesResponse.ok) {
          throw new Error('Failed to fetch nodes structure');
        }

        const nodesResult = await nodesResponse.json();
        if (!nodesResult.nodes) {
          throw new Error('Failed to get nodes structure from response');
        }
        this.nodesStructure = nodesResult.nodes;

        // 获取可视化数据
        await this.generateNodeVisualization(this.nodesStructure);
      } catch (err) {
        console.error('Error fetching visualization:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async generateNodeVisualization(node) {
      try {
        const response = await fetch('/api/visualize-node', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ node })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch visualization');
        }

        const result = await response.json();
        this.visualizationHTML = result.html;
        this.visualizationCSS = result.css;

        // 动态注入 CSS
        this.$nextTick(() => {
          this.injectVisualizationCSS(result.css);
        });
      } catch (error) {
        console.error('Error generating node visualization:', error);
        this.visualizationHTML = '<div class="anx-error">Error generating node visualization</div>';
      }
    },
    injectVisualizationCSS(css) {
      if (!css) return;

      // 移除旧的样式标签
      const oldStyle = document.getElementById('anx-page-dynamic-style');
      if (oldStyle) {
        oldStyle.remove();
      }

      // 创建新的样式标签
      const style = document.createElement('style');
      style.id = 'anx-page-dynamic-style';
      style.textContent = css;
      document.head.appendChild(style);
    }
  },
  beforeUnmount() {
    // 清理动态样式
    const oldStyle = document.getElementById('anx-page-dynamic-style');
    if (oldStyle) {
      oldStyle.remove();
    }
  }
};
</script>

<style scoped>
.anx-page {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #666;
  font-size: 18px;
}

.error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #dc3545;
  background: #f8d7da;
  font-size: 18px;
  padding: 20px;
  text-align: center;
}

.visualization-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: auto;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 18px;
}
</style>
