<template>
  <div class="bottom-player-bar" :class="{ 'visible': isVisible }">
    <!-- 进度条 -->
    <div class="progress-bar" @click="handleProgressClick" ref="progressBar">
      <div class="progress-track"></div>
      <div class="progress-fill" :style="{ width: safeProgress + '%' }"></div>
    </div>

    <!-- 播放器内容 -->
    <div class="player-content">
      <!-- 左侧：歌曲信息 -->
      <div class="song-info" @click="goToPlayer">
        <div class="cover-image" :style="coverStyle">
          <div v-if="!safeCurrentSong?.coverUrl" class="cover-placeholder">
            <MusicIcon class="placeholder-icon" />
          </div>
        </div>
        <div class="song-details">
          <div class="song-title">{{ safeCurrentSong?.title || '暂无播放' }}</div>
          <div class="song-artist">{{ safeCurrentSong?.singer || '选择一首歌曲开始播放' }}</div>
        </div>
      </div>

      <!-- 中间：播放控制 -->
      <div class="player-controls">
        <button class="control-btn prev-btn" @click="handlePrevSong" :disabled="!safeCurrentSong">
          <PrevIcon class="control-icon" />
        </button>

        <button class="play-pause-btn" @click="handleTogglePlay" :disabled="!safeCurrentSong">
          <PlayIcon v-if="!safeIsPlaying" class="play-pause-icon" />
          <PauseIcon v-else class="play-pause-icon" />
        </button>

        <button class="control-btn next-btn" @click="handleNextSong" :disabled="!safeCurrentSong">
          <NextIcon class="control-icon" />
        </button>
      </div>

      <!-- 右侧：时间显示 -->
      <div class="time-display">
        <span class="current-time">{{ formatTime(safeCurrentTime) }}</span>
        <span class="time-separator">/</span>
        <span class="total-time">{{ formatTime(safeDuration) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'

// 图标组件
import MusicIcon from '@/assets/icons/MusicIcon.vue'
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import PauseIcon from '@/assets/icons/PauseIcon.vue'
import PrevIcon from '@/assets/icons/PrevIcon.vue'
import NextIcon from '@/assets/icons/NextIcon.vue'

const router = useRouter()
const musicStore = useMusicStore()

// Refs
const isVisible = ref(false)
const progressBar = ref(null)

// 安全的数据访问 - 添加空值检查
const safeCurrentSong = computed(() => {
  return musicStore.currentSong || null
})

const safeIsPlaying = computed(() => {
  return musicStore.isPlaying || false
})

const safeCurrentTime = computed(() => {
  return musicStore.currentTime || 0
})

const safeDuration = computed(() => {
  return musicStore.duration || 0
})

const safeProgress = computed(() => {
  if (!safeDuration.value || safeDuration.value <= 0) return 0
  return (safeCurrentTime.value / safeDuration.value) * 100
})

const coverStyle = computed(() => {
  const song = safeCurrentSong.value
  if (song?.coverUrl) {
    return {
      backgroundImage: `url(${song.coverUrl})`
    }
  }
  return {}
})

// 方法
const goToPlayer = () => {
  if (safeCurrentSong.value) {
    router.push('/player')
  }
}

const handleTogglePlay = () => {
  if (!safeCurrentSong.value) return
  musicStore.togglePlay()
}

const handlePrevSong = () => {
  if (!safeCurrentSong.value) return
  musicStore.prevSong()
}

const handleNextSong = () => {
  if (!safeCurrentSong.value) return
  musicStore.nextSong()
}

const handleProgressClick = (event) => {
  if (!safeCurrentSong.value || !progressBar.value) return

  try {
    const rect = progressBar.value.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    const percentage = (clickX / width) * 100
    const newTime = (percentage / 100) * safeDuration.value
    musicStore.setCurrentTime(Math.max(0, Math.min(safeDuration.value, newTime)))
  } catch (error) {
    console.error('进度条点击失败:', error)
  }
}

const formatTime = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 监听歌曲变化
watch(safeCurrentSong, (newSong) => {
  if (newSong) {
    isVisible.value = true
  } else {
    isVisible.value = false
  }
}, { immediate: true })
</script>

<style scoped>
/* 样式保持不变 */
.bottom-player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
}

.bottom-player-bar.visible {
  transform: translateY(0);
}

/* 进度条 */
.progress-bar {
  width: 100%;
  height: 3px;
  background: #e0e0e0;
  cursor: pointer;
  position: relative;
}

.progress-track {
  width: 100%;
  height: 100%;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.1s ease;
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
}

.cover-image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  position: relative;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #007bff, #00c6ff);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.song-details {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 播放控制 */
.player-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333;
}

.control-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-icon {
  width: 16px;
  height: 16px;
}

.play-pause-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-pause-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: scale(1.1);
}

.play-pause-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-pause-icon {
  width: 18px;
  height: 18px;
}

/* 时间显示 */
.time-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  min-width: 80px;
  justify-content: flex-end;
}

.time-separator {
  opacity: 0.6;
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
    width: 36px;
    height: 36px;
  }

  .song-title {
    font-size: 13px;
  }

  .song-artist {
    font-size: 11px;
  }

  .player-controls {
    gap: 10px;
  }

  .control-btn {
    width: 30px;
    height: 30px;
  }

  .play-pause-btn {
    width: 36px;
    height: 36px;
  }

  .time-display {
    font-size: 11px;
    min-width: 70px;
  }
}

@media (max-width: 480px) {
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
}
</style>