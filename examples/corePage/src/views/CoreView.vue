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
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.test-section h3 {
  color: #1e293b;
  margin-bottom: 14px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
}

.success {
  color: #16a34a;
  font-weight: 600;
  padding: 10px 14px;
  background: #dcfce7;
  border-radius: 8px;
  font-size: 13px;
}

.error {
  color: #dc2626;
  font-weight: 600;
  padding: 10px 14px;
  background: #fee2e2;
  border-radius: 8px;
  font-size: 13px;
}

.component-list {
  list-style: none;
  padding: 0;
}

.component-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 13px;
}

.test-button {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.test-button:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.render-result {
  margin-top: 16px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
}

.render-result pre {
  white-space: pre-wrap;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}
</style>