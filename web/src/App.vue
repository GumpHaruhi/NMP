<template>
  <div id="app" :style="colorStyles">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <BottomPlayerBar v-if="showGlobalPlayerBar && hasCurrentSong" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from "vue-router"
import { useColorStore } from './stores/colorStore'
import { useMusicStore } from './stores/musicStore'
import AppHeader from './components/AppHeader.vue'
import BottomPlayerBar from './components/BottomPlayerBar.vue'

const route = useRoute()
const colorStore = useColorStore()
const musicStore = useMusicStore()

const { colorStyles } = colorStore

// 计算属性
const showGlobalPlayerBar = computed(() => {
  return route.meta.showBottomPlayerBar !== false
})

const hasCurrentSong = computed(() => {
  return !!musicStore.currentSong
})

// 初始化音乐存储
onMounted(async () => {
  try {
    // 初始化音乐存储（包括AudioEngine）
    await musicStore.initialize()
    console.log('音乐存储初始化完成')
  } catch (error) {
    console.error('音乐存储初始化失败:', error)
  }
})

onUnmounted(() => {
  // 清理音乐存储资源
  musicStore.destroy()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--secondary-color);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.main-content {
  padding-bottom: 80px;
  min-height: calc(100vh - 80px);
}
</style>