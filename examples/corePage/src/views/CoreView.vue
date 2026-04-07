<template>
  <div class="core-view">
    <h2>Core Components Test</h2>
    
    <div class="test-section">
      <h3>1. Core View Import Test</h3>
      <div v-if="coreLoaded" class="success">
        ✅ Core view successfully loaded!
      </div>
      <div v-else class="error">
        ❌ Failed to load core view
      </div>
    </div>
    
    <div class="test-section">
      <h3>2. Available Components</h3>
      <ul class="component-list">
        <li v-for="component in availableComponents" :key="component">
          {{ component }}
        </li>
      </ul>
    </div>
    
    <div class="test-section">
      <h3>3. Test Rendering</h3>
      <button @click="testRender" class="test-button">
        Test Component Rendering
      </button>
      <div v-if="renderResult" class="render-result">
        <h4>Render Result:</h4>
        <pre>{{ renderResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>4. Test.js Module</h3>
      <div class="test-module">
        <p><strong>Test.txt value:</strong> {{ testTxt }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const coreLoaded = ref(false)
const availableComponents = ref([])
const renderResult = ref('')
const errorMessage = ref('')
const testTxt = ref('')

onMounted(async () => {
  try {
    console.log('Loading core view module...')
    
    // 测试加载 core view
    const coreModule = await import('@core/index.js')
    console.log('Core module loaded:', coreModule)
    
    coreLoaded.value = true
    
    // 可用组件列表
    availableComponents.value = [
      'board', 'box', 'button', 'checkbox', 'date', 'default', 
      'file', 'form', 'input', 'list', 'navigation', 'options', 
      'table', 'text', 'textarea'
    ]
    
    console.log('Available components:', availableComponents.value)
    
    // 动态加载 test.js 模块
    try {
      const testModule = await import('../../../../core/test.js')
      console.log('Test module loaded:', testModule)
      testTxt.value = testModule.txt || testModule.default.txt
      console.log('Test txt value:', testTxt.value)
    } catch (testError) {
      console.error('Error loading test.js:', testError)
      testTxt.value = 'Error loading test.js'
    }
    
  } catch (error) {
    console.error('Error loading core:', error)
    errorMessage.value = error.message
    coreLoaded.value = false
  }
})

const testRender = async () => {
  try {
    console.log('Testing component rendering...')
    // 测试渲染一个简单组件
    const coreModule = await import('@core/index.js')
    
    const testComponent = {
      kind: 'text',
      config: {
        title: 'Test Text Component',
        content: 'Hello from Core Component!'
      }
    }
    
    const result = coreModule.generateNodeVisualization(testComponent)
    console.log('Render result:', result)
    renderResult.value = result
  } catch (error) {
    console.error('Error rendering component:', error)
    renderResult.value = `Error: ${error.message}`
  }
}
</script>

<style scoped>
.core-view {
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.test-section h3 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.success {
  color: #28a745;
  font-weight: bold;
  padding: 10px;
  background: #d4edda;
  border-radius: 4px;
}

.error {
  color: #dc3545;
  font-weight: bold;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
}

.component-list {
  list-style: none;
  padding: 0;
}

.component-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.test-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.test-button:hover {
  background: #0069d9;
}

.render-result {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.render-result pre {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
}
</style>