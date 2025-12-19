<template>
  <div class="bottom-player-bar" :class="{ 'visible': isVisible }">
    <!-- 进度条 -->
    <div class="progress-bar-container" @click="handleProgressClick" ref="progressBar">
      <div class="progress-track"></div>
      <div
          class="progress-fill"
          :style="{ width: displayProgress + '%' }"
      ></div>
      <div
          class="progress-thumb"
          :style="{ left: displayProgress + '%' }"
          @mousedown="startDrag"
          @touchstart="startDrag"
      ></div>
    </div>

    <!-- 播放器内容区域 -->
    <div class="player-content">
      <!-- 左侧：歌曲信息 -->
      <div class="song-info" @click="goToPlayer" :title="currentSongData ? '查看播放详情' : ''">
        <div class="cover-image" :style="coverStyle">
          <div v-if="!currentSongData?.coverUrl" class="cover-placeholder">
            <MusicIcon class="placeholder-icon" />
          </div>
          <!-- 播放动画效果 -->
          <div class="playing-indicator" v-if="isPlayingState">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
        </div>

        <div class="song-details">
          <div class="song-title" v-text="currentSongData?.title || '暂无播放'"></div>
          <div class="song-artist" v-text="currentSongData?.singer || '选择一首歌曲开始播放'"></div>
        </div>

        <!-- 喜欢按钮 -->
        <button
            class="like-btn"
            @click.stop="handleToggleLike"
            :class="{ liked: isLikedState }"
            :title="isLikedState ? '取消喜欢' : '喜欢'"
        >
          <HeartIcon class="like-icon" />
        </button>
      </div>

      <!-- 中间：播放控制 -->
      <div class="player-controls">
        <button
            class="control-btn mode-btn"
            @click="togglePlayMode"
            :title="playModeText"
        >
          <RepeatIcon v-if="playModeState === 'loop'" class="control-icon" />
          <ShuffleIcon v-else-if="playModeState === 'random'" class="control-icon" />
          <SequentialIcon v-else class="control-icon" />
        </button>

        <button
            class="control-btn prev-btn"
            @click="handlePrevSong"
            :disabled="!currentSongData || !hasPrevious"
            title="上一首"
        >
          <PrevIcon class="control-icon" />
        </button>

        <button
            class="play-pause-btn"
            @click="handleTogglePlay"
            :disabled="!currentSongData"
            :title="playButtonTitle"
        >
          <PlayIcon v-if="!isPlayingState" class="play-pause-icon" />
          <PauseIcon v-else class="play-pause-icon" />
        </button>

        <button
            class="control-btn next-btn"
            @click="handleNextSong"
            :disabled="!currentSongData || !hasNext"
            title="下一首"
        >
          <NextIcon class="control-icon" />
        </button>
      </div>

      <!-- 右侧：时间和音量控制 -->
      <div class="player-right-controls">
        <!-- 时间显示 -->
        <div class="time-display">
          <span class="current-time">{{ formatTime(displayCurrentTime) }}</span>
          <span class="time-separator">/</span>
          <span class="total-time">{{ formatTime(displayDuration) }}</span>
        </div>

        <!-- 音量控制 -->
        <div class="volume-control">
          <button
              class="volume-btn"
              @click="toggleMute"
              :title="isMutedState ? '取消静音' : '静音'"
          >
            <VolumeUpIcon v-if="!isMutedState && volumeState > 0" class="volume-icon" />
            <VolumeOffIcon v-else class="volume-icon" />
          </button>
          <div
              class="volume-slider"
              @click="handleVolumeClick"
              ref="volumeSlider"
          >
            <div class="volume-track"></div>
            <div class="volume-fill" :style="{ width: volumeState + '%' }"></div>
            <div
                class="volume-thumb"
                :style="{ left: volumeState + '%' }"
            ></div>
          </div>
        </div>

        <!-- 播放列表按钮 -->
        <button
            class="playlist-btn"
            @click="togglePlaylist"
            title="播放列表"
        >
          <PlaylistIcon class="playlist-icon" />
          <span class="playlist-count" v-if="playlistCount > 0">{{ playlistCount }}</span>
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      <span class="error-text">{{ errorMessage }}</span>
      <button @click="retryPlay" class="retry-btn">重试</button>
      <button @click="clearError" class="close-error-btn">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'

