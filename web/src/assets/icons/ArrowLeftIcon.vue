<template>
  <svg
      class="arrow-left-icon"
      :width="width"
      :height="height"
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="false"
      aria-label="previous"
      focusable="false"
      :style="svgStyle"
  >
    <path
        :d="pathData"
        :fill="color"
        fill-rule="evenodd"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

// 组件属性
const props = defineProps({
  // 图标宽度
  width: {
    type: [String, Number],
    default: 24
  },
  // 图标高度
  height: {
    type: [String, Number],
    default: 24
  },
  // 图标颜色
  color: {
    type: String,
    default: 'currentColor'
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: false
  },
  // 旋转角度
  rotate: {
    type: Number,
    default: 0
  }
})

// SVG路径数据 - 修复后的正确路径
const pathData = 'm13.7 16.29a1 1 0 1 1 -1.42 1.41l-8-8a1 1 0 0 1 0-1.41l8-8a1 1 0 1 1 1.42 1.41l-7.29 7.29z'

// 计算样式
const svgStyle = computed(() => ({
  display: 'block',
  fill: props.color,
  cursor: props.clickable ? 'pointer' : 'default',
  transform: props.rotate ? `rotate(${props.rotate}deg)` : 'none',
  transition: 'transform 0.2s ease-in-out'
}))

// 抛出方法，供父组件调用
defineExpose({
  pathData,
  getSize: () => ({ width: props.width, height: props.height })
})
</script>

<style scoped>
.arrow-left-icon {
  vertical-align: middle;
  flex-shrink: 0;
}

.arrow-left-icon:hover {
  opacity: 0.8;
}

.arrow-left-icon:active {
  transform: scale(0.95);
}
</style>