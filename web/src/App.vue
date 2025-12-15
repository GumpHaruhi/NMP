<template>
  <div id="app" :style="colorStyles">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <BottomPlayerBar v-if="showGlobalPlayerBar && hasCurrentSong" />

    <!-- 播放列表弹窗 -->
    <div v-if="showPlaylist" class="playlist-modal" @click="showPlaylist = false">
      <div class="modal-content" @click.stop>
        <h3>播放列表</h3>
        <div class="playlist-items">
          <div
              v-for="(song, index) in currentPlaylist"
              :key="song.id"
              class="playlist-item"
              :class="{ active: index === currentIndex }"
              @click="playSong(song, index)"
          >

            <div class="item-info">
              <div class="item-title">{{ song.title }}</div>
              <div class="item-artist">{{ song.singer }}</div>
            </div>
            <button class="remove-btn" @click.stop="removeFromPlaylist(index)">×</button>
          </div>
        </div>
        <button class="close-btn" @click="showPlaylist = false">关闭</button>
      </div>
    </div>

    <!-- 调试信息（开发时显示） -->
    <div v-if="isDev" class="debug-info">
      当前配色: {{ currentColorName }} - {{ currentColor.primary }}
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import { useColorStore } from './stores/colorStore'
import { useMusicStore } from './stores/musicStore'
import AppHeader from './components/AppHeader.vue'
import BottomPlayerBar from './components/BottomPlayerBar..vue'
import {useRoute} from "vue-router";

const route = useRoute() // 使用useRoute获取当前路由
const colorStore = useColorStore()
const musicStore = useMusicStore()

const { colorStyles, currentColor, currentColorName } = colorStore
const { currentPlaylist, currentIndex, playSong } = musicStore

const showPlaylist = ref(false)
const isDev = import.meta.env.DEV // 开发模式标志

// 计算是否显示全局底栏
const showGlobalPlayerBar = computed(() => {
  // 默认显示，除非路由meta明确设置为false
  return route.meta.showBottomPlayerBar !== false
})

const hasCurrentSong = computed(() => {
  return !!musicStore.currentSong
})

// 方法2：或者使用响应式变量 + 监听器
const showBottomBar = ref(true)

watch(route, (to) => {
  // 当路由变化时更新显示状态
  showBottomBar.value = to.meta.showBottomPlayerBar !== false
}, { immediate: true })

// 初始化
onMounted(() => {
  // 应用启动时初始化数据
  musicStore.initialize().then(() => {
    console.log('应用初始化完成')
  })
})

const getCoverUrl = (songId) => {
  // 使用模拟封面URL
  return `https://picsum.photos/100/100?random=${songId}`
}

const removeFromPlaylist = (index) => {
  musicStore.playQueue.splice(index, 1)
}
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
  padding-bottom: 80px; /* 为底部播放栏留出空间 */
  min-height: calc(100vh - 80px);
}

/* 播放列表弹窗样式 */
.playlist-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px var(--shadow-color);
}

.playlist-items {
  margin: 20px 0;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
  margin-bottom: 8px;
  border: 1px solid transparent;
}

.playlist-item:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-hover);
}

.playlist-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-hover);
}

.item-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-title {
  font-weight: bold;
  font-size: 14px;
}

.item-artist {
  font-size: 12px;
  opacity: 0.7;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  color: inherit;
}

.remove-btn:hover {
  opacity: 1;
  color: #ff4757;
}

.close-btn {
  width: 100%;
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
  font-weight: bold;
}

.close-btn:hover {
  background: var(--primary-hover);
}

/* 调试信息 */
.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 3000;
}
</style>