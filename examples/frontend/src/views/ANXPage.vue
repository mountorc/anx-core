<template>
  <div class="anx-page">
    <div v-if="loading" class="loading">
      <p>Loading visualization...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="visualization" class="visualization-container">
      <ANXView 
        :nodesStructure="nodesStructure"
        :visualizationHTML="visualization"
      />
    </div>
    
    <div v-else class="no-data">
      <p>No visualization data available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ANXView from '../components/ANXView.vue'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const visualization = ref('')
const nodesStructure = ref(null)

const fetchNodeVisualization = async (uuid) => {
  loading.value = true
  error.value = ''
  visualization.value = ''
  nodesStructure.value = null
  
  try {
    // 先从后端获取 ANX 配置
    const anxResponse = await fetch(`/api/convert?uuid_tile=${uuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uuid_tile: uuid })
    })
    
    if (!anxResponse.ok) {
      throw new Error('Failed to fetch ANX configuration')
    }
    
    const anxData = await anxResponse.json()
    
    // 然后获取节点结构
    const nodesResponse = await fetch('/api/convert-to-nodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uuid_tile: uuid })
    })
    
    if (!nodesResponse.ok) {
      throw new Error('Failed to fetch nodes structure')
    }
    
    const nodesData = await nodesResponse.json()
    nodesStructure.value = nodesData.nodes
    
    // 然后获取可视化数据
    const vizResponse = await fetch('/api/visualize-node', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ node: nodesData.nodes })
    })
    
    if (!vizResponse.ok) {
      throw new Error('Failed to fetch visualization')
    }
    
    const vizData = await vizResponse.json()
    // 移除 CSS 代码，只使用 HTML
    visualization.value = vizData.html
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const uuid = route.params.uuid_tile
  if (uuid) {
    fetchNodeVisualization(uuid)
  }
})

watch(
  () => route.params.uuid_tile,
  (newUuid) => {
    if (newUuid) {
      fetchNodeVisualization(newUuid)
    }
  }
)
</script>

<style scoped>
.anx-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  text-align: center;
  padding: 40px;
  color: #dc3545;
  background: #f8d7da;
  border-radius: 4px;
}

.visualization-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>