// 图标组件
import MusicIcon from '@/assets/icons/MusicIcon.vue'
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import PauseIcon from '@/assets/icons/PauseIcon.vue'
import PrevIcon from '@/assets/icons/PrevIcon.vue'
import NextIcon from '@/assets/icons/NextIcon.vue'
import RepeatIcon from '@/assets/icons/RepeatIcon.vue'
import ShuffleIcon from '@/assets/icons/ShuffleIcon.vue'
import SequentialIcon from '@/assets/icons/SequentialIcon.vue'
import HeartIcon from '@/assets/icons/HeartIcon.vue'
import VolumeUpIcon from '@/assets/icons/VolumeUpIcon.vue'
import VolumeOffIcon from '@/assets/icons/VolumeOffIcon.vue'
import PlaylistIcon from '@/assets/icons/PlaylistIcon.vue'

const router = useRouter()
const musicStore = useMusicStore()

const throttle = (func, delay) => {
  let timeoutId = null
  return (...args) => {
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func.apply(this, args)
        timeoutId = null
      }, delay)
    }
  }
}

const debounce = (func, delay) => {
  let timeoutId = null
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// Refs - 优化变量命名，减少计算属性依赖
const isVisible = ref(false)
const progressBar = ref(null)
const volumeSlider = ref(null)
const isDragging = ref(false)
const errorMessage = ref('')
const isMutedState = ref(false)
const isBuffering = ref(false)

// 🆕 优化：添加本地状态缓存，减少store访问
const localCurrentTime = ref(0)
const localDuration = ref(0)
const localProgress = ref(0)
let rafId = null

// 拖动状态
const dragStartX = ref(0)
const dragStartProgress = ref(0)

// 🆕 优化：批量获取store状态，减少响应式依赖
const storeState = computed(() => ({
  currentSong: musicStore.currentSong,
  isPlaying: musicStore.isPlaying,
  currentTime: musicStore.currentTime || 0,
  duration: musicStore.duration || 0,
  volume: musicStore.volume || 80,
  playMode: musicStore.playMode || 'sequential',
  playQueue: musicStore.playQueue || [],
  allMusics: musicStore.allMusics || [],
  audioError: musicStore.audioError,
  lyricsLoading: musicStore.lyricsLoading
}))

// 🆕 优化：使用缓存的计算属性
const currentSongData = computed(() => storeState.value.currentSong)
const isPlayingState = computed(() => storeState.value.isPlaying)
const volumeState = computed(() => storeState.value.volume)
const playModeState = computed(() => storeState.value.playMode)

// 🆕 优化：使用RAF更新显示时间，减少计算属性开销
const displayCurrentTime = ref(0)
const displayDuration = ref(0)
const displayProgress = ref(0)

// 启动RAF更新循环
const startRAFUpdate = () => {
  const update = () => {
    if (isPlayingState.value && !isDragging.value) {
      localCurrentTime.value = storeState.value.currentTime
      localDuration.value = storeState.value.duration

      // 更新显示值
      displayCurrentTime.value = localCurrentTime.value
      displayDuration.value = localDuration.value

      if (localDuration.value > 0) {
        displayProgress.value = (localCurrentTime.value / localDuration.value) * 100
      }
    }
    rafId = requestAnimationFrame(update)
  }
  rafId = requestAnimationFrame(update)
}

// 停止RAF更新
const stopRAFUpdate = () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

const coverStyle = computed(() => {
  const song = currentSongData.value
  return song?.coverUrl ? { backgroundImage: `url(${song.coverUrl})` } : {}
})

const isLikedState = computed(() => {
  return currentSongData.value ? musicStore.isLiked(currentSongData.value.id) : false
})

const playModeText = computed(() => {
  const modes = {
    sequential: '顺序播放',
    loop: '单曲循环',
    random: '随机播放'
  }
  return modes[playModeState.value] || '顺序播放'
})

const hasPrevious = computed(() => {
  return storeState.value.playQueue.length > 1 || storeState.value.allMusics.length > 1
})

const hasNext = computed(() => {
  return storeState.value.playQueue.length > 1 || storeState.value.allMusics.length > 1
})

const playlistCount = computed(() => storeState.value.playQueue.length)

const playButtonTitle = computed(() => {
  return isBuffering.value ? '加载中...' : (isPlayingState.value ? '暂停' : '播放')
})

// 🆕 优化：使用防抖的方法
const goToPlayer = debounce(() => {
  if (currentSongData.value) {
    router.push('/player')
  }
}, 300)

const handleTogglePlay = debounce(async () => {
  if (!currentSongData.value) return

  try {
    errorMessage.value = ''
    await musicStore.togglePlay()
  } catch (error) {
    console.error('播放控制失败:', error)
    errorMessage.value = error.message || '播放控制失败，请重试'
  }
}, 150)

const handlePrevSong = debounce(async () => {
  if (!currentSongData.value || !hasPrevious.value) return
  try {
    await musicStore.prevSong()
    errorMessage.value = ''
  } catch (error) {
    console.error('上一首失败:', error)
    errorMessage.value = error.message || '切换歌曲失败'
  }
}, 150)

const handleNextSong = debounce(async () => {
  if (!currentSongData.value || !hasNext.value) return
  try {
    await musicStore.nextSong()
    errorMessage.value = ''
  } catch (error) {
    console.error('下一首失败:', error)
    errorMessage.value = error.message || '切换歌曲失败'
  }
}, 150)

const handleToggleLike = debounce(() => {
  if (!currentSongData.value) return

  if (isLikedState.value) {
    musicStore.dislikeSong(currentSongData.value.id)
  } else {
    musicStore.likeSong(currentSongData.value.id)
  }
}, 150)

const togglePlayMode = debounce(() => {
  const modes = ['sequential', 'loop', 'random']
  const currentIndex = modes.indexOf(playModeState.value)
  const nextMode = modes[(currentIndex + 1) % modes.length]
  musicStore.setPlayMode(nextMode)
}, 150)

const toggleMute = debounce(() => {
  isMutedState.value = !isMutedState.value
  musicStore.setVolume(isMutedState.value ? 0 : (volumeState.value || 50))
}, 150)

// 🆕 优化：进度条控制使用节流
const handleProgressClick = throttle((event) => {
  if (!currentSongData.value || !progressBar.value || isDragging.value) return

  try {
    const rect = progressBar.value.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    const percentage = (clickX / width) * 100
    const newTime = (percentage / 100) * displayDuration.value

    musicStore.seekTo(Math.max(0, Math.min(displayDuration.value, newTime)))
  } catch (error) {
    console.error('进度条点击失败:', error)
    errorMessage.value = '进度设置失败'
  }
}, 100)

const startDrag = (event) => {
  if (!currentSongData.value) return

  event.preventDefault()
  isDragging.value = true
  dragStartX.value = event.clientX || event.touches[0].clientX
  dragStartProgress.value = displayProgress.value

  // 🆕 优化：使用被动事件监听器
  document.addEventListener('mousemove', handleDrag, { passive: true })
  document.addEventListener('mouseup', stopDrag, { passive: true })
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDrag, { passive: true })
}

