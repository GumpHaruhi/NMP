<template>
  <div class="bottom-player-bar" :class="{ 'visible': isVisible }">
    <!-- 进度条 -->
    <div class="progress-bar-container" @click="handleProgressClick" ref="progressBar">
      <div class="progress-track"></div>
      <div
          class="progress-fill"
          :style="{ width: safeProgress + '%' }"
      ></div>
      <div
          class="progress-thumb"
          :style="{ left: safeProgress + '%' }"
          @mousedown="startDrag"
          @touchstart="startDrag"
      ></div>
    </div>

    <!-- 播放器内容区域 -->
    <div class="player-content">
      <!-- 左侧：歌曲信息 -->
      <div class="song-info" @click="goToPlayer" :title="safeCurrentSong ? '查看播放详情' : ''">
        <div class="cover-image" :style="coverStyle">
          <div v-if="!safeCurrentSong?.coverUrl" class="cover-placeholder">
            <MusicIcon class="placeholder-icon" />
          </div>
          <!-- 播放动画效果 -->
          <div class="playing-indicator" v-if="safeIsPlaying">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
        </div>

        <div class="song-details">
          <div class="song-title">{{ safeCurrentSong?.title || '暂无播放' }}</div>
          <div class="song-artist">{{ safeCurrentSong?.singer || '选择一首歌曲开始播放' }}</div>
        </div>

        <!-- 喜欢按钮 -->
        <button
            class="like-btn"
            @click.stop="handleToggleLike"
            :class="{ liked: isCurrentSongLiked }"
            :title="isCurrentSongLiked ? '取消喜欢' : '喜欢'"
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
          <RepeatIcon v-if="playMode === 'loop'" class="control-icon" />
          <ShuffleIcon v-else-if="playMode === 'random'" class="control-icon" />
          <SequentialIcon v-else class="control-icon" />
        </button>

        <button
            class="control-btn prev-btn"
            @click="handlePrevSong"
            :disabled="!safeCurrentSong || !hasPrevious"
            title="上一首"
        >
          <PrevIcon class="control-icon" />
        </button>

        <button
            class="play-pause-btn"
            @click="handleTogglePlay"
            :disabled="!safeCurrentSong"
            :title="getPlayButtonTitle"
        >
          <PlayIcon v-if="!safeIsPlaying" class="play-pause-icon" />
          <PauseIcon v-else class="play-pause-icon" />
        </button>

        <button
            class="control-btn next-btn"
            @click="handleNextSong"
            :disabled="!safeCurrentSong || !hasNext"
            title="下一首"
        >
          <NextIcon class="control-icon" />
        </button>
      </div>

      <!-- 右侧：时间和音量控制 -->
      <div class="player-right-controls">
        <!-- 时间显示 -->
        <div class="time-display">
          <span class="current-time">{{ formatTime(safeCurrentTime) }}</span>
          <span class="time-separator">/</span>
          <span class="total-time">{{ formatTime(safeDuration) }}</span>
        </div>

        <!-- 音量控制 -->
        <div class="volume-control">
          <button
              class="volume-btn"
              @click="toggleMute"
              :title="isMuted ? '取消静音' : '静音'"
          >
            <VolumeUpIcon v-if="!isMuted && volume > 0" class="volume-icon" />
            <VolumeOffIcon v-else class="volume-icon" />
          </button>
          <div
              class="volume-slider"
              @click="handleVolumeClick"
              ref="volumeSlider"
          >
            <div class="volume-track"></div>
            <div class="volume-fill" :style="{ width: volume + '%' }"></div>
            <div
                class="volume-thumb"
                :style="{ left: volume + '%' }"
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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

// Refs
const isVisible = ref(false)
const progressBar = ref(null)
const volumeSlider = ref(null)
const isDragging = ref(false)
const errorMessage = ref('')
const isMuted = ref(false)
const isBuffering = ref(false)

// 拖动状态
const dragStartX = ref(0)
const dragStartProgress = ref(0)

// 计算属性 - 使用musicStore的状态
const safeCurrentSong = computed(() => musicStore.currentSong)
const safeIsPlaying = computed(() => musicStore.isPlaying)
const safeCurrentTime = computed(() => musicStore.currentTime || 0)
const safeDuration = computed(() => musicStore.duration || 0)
const volume = computed(() => musicStore.volume || 80)
const playMode = computed(() => musicStore.playMode || 'sequential')

const safeProgress = computed(() => {
  if (!safeDuration.value || safeDuration.value <= 0) return 0
  return (safeCurrentTime.value / safeDuration.value) * 100
})

const coverStyle = computed(() => {
  const song = safeCurrentSong.value
  if (song?.coverUrl) {
    return { backgroundImage: `url(${song.coverUrl})` }
  }
  return {}
})

const isCurrentSongLiked = computed(() => {
  return safeCurrentSong.value ? musicStore.isLiked(safeCurrentSong.value.id) : false
})

const playModeText = computed(() => {
  const modes = {
    sequential: '顺序播放',
    loop: '单曲循环',
    random: '随机播放'
  }
  return modes[playMode.value] || '顺序播放'
})

const hasPrevious = computed(() => {
  return musicStore.playQueue.length > 1 || musicStore.allMusics.length > 1
})

