<template>
  <div id="app" :style="colorStyles">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <BottomPlayerBar v-if="showGlobalPlayerBar && hasCurrentSong" />

    <!-- 全局音频元素 -->
    <audio
        ref="globalAudio"
        style="display: none;"
        preload="metadata"
        crossorigin="anonymous"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @ended="handleEnded"
        @play="handlePlay"
        @pause="handlePause"
        @error="handleAudioError"
        @waiting="handleWaiting"
        @canplay="handleCanPlay"
    />
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
const globalAudio = ref(null)

// 计算属性
const showGlobalPlayerBar = computed(() => {
  return route.meta.showBottomPlayerBar !== false
})

const hasCurrentSong = computed(() => {
  return !!musicStore.currentSong
})

// 音频事件处理
const handleTimeUpdate = () => {
  if (globalAudio.value && !musicStore.isSeeking) {
    musicStore.setCurrentTime(globalAudio.value.currentTime)
  }
}

const handleLoadedMetadata = () => {
  if (globalAudio.value) {
    musicStore.setDuration(globalAudio.value.duration)
  }
}

const handleEnded = () => {
  musicStore.nextSong('audio-ended')
}

const handlePlay = () => {
  musicStore.isPlaying = true
  musicStore.audioError = null
}

const handlePause = () => {
  musicStore.isPlaying = false
}

const handleAudioError = (event) => {
  console.error('全局音频错误:', event)
  musicStore.audioError = event.target.error
  musicStore.isPlaying = false
}

const handleWaiting = () => {
  musicStore.lyricsLoading = true
}

const handleCanPlay = () => {
  musicStore.lyricsLoading = false
}

// 初始化
onMounted(() => {
  // 设置全局音频元素
  if (globalAudio.value) {
    musicStore.setAudioElement(globalAudio.value)
  }
})

onUnmounted(() => {
  if (globalAudio.value) {
    globalAudio.value.pause()
    globalAudio.value.src = ''
  }
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