const handleDrag = throttle((event) => {
  if (!isDragging.value || !progressBar.value) return

  const clientX = event.clientX || (event.touches && event.touches[0].clientX)
  if (!clientX) return

  const rect = progressBar.value.getBoundingClientRect()
  const dragDistance = clientX - dragStartX.value
  const width = rect.width
  const progressDelta = (dragDistance / width) * 100
  const newProgress = Math.max(0, Math.min(100, dragStartProgress.value + progressDelta))

  // 🆕 优化：直接更新显示值，不触发store更新
  displayProgress.value = newProgress
  displayCurrentTime.value = (newProgress / 100) * displayDuration.value
}, 16) // 60fps节流

const stopDrag = debounce(async () => {
  if (!isDragging.value) return

  isDragging.value = false
  try {
    // 🆕 优化：只在拖拽结束时更新store
    await musicStore.seekTo(displayCurrentTime.value)
  } catch (error) {
    console.error('跳转时间失败:', error)
    errorMessage.value = '跳转失败'
  }

  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}, 50)

const handleVolumeClick = throttle((event) => {
  if (!volumeSlider.value) return

  const rect = volumeSlider.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const width = rect.width
  const newVolume = Math.max(0, Math.min(100, (clickX / width) * 100))

  musicStore.setVolume(newVolume)
  isMutedState.value = newVolume === 0
}, 100)