const hasNext = computed(() => {
  return musicStore.playQueue.length > 1 || musicStore.allMusics.length > 1
})

const playlistCount = computed(() => musicStore.playQueue?.length || 0)

const getPlayButtonTitle = computed(() => {
  if (isBuffering.value) return '加载中...'
  return safeIsPlaying.value ? '暂停' : '播放'
})

// 方法 - 直接调用musicStore的方法
const goToPlayer = () => {
  if (safeCurrentSong.value) {
    router.push('/player')
  }
}

const handleTogglePlay = async () => {
  if (!safeCurrentSong.value) return

  try {
    errorMessage.value = ''
    await musicStore.togglePlay('bottom-player')
  } catch (error) {
    console.error('播放控制失败:', error)
    errorMessage.value = error.message || '播放控制失败，请重试'
  }
}

const handlePrevSong = async () => {
  if (!safeCurrentSong.value || !hasPrevious.value) return
  try {
    await musicStore.prevSong('bottom-player')
    errorMessage.value = ''
  } catch (error) {
    console.error('上一首失败:', error)
    errorMessage.value = error.message || '切换歌曲失败'
  }
}

const handleNextSong = async () => {
  if (!safeCurrentSong.value || !hasNext.value) return
  try {
    await musicStore.nextSong('bottom-player')
    errorMessage.value = ''
  } catch (error) {
    console.error('下一首失败:', error)
    errorMessage.value = error.message || '切换歌曲失败'
  }
}

const handleToggleLike = () => {
  if (!safeCurrentSong.value) return

  if (isCurrentSongLiked.value) {
    musicStore.dislikeSong(safeCurrentSong.value.id)
  } else {
    musicStore.likeSong(safeCurrentSong.value.id)
  }
}

const togglePlayMode = () => {
  const modes = ['sequential', 'loop', 'random']
  const currentIndex = modes.indexOf(playMode.value)
  const nextMode = modes[(currentIndex + 1) % modes.length]
  musicStore.setPlayMode(nextMode)
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  musicStore.setVolume(isMuted.value ? 0 : (volume.value || 50))
}

// 进度条控制
const handleProgressClick = (event) => {
  if (!safeCurrentSong.value || !progressBar.value || isDragging.value) return

  try {
    const rect = progressBar.value.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    const percentage = (clickX / width) * 100
    const newTime = (percentage / 100) * safeDuration.value

    musicStore.seekTo(Math.max(0, Math.min(safeDuration.value, newTime)), 'bottom-player-progress')
  } catch (error) {
    console.error('进度条点击失败:', error)
    errorMessage.value = '进度设置失败'
  }
}

const startDrag = (event) => {
  if (!safeCurrentSong.value) return

  event.preventDefault()
  isDragging.value = true
  dragStartX.value = event.clientX || event.touches[0].clientX
  dragStartProgress.value = safeProgress.value

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

const handleDrag = (event) => {
  if (!isDragging.value || !progressBar.value) return

  const clientX = event.clientX || (event.touches && event.touches[0].clientX)
  if (!clientX) return

  const rect = progressBar.value.getBoundingClientRect()
  const dragDistance = clientX - dragStartX.value
  const width = rect.width
  const progressDelta = (dragDistance / width) * 100
  const newProgress = Math.max(0, Math.min(100, dragStartProgress.value + progressDelta))
  const newTime = (newProgress / 100) * safeDuration.value

  musicStore.setCurrentTime(newTime)
}

const stopDrag = async () => {
  if (!isDragging.value) return

  isDragging.value = false
  try {
    await musicStore.seekTo(safeCurrentTime.value, 'bottom-player-drag')
  } catch (error) {
    console.error('跳转时间失败:', error)
    errorMessage.value = '跳转失败'
  }

  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 音量控制
const handleVolumeClick = (event) => {
  if (!volumeSlider.value) return

  const rect = volumeSlider.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const width = rect.width
  const newVolume = Math.max(0, Math.min(100, (clickX / width) * 100))

  musicStore.setVolume(newVolume)
  isMuted.value = newVolume === 0
}

const togglePlaylist = () => {
  musicStore.togglePlaylistVisibility?.()
}

const retryPlay = async () => {
  errorMessage.value = ''
  if (safeCurrentSong.value) {
    try {
      await musicStore.retryPlay('bottom-player-retry')
    } catch (error) {
      errorMessage.value = error.message || '重试播放失败'
    }
  }
}

const clearError = () => {
  errorMessage.value = ''
  musicStore.clearError?.()
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 监听歌曲变化
watch(safeCurrentSong, (newSong) => {
  isVisible.value = !!newSong
  errorMessage.value = ''
  isBuffering.value = false
}, { immediate: true })

// 监听播放状态
watch(safeIsPlaying, (newVal) => {
  if (newVal) {
    isBuffering.value = false
  }
})

// 监听错误状态
watch(() => musicStore.audioError, (error) => {
  if (error) {
    errorMessage.value = error.message || '音频播放错误'
  }
})

// 监听加载状态
watch(() => musicStore.lyricsLoading, (loading) => {
  isBuffering.value = loading
})

onMounted(() => {
  isVisible.value = !!safeCurrentSong.value
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
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
}

.bottom-player-bar.visible {
  transform: translateY(0);
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