<template>
  <div class="json-viewer">
    <div class="json-node" :style="{ paddingLeft: depth * 16 + 'px' }">
      <template v-if="isExpandable">
        <span class="toggle-btn" @click="toggle">
          <span v-if="expanded">▼</span>
          <span v-else>▶</span>
        </span>
      </template>
      <template v-else>
        <span class="toggle-placeholder"></span>
      </template>

      <template v-if="isObject">
        <span class="json-key" v-if="keyName">{{ keyName }}: </span>
        <span class="json-brace" v-if="expanded">{</span>
        <span class="json-brace" v-else>
          { <span class="json-preview">{{ objectPreview }}</span> }
        </span>
      </template>

      <template v-else-if="isArray">
        <span class="json-key" v-if="keyName">{{ keyName }}: </span>
        <span class="json-bracket" v-if="expanded">[</span>
        <span class="json-bracket" v-else>
          [ <span class="json-preview">{{ arrayLength }} items</span> ]
        </span>
      </template>

      <template v-else>
        <span class="json-key" v-if="keyName">{{ keyName }}: </span>
        <span :class="valueClass">{{ displayValue }}</span>
      </template>
    </div>

    <template v-if="expanded && isObject">
      <JsonViewer
        v-for="(val, key) in data"
        :key="key"
        :data="val"
        :key-name="String(key)"
        :depth="depth + 1"
        :default-expand="defaultExpand"
      />
      <div class="json-node" :style="{ paddingLeft: depth * 16 + 'px' }">
        <span class="toggle-placeholder"></span>
        <span class="json-brace">}</span>
      </div>
    </template>

    <template v-if="expanded && isArray">
      <JsonViewer
        v-for="(item, index) in data"
        :key="index"
        :data="item"
        :key-name="String(index)"
        :depth="depth + 1"
        :default-expand="defaultExpand"
      />
      <div class="json-node" :style="{ paddingLeft: depth * 16 + 'px' }">
        <span class="toggle-placeholder"></span>
        <span class="json-bracket">]</span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'JsonViewer',
  props: {
    data: {
      default: null
    },
    keyName: {
      type: String,
      default: ''
    },
    depth: {
      type: Number,
      default: 0
    },
    defaultExpand: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      expanded: this.depth === 0 ? true : this.defaultExpand
    };
  },
  computed: {
    isObject() {
      return this.data !== null && typeof this.data === 'object' && !Array.isArray(this.data);
    },
    isArray() {
      return Array.isArray(this.data);
    },
    isExpandable() {
      return this.isObject || this.isArray;
    },
    objectPreview() {
      if (!this.isObject) return '';
      const keys = Object.keys(this.data);
      if (keys.length === 0) return '';
      return keys.slice(0, 3).join(', ') + (keys.length > 3 ? '...' : '');
    },
    arrayLength() {
      if (!this.isArray) return 0;
      return this.data.length;
    },
    displayValue() {
      if (this.data === null) return 'null';
      if (typeof this.data === 'string') return `"${this.data}"`;
      if (typeof this.data === 'boolean') return this.data ? 'true' : 'false';
      return String(this.data);
    },
    valueClass() {
      if (this.data === null) return 'json-null';
      if (typeof this.data === 'string') return 'json-string';
      if (typeof this.data === 'number') return 'json-number';
      if (typeof this.data === 'boolean') return 'json-boolean';
      return 'json-value';
    }
  },
  methods: {
    toggle() {
      this.expanded = !this.expanded;
    }
  }
}
</script>

<style scoped>
.json-viewer {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
}

.json-node {
  display: flex;
  align-items: flex-start;
  white-space: nowrap;
}

.toggle-btn {
  cursor: pointer;
  user-select: none;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #888;
  flex-shrink: 0;
  margin-top: 3px;
}

.toggle-btn:hover {
  color: #ccc;
}

.toggle-placeholder {
  width: 16px;
  flex-shrink: 0;
  display: inline-block;
}

.json-key {
  color: #9cdcfe;
}

.json-string {
  color: #ce9178;
}

.json-number {
  color: #b5cea8;
}

.json-boolean {
  color: #569cd6;
}

.json-null {
  color: #569cd6;
}

.json-value {
  color: #d4d4d4;
}

.json-brace,
.json-bracket {
  color: #d4d4d4;
}

.json-preview {
  color: #6a9955;
  font-style: italic;
  font-size: 12px;
}
</style>