const togglePlaylist = debounce(() => {
  musicStore.togglePlaylistVisibility?.()
}, 150)

const retryPlay = debounce(async () => {
  errorMessage.value = ''
  if (currentSongData.value) {
    try {
      await musicStore.retryPlay()
    } catch (error) {
      errorMessage.value = error.message || '重试播放失败'
    }
  }
}, 150)

const clearError = debounce(() => {
  errorMessage.value = ''
  musicStore.clearError?.()
}, 150)

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 🆕 优化：减少watch数量，合并监听
watch(storeState, (newState, oldState) => {
  // 歌曲变化
  if (newState.currentSong !== oldState.currentSong) {
    isVisible.value = !!newState.currentSong
    errorMessage.value = ''
    isBuffering.value = false

    // 重置显示值
    if (newState.currentSong) {
      displayCurrentTime.value = newState.currentTime
      displayDuration.value = newState.duration
      displayProgress.value = newState.duration > 0 ? (newState.currentTime / newState.duration) * 100 : 0
    }
  }

  // 播放状态变化
  if (newState.isPlaying !== oldState.isPlaying) {
    if (newState.isPlaying) {
      isBuffering.value = false
      startRAFUpdate()
    } else {
      stopRAFUpdate()
    }
  }

  // 错误状态
  if (newState.audioError !== oldState.audioError && newState.audioError) {
    errorMessage.value = newState.audioError.message || '音频播放错误'
  }

  // 加载状态
  if (newState.lyricsLoading !== oldState.lyricsLoading) {
    isBuffering.value = newState.lyricsLoading
  }
}, { deep: true, flush: 'post' })

// 🆕 优化：监听播放状态启动RAF
watch(isPlayingState, (playing) => {
  if (playing) {
    nextTick(() => {
      startRAFUpdate()
    })
  } else {
    stopRAFUpdate()
  }
}, { immediate: true })

onMounted(() => {
  isVisible.value = !!currentSongData.value
  // 初始同步显示值
  displayCurrentTime.value = storeState.value.currentTime
  displayDuration.value = storeState.value.duration
  displayProgress.value = storeState.value.duration > 0 ?
      (storeState.value.currentTime / storeState.value.duration) * 100 : 0
})

