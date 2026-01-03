<template>
  <div class="color-picker">
    <div class="color-picker-trigger" @click="togglePicker">
      <div class="color-preview" :style="{ backgroundColor: currentColor.primary }"></div>
      <span>配色</span>
      <span class="color-name">{{ currentColorName }}</span>
    </div>

    <div v-if="showPicker" class="color-panel">
      <div class="panel-header">
        <h3>选择配色方案</h3>
        <button class="close-btn" @click="showPicker = false">×</button>
      </div>

      <div class="preset-colors">
        <h4>预设配色</h4>
        <div class="color-grid">
          <div
              v-for="color in presetColors"
              :key="color.name"
              class="color-option"
              :class="{ active: color.name === currentColor.name }"
              @click="selectPresetColor(color)"
          >
            <div class="color-sample">
              <div class="primary" :style="{ backgroundColor: color.primary }"></div>
              <div class="secondary" :style="{ backgroundColor: color.secondary }"></div>
              <div class="accent" :style="{ backgroundColor: color.accent }"></div>
            </div>
            <span>{{ color.name }}</span>
          </div>
        </div>
      </div>

      <div class="custom-colors">
        <h4>自定义配色</h4>
        <div class="color-inputs">
          <div class="input-group">
            <label>主色</label>
            <input type="color" v-model="customColor.primary" @change="onCustomColorChange">
            <span>{{ customColor.primary }}</span>
          </div>
          <div class="input-group">
            <label>辅色</label>
            <input type="color" v-model="customColor.secondary" @change="onCustomColorChange">
            <span>{{ customColor.secondary }}</span>
          </div>
          <div class="input-group">
            <label>强调色</label>
            <input type="color" v-model="customColor.accent" @change="onCustomColorChange">
            <span>{{ customColor.accent }}</span>
          </div>
        </div>
        <button class="apply-btn" @click="applyCustomColor">应用自定义配色</button>
        <button class="reset-btn" @click="resetToDefault">重置为默认</button>
      </div>

      <div class="current-color-info">
        <h4>当前配色</h4>
        <div class="current-color-sample">
          <div class="sample-item">
            <div class="sample-color" :style="{ backgroundColor: currentColor.primary }"></div>
            <span>主色</span>
          </div>
          <div class="sample-item">
            <div class="sample-color" :style="{ backgroundColor: currentColor.secondary }"></div>
            <span>辅色</span>
          </div>
          <div class="sample-item">
            <div class="sample-color" :style="{ backgroundColor: currentColor.accent }"></div>
            <span>强调色</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useColorStore } from '../stores/colorStore'

const colorStore = useColorStore()
const {
  presetColors,
  currentColor,
  customColor,
  currentColorName,
  setColorScheme,
  applyCustomColor,
  resetToDefault
} = colorStore

const showPicker = ref(false)

// 切换选择器显示
const togglePicker = () => {
  showPicker.value = !showPicker.value
  console.log('切换选择器显示:', showPicker.value) // 调试日志
}

// 选择预设颜色
const selectPresetColor = (color) => {
  console.log('选择预设颜色:', color.name) // 调试日志
  setColorScheme(color)
  showPicker.value = false
}

// 自定义颜色变化
const onCustomColorChange = () => {
  console.log('自定义颜色变化:', customColor.value) // 调试日志
}

// 应用自定义颜色
const applyCustomColorWrapper = () => {
  console.log('应用自定义颜色') // 调试日志
  applyCustomColor()
  showPicker.value = false
}

// 点击外部关闭选择器
const handleClickOutside = (event) => {
  const picker = event.target.closest('.color-picker')
  if (!picker) {
    showPicker.value = false
  }
}

// 监听显示状态
watch(showPicker, (value) => {
  if (value) {
    document.addEventListener('click', handleClickOutside)
    console.log('添加外部点击监听') // 调试日志
  } else {
    document.removeEventListener('click', handleClickOutside)
    console.log('移除外部点击监听') // 调试日志
  }
})

onMounted(() => {
  console.log('ColorPicker 已挂载') // 调试日志
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.color-picker {
  position: relative;
  display: inline-block;
}

.color-picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.color-picker-trigger:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-hover);
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 1px var(--border-color);
}

.color-name {
  font-size: 12px;
  opacity: 0.8;
  margin-left: auto;
}

.color-panel {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px var(--shadow-color);
  z-index: 1000;
  min-width: 320px;
  margin-top: 8px;
  max-height: 80vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: var(--primary-color);
  color: white;
}

.preset-colors, .custom-colors, .current-color-info {
  margin-bottom: 25px;
}

h4 {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: var(--secondary-color);
}

.color-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.color-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.color-sample {
  display: flex;
  width: 100%;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px var(--shadow-color);
}

.color-sample div {
  flex: 1;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.input-group label {
  width: 60px;
  font-size: 14px;
  color: var(--text-primary);
}

.input-group input[type="color"] {
  width: 40px;
  height: 40px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}

.input-group input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.input-group input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.input-group span {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
}

.apply-btn, .reset-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
  font-weight: 500;
  margin-bottom: 8px;
}

.apply-btn {
  background: var(--primary-color);
  color: white;
}

.apply-btn:hover {
  background: var(--primary-hover);
}

.reset-btn {
  background: var(--secondary-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.reset-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.current-color-sample {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.sample-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sample-color {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 6px var(--shadow-color);
}

.sample-item span {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>