onUnmounted(() => {
  stopRAFUpdate()
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
/* 样式保持不变，但可以添加一些性能优化 */
.bottom-player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: var(--bg-primary);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -5px 30px rgba(0, 0, 0, 0.1);
  will-change: transform;
}

.bottom-player-bar.visible {
  transform: translateY(0);
}

/* 🆕 优化：减少重绘区域 */
.progress-fill, .volume-fill {
  will-change: width;
  transform: translateZ(0);
}

/* 🆕 优化：使用transform代替left属性 */
.progress-thumb, .volume-thumb {
  will-change: transform;
  transform: translateZ(0) translateX(-50%);
}
/* 进度条容器 */
.progress-bar-container {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 3px;
  cursor: pointer;
  background: transparent;
  z-index: 1001;
}

.progress-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--primary-color);
  transition: width 0.1s ease;
  z-index: 2;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--secondary-color);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: all 0.2s ease;
  cursor: grab;
  z-index: 3;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.progress-bar-container:hover .progress-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

.progress-thumb:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.3);
}

/* 播放器内容 */
.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  gap: 20px;
}

/* 歌曲信息 */
.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  transition: opacity 0.3s ease;
}

.song-info:hover {
  opacity: 0.8;
}

.cover-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.playing-indicator {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  height: 12px;
  display: flex;
  align-items: end;
  gap: 1px;
}

.playing-indicator .bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.8);
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 1px;
}

.playing-indicator .bar:nth-child(1) { animation-delay: 0s; height: 30%; }
.playing-indicator .bar:nth-child(2) { animation-delay: 0.2s; height: 60%; }
.playing-indicator .bar:nth-child(3) { animation-delay: 0.4s; height: 90%; }
.playing-indicator .bar:nth-child(4) { animation-delay: 0.6s; height: 60%; }

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.song-details {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.like-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.like-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.like-btn.liked {
  opacity: 1;
  color: #ff4757;
}

.like-icon {
  width: 16px;
  height: 16px;
}

/* 播放控制 */
.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.control-btn, .play-pause-btn {
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.control-btn {
  width: 36px;
  height: 36px;
}

.play-pause-btn {
  width: 44px;
  height: 44px;
  background: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--primary-color), 0.3);
}

.control-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.play-pause-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(var(--primary-color), 0.4);
}

.control-btn:disabled, .play-pause-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.control-icon, .play-pause-icon {
  width: 18px;
  height: 18px;
}

.play-pause-icon {
  width: 20px;
  height: 20px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 右侧控制 */
.player-right-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: flex-end;
}

.time-display {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 80px;
  text-align: center;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.volume-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.volume-icon {
  width: 16px;
  height: 16px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.volume-track {
  width: 100%;
  height: 100%;
}

.volume-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.volume-thumb {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: all 0.3s ease;
}

.volume-slider:hover .volume-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

.playlist-btn {
  position: relative;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.playlist-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.playlist-icon {
  width: 18px;
  height: 18px;
}

.playlist-count {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  padding: 1px 4px;
  font-size: 10px;
  min-width: 12px;
  text-align: center;
}

/* 错误提示 */
.error-message {
  position: absolute;
  top: -40px;
  left: 0;
  right: 0;
  background: #ff4757;
  color: white;
  padding: 8px 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.error-text {
  flex: 1;
}

.retry-btn, .close-error-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  margin-left: 8px;
  font-size: 11px;
}

.retry-btn:hover, .close-error-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player-content {
    padding: 0 15px;
    gap: 15px;
  }

  .song-info {
    gap: 10px;
  }

  .cover-image {
    width: 40px;
    height: 40px;
  }

  .song-title {
    font-size: 13px;
  }

  .song-artist {
    font-size: 11px;
  }

  .player-controls {
    gap: 6px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
  }

  .play-pause-btn {
    width: 40px;
    height: 40px;
  }

  .player-right-controls {
    gap: 15px;
  }

  .time-display {
    min-width: 70px;
    font-size: 11px;
  }

  .volume-slider {
    width: 60px;
  }
}

@media (max-width: 480px) {
  .bottom-player-bar {
    height: 70px;
  }

  .player-content {
    padding: 0 10px;
    gap: 10px;
  }

  .song-artist {
    display: none;
  }

  .time-display {
    display: none;
  }

  .volume-slider {
    display: none;
  }
}
</style>