<template>
  <div class="player-page" :class="{ 'has-song': currentSong, 'visible': isPlayerVisible }">
    <!-- 背景模糊层 -->
    <div class="player-background" :style="backgroundStyle"></div>

    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack" title="返回">
      <ArrowLeftIcon class="back-icon" />
    </button>

    <!-- 主播放器内容 -->
    <div class="player-main-content">
      <!-- 圆形转盘区域 -->
      <div class="turntable-section">
        <div class="turntable-container">
          <!-- 转盘背景（渐变层） -->
          <div class="turntable-bg" :class="{ rotating: isPlaying }">
            <div class="gradient-layer"></div>
            <div class="record-texture"></div>
          </div>

          <!-- 转盘主唱片 -->
          <div class="turntable-disc" :class="{ rotating: isPlaying }">
            <!-- 专辑封面 -->
            <div class="album-cover" :style="coverStyle">
              <div v-if="!currentSong?.coverUrl" class="cover-placeholder">
                <MusicIcon class="placeholder-icon" />
              </div>
            </div>

            <!-- 唱片中心标志 -->
            <div class="record-center">
              <div class="center-logo">S</div>
            </div>

            <!-- 唱臂 -->
            <div class="turntable-arm" :class="{ playing: isPlaying, paused: !isPlaying }">
              <div class="arm-base"></div>
              <div class="arm-rod"></div>
              <div class="needle-head">
                <div class="needle-tip"></div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- 歌曲信息 -->
      <div class="song-info-section">
        <h1 class="song-title">{{ currentSong?.title || '选择一首歌曲' }}</h1>
        <p class="song-artist">{{ currentSong?.singer || '暂无播放' }}</p>
      </div>

        <!-- 当前歌词显示 - 嵌入在转盘下方 -->
        <div class="current-lyric-container" v-if="showLyrics && currentSong">
          <div class="current-lyric" :class="{ 'has-lyrics': hasLyrics, 'no-lyrics': !hasLyrics }">
            {{ currentLyricText }}
          </div>
        </div>
      </div>

    <!-- 底部播放栏 -->
    <div class="player-bottom-bar" :class="{ 'visible': currentSong }">
      <!-- 进度条 -->
      <div class="bottom-progress-section">
        <div class="progress-bar" @click="handleProgressClick" ref="progressBar">
          <div class="progress-track"></div>
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <div class="progress-thumb" :style="{ left: progress + '%' }"></div>
        </div>
      </div>

      <div class="player-content">
        <div class="left-section">
          <!-- 喜欢按钮 -->
          <button class="action-btn like-btn" @click="handleToggleLike" :title="isLiked ? '取消喜欢' : '喜欢'">
            <HeartIcon class="action-icon" :class="{ liked: isLiked }" />
          </button>

          <!-- 时间显示 - 移到左侧 -->
          <div class="time-display" v-if="currentSong">
            <span class="current-time">{{ formatTime(currentTime) }}</span>
            /
            <span class="duration">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 中间：播放控制 -->
        <div class="center-controls">
          <!-- 上一首 -->
          <button class="control-btn prev-btn" @click="handlePrevSong" :disabled="!currentSong || !hasPrevious" title="上一首">
            <PrevIcon class="control-icon" />
          </button>

          <!-- 播放/暂停 -->
          <button class="play-pause-btn" @click="handleTogglePlay" :disabled="!currentSong" :title="isPlaying ? '暂停' : '播放'">
            <PlayIcon v-if="!isPlaying" class="play-pause-icon" />
            <PauseIcon v-else class="play-pause-icon" />
          </button>

          <!-- 下一首 -->
          <button class="control-btn next-btn" @click="handleNextSong" :disabled="!currentSong || !hasNext" title="下一首">
            <NextIcon class="control-icon" />
          </button>
        </div>

        <!-- 右侧：音量和歌词控制 -->
        <div class="right-controls">
          <!-- 播放模式 -->
          <button class="control-btn mode-btn" @click="togglePlayMode" :title="playModeText">
            <RepeatIcon v-if="playMode === 'loop'" class="control-icon" />
            <ShuffleIcon v-else-if="playMode === 'random'" class="control-icon" />
            <SequentialIcon v-else class="control-icon" />
          </button>

          <!-- 歌词显示切换 -->
          <button class="control-btn lyrics-btn" @click="toggleLyricsDisplay" :title="showLyrics ? '隐藏歌词' : '显示歌词'">
            <LyricsIcon class="control-icon" :class="{ active: showLyrics }" />
          </button>

          <!-- 播放列表按钮 -->
          <button class="control-btn playlist-btn" @click="showPlaylist = true" :title="`播放列表 (${playQueue.length})`">
            <PlaylistIcon class="control-icon" />
          </button>

          <!-- 音量控制 -->
          <div class="volume-control">
            <button class="volume-btn" @click="toggleMute" :title="isMuted ? '取消静音' : '静音'">
              <VolumeUpIcon v-if="!isMuted && volume > 0" class="volume-icon" />
              <VolumeOffIcon v-else class="volume-icon" />
            </button>
            <div class="volume-slider" @click="handleVolumeClick" ref="volumeSlider">
              <div class="volume-track"></div>
              <div class="volume-fill" :style="{ width: volume + '%' }"></div>
              <div class="volume-thumb" :style="{ left: volume + '%' }"></div>
            </div>
          </div>

          <!-- 重试按钮（仅在错误时显示） -->
          <button v-if="audioError" class="control-btn retry-btn" @click="handleRetry" title="重试播放">
            <RetryIcon class="control-icon" />
          </button>
        </div>
      </div>
    </div>

    <!-- 播放列表模态框 -->
    <PlaylistModal
        v-if="showPlaylist"
        :songs="playQueue"
        :current-index="currentIndex"
        @close="showPlaylist = false"
        @play-song="handlePlaySongFromList"
        @remove-song="handleRemoveFromQueue"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'
import { storeToRefs } from 'pinia'

// 图标组件
import ArrowLeftIcon from '@/assets/icons/ArrowLeftIcon.vue'
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
import LyricsIcon from '@/assets/icons/LyricsIcon.vue'
import RetryIcon from '@/assets/icons/RetryIcon.vue'
import PlaylistIcon from '@/assets/icons/PlaylistIcon.vue'

// 组件
import PlaylistModal from '@/components/PlaylistModal.vue'

const route = useRoute()
const router = useRouter()
const musicStore = useMusicStore()

// 响应式数据
const isPlayerVisible = ref(false)
const showLyrics = ref(true)
const showPlaylist = ref(false)
const isMuted = ref(false)
const progressBar = ref(null)
const volumeSlider = ref(null)
const isSeeking = ref(false)

// 从store获取状态
const {
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  playQueue,
  currentIndex,
  playMode,
  likedSongs,
  starredSongs,
  currentLyrics,
  currentLyricIndex,
  audioError,
  isWaiting,
  audioHealth
} = storeToRefs(musicStore)

// 计算属性
const coverStyle = computed(() => {
  if (currentSong.value?.coverUrl) {
    return { backgroundImage: `url(${currentSong.value.coverUrl})` }
  }
  return {}
})

const backgroundStyle = computed(() => {
  if (currentSong.value?.coverUrl) {
    return {
      backgroundImage: `url(${currentSong.value.coverUrl})`,
      filter: 'blur(20px) brightness(0.6)'
    }
  }
  return {
    backgroundColor: 'var(--primary-color, #e74c3c)'
  }
})

const progress = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

const isLiked = computed(() => {
  return currentSong.value ? musicStore.isLiked(currentSong.value.id) : false
})

const playModeText = computed(() => {
  switch (playMode.value) {
    case 'loop': return '循环播放'
    case 'random': return '随机播放'
    default: return '顺序播放'
  }
})

const hasPrevious = computed(() => {
  return playQueue.value.length > 1 || musicStore.allMusics.length > 1
})

const hasNext = computed(() => {
  return playQueue.value.length > 1 || musicStore.allMusics.length > 1
})

// 当前歌词文本
const currentLyricText = computed(() => {
  if (!currentLyrics.value.length) return '🎵 暂无歌词'

  if (currentLyricIndex.value >= 0 && currentLyricIndex.value < currentLyrics.value.length) {
    return currentLyrics.value[currentLyricIndex.value].text
  }

  return currentLyrics.value[0]?.text || '🎵 暂无歌词'
})

// 是否有真实歌词（非占位符）
const hasLyrics = computed(() => {
  if (!currentLyrics.value.length) return false

  const firstLyric = currentLyrics.value[0]
  return !(firstLyric.id.includes('placeholder') || firstLyric.id.includes('no-lyrics'))
})

const audioHealthStatus = computed(() => {
  if (audioError.value) return 'error'
  if (isWaiting.value) return 'loading'
  if (audioHealth.value === 'ready') return 'healthy'
  return 'idle'
})


const goBack = () => {
  router.back()
}

const handleTogglePlay = async () => {
  if (!currentSong.value) {
    if (playQueue.value.length > 0) {
      await handlePlaySong(playQueue.value[0])
    }
    return
  }

  try {
    await musicStore.togglePlay()
  } catch (error) {
    console.error('播放控制失败:', error)
  }
}

const handlePrevSong = async () => {
  if (!currentSong.value || !hasPrevious.value) return
  try {
    await musicStore.prevSong()
  } catch (error) {
    console.error('上一首失败:', error)
  }
}

const handleNextSong = async () => {
  if (!currentSong.value || !hasNext.value) return
  try {
    await musicStore.nextSong()
  } catch (error) {
    console.error('下一首失败:', error)
  }
}

const handlePlaySong = async (song, playlist = null) => {
  if (!song) return
  try {
    await musicStore.playSong(song, playlist)
  } catch (error) {
    console.error('播放歌曲失败:', error)
  }
}

const handleToggleLike = () => {
  if (!currentSong.value) return
  if (isLiked.value) {
    musicStore.dislikeSong(currentSong.value.id)
  } else {
    musicStore.likeSong(currentSong.value.id)
  }
}

const togglePlayMode = () => {
  const modes = ['sequential', 'loop', 'random']
  const currentModeIndex = modes.indexOf(playMode.value)
  const nextMode = modes[(currentModeIndex + 1) % modes.length]
  musicStore.setPlayMode(nextMode)
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  musicStore.setVolume(isMuted.value ? 0 : volume.value || 50)
}

const handleProgressClick = (event) => {
  if (!currentSong.value || !progressBar.value) return
  try {
    const rect = progressBar.value.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    const percentage = Math.max(0, Math.min(100, (clickX / width) * 100))
    const newTime = (percentage / 100) * duration.value
    isSeeking.value = true
    musicStore.seekTo(newTime)
    currentTime.value = newTime
    setTimeout(() => {
      isSeeking.value = false
    }, 100)
  } catch (error) {
    console.error('进度条点击失败:', error)
  }
}

const handleVolumeClick = (event) => {
  if (!volumeSlider.value) return
  const rect = volumeSlider.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const width = rect.width
  const newVolume = (clickX / width) * 100
  musicStore.setVolume(Math.max(0, Math.min(100, newVolume)))
  isMuted.value = newVolume === 0
}

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const toggleLyricsDisplay = () => {
  showLyrics.value = !showLyrics.value
}

const handlePlaySongFromList = (song, index) => {
  handlePlaySong(song, playQueue.value)
}

const handleRemoveFromQueue = (index) => {
  musicStore.removeFromQueue(index)
}

const handleRetry = async () => {
  try {
    await musicStore.retryPlay()
  } catch (error) {
    console.error('重试播放失败:', error)
  }
}

// 监听器
watch(currentSong, (newSong, oldSong) => {
  console.log('歌曲切换:', oldSong?.title, '->', newSong?.title)
  if (newSong && newSong !== oldSong) {
    isPlayerVisible.value = true
  } else if (!newSong) {
    isPlayerVisible.value = false
  }
})

watch(currentTime, (newTime) => {
  if (!isSeeking.value) {
    musicStore.updateCurrentLyricIndex(newTime)
  }
})

// 生命周期
onMounted(() => {
  isPlayerVisible.value = !!currentSong.value
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
.current-lyric-container {
  margin-top: 30px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 80%;
  text-align: center;
}

.current-lyric {
  font-size: 18px;
  line-height: 1.4;
  color: var(--text-primary);
  text-shadow: var(--shadow-medium);
  opacity: 0;
  transform: translateY(20px);
  transition: all var(--transition-normal) var(--ease-out);
  padding: 12px 20px;
  border-radius: var(--radius-large);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: var(--bg-blur);
  max-width: 100%;
  word-break: break-word;
}

.current-lyric.has-lyrics {
  opacity: 1;
  transform: translateY(0);
}

.current-lyric.no-lyrics {
  opacity: 0.7;
  font-style: italic;
  color: var(--text-muted);
}

/* 优化转盘区域间距 */
.turntable-section {
  margin-bottom: 20px;
}

/* 调整歌曲信息区域间距 */
.song-info-section {
  margin-bottom: 20px;
}

/* 移除原有的歌词区域样式 */
.lyrics-section {
  display: none;
}

.additional-controls {
  display: none;
}

/* 底部播放栏样式调整 */
.right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

/* 歌词按钮激活状态 */
.lyrics-btn.active .control-icon {
  color: var(--primary-color);
}

/* 播放列表按钮样式 */
.playlist-btn {
  position: relative;
}

.playlist-btn::after {
  content: attr(data-count);
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--primary-color);
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .current-lyric-container {
    margin-top: 20px;
    min-height: 50px;
    max-width: 90%;
  }

  .current-lyric {
    font-size: 16px;
    padding: 8px 16px;
  }

  .right-controls {
    gap: 6px;
  }

  .playlist-btn::after {
    font-size: 9px;
    padding: 1px 4px;
    min-width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .current-lyric {
    font-size: 14px;
    padding: 6px 12px;
  }

  /* 在小屏幕上隐藏一些控制按钮的文字提示 */
  .control-btn {
    width: 32px;
    height: 32px;
  }

  .control-icon {
    width: 16px;
    height: 16px;
  }
}

/* 保留其他原有样式不变 */
.player-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text-primary);
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.player-page.visible {
  transform: translateY(0);
}

.player-background {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(20px) brightness(0.6);
  transform: scale(1.1);
  z-index: 1;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: var(--secondary-color);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.1);
}

.back-icon {
  width: 20px;
  height: 20px;
  color: var(--text-primary);
}

.player-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 100px;
  position: relative;
  z-index: 2;
  text-align: center;
}

.turntable-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.turntable-container {
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 转盘背景（渐变层） */
.turntable-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-circle);
  overflow: hidden;
  box-shadow:
      0 0 0 8px rgba(255, 255, 255, 0.05),
      0 0 30px rgba(0, 0, 0, 0.5),
      inset 0 0 20px rgba(0, 0, 0, 0.3);
  transition: transform 0.5s var(--ease-out);
}

.gradient-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-circle);
  background: conic-gradient(
      from 0deg,
      rgba(231, 76, 60, 0.1),
      rgba(243, 156, 18, 0.1),
      rgba(46, 204, 113, 0.1),
      rgba(52, 152, 219, 0.1),
      rgba(155, 89, 182, 0.1),
      rgba(231, 76, 60, 0.1)
  );
  opacity: 0.7;
}

.record-texture {
  position: absolute;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
  border-radius: var(--radius-circle);
  background:
      radial-gradient(
          circle at center,
          transparent 30%,
          rgba(0, 0, 0, 0.1) 70%,
          rgba(0, 0, 0, 0.2) 100%
      ),
      repeating-radial-gradient(
          circle at center,
          transparent,
          transparent 5px,
          rgba(255, 255, 255, 0.03) 5px,
          rgba(255, 255, 255, 0.03) 6px
      );
}

/* 转盘主唱片 */
.turntable-disc {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: var(--radius-circle);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow:
      0 0 0 10px rgba(0, 0, 0, 0.2),
      0 0 30px rgba(0, 0, 0, 0.5),
      inset 0 0 20px rgba(0, 0, 0, 0.3);
  background:
      radial-gradient(
          circle at center,
          #2c3e50 0%,
          #34495e 30%,
          #2c3e50 70%,
          #1a252f 100%
      );
  transition: transform 0.5s var(--ease-out);
}

/* 专辑封面 */
.album-cover {
  width: 180px;
  height: 180px;
  border-radius: var(--radius-circle);
  overflow: hidden;
  background-size: cover;
  background-position: center;
  box-shadow:
      0 0 20px rgba(0, 0, 0, 0.5),
      inset 0 0 10px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: rgba(255, 255, 255, 0.3);
}

.placeholder-icon {
  width: 60px;
  height: 60px;
}

/* 唱片中心标志 */
.record-center {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-circle);
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 3;
}

.center-logo {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

/* 唱臂 */
.turntable-arm {
  position: absolute;
  top: -60px;
  right: 40px;
  width: 120px;
  height: 120px;
  transform-origin: right bottom;
  transition: transform 1s var(--ease-out);
  z-index: 4;
}

.arm-base {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #7f8c8d;
  border-radius: var(--radius-circle);
  bottom: 0;
  right: 0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.arm-rod {
  position: absolute;
  width: 100px;
  height: 8px;
  background: linear-gradient(to left, #bdc3c7, #95a5a6);
  bottom: 10px;
  right: 10px;
  border-radius: 4px;
  transform: rotate(-15deg);
  transform-origin: right bottom;
}

.needle-head {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #34495e;
  border-radius: var(--radius-circle);
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.needle-tip {
  width: 2px;
  height: 15px;
  background: #e74c3c;
  border-radius: 1px;
}

/* 旋转动画 */
.rotating {
  animation: rotate 10s linear infinite;
}

/* 唱臂播放状态 */
.turntable-arm.playing {
  transform: rotate(-15deg);
}

.turntable-arm.paused {
  transform: rotate(15deg);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 歌曲信息区域 */
.song-info-section {
  text-align: center;
  margin-bottom: 40px;
  max-width: 500px;
}

.song-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: var(--shadow-small);
  line-height: 1.2;
  color: var(--text-primary);
}

.song-artist {
  font-size: 16px;
  color: var(--text-secondary);
  text-shadow: var(--shadow-small);
  margin: 0;
}

/* 歌词容器 - 居中显示 */
.current-lyric-container {
  margin-top: 0; /* 移除之前的顶部间距 */
  margin-bottom: 20px; /* 增加歌词与底部播放栏的间距 */
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 80%;
  text-align: center;
}

.current-lyric {
  font-size: 18px;
  line-height: 1.4;
  color: var(--text-primary);
  text-shadow: var(--shadow-medium);
  opacity: 0;
  transform: translateY(20px);
  transition: all var(--transition-normal) var(--ease-out);
  padding: 12px 20px;
  border-radius: var(--radius-large);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: var(--bg-blur);
  max-width: 100%;
  word-break: break-word;
}

.current-lyric.has-lyrics {
  opacity: 1;
  transform: translateY(0);
}

.current-lyric.no-lyrics {
  opacity: 0.7;
  font-style: italic;
  color: var(--text-muted);
}


/* 时间显示样式调整 */
.time-display {
  display: flex;
  gap: 4px;
  font-size: 14px;
  color: var(--text-muted);
  white-space: nowrap;
}


/* 底部播放栏 */
.player-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: var(--bg-secondary);
  backdrop-filter: var(--bg-blur);
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border-light);
  z-index: 1001;
  transform: translateY(100%);
  transition: transform var(--transition-normal) var(--ease-out);
  box-shadow: var(--shadow-large);
}

.player-bottom-bar.visible {
  transform: translateY(0);
}

/* 进度条部分 */
.bottom-progress-section {
  flex-shrink: 0;
  height: 3px;
  width: 100%;
  cursor: pointer;
  position: relative;
}

.bottom-progress-section .progress-bar {
  width: 100%;
  height: 100%;
  background: var(--bg-hover);
  position: relative;
}

.bottom-progress-section .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transition: width 0.1s ease;
}

.bottom-progress-section .progress-thumb {
  width: 8px;
  height: 8px;
  background: var(--accent-color);
  border-radius: var(--radius-circle);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity var(--transition-normal) var(--ease-out);
}

.bottom-progress-section:hover .progress-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 播放控制区域 */
.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  flex: 1;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px; /* 增加喜欢按钮和时间显示之间的间距 */
  flex: 1;
  min-width: 0;
}
/* 中间：播放控制按钮居中 */
.center-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-shrink: 0;
}

/* 右侧：其他控制按钮 */
.right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-circle);
  background: var(--background-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.action-btn:hover::before {
  opacity: 0.1;
}

.action-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.1);
}

.action-icon {
  width: 16px;
  height: 16px;
  z-index: 1;
}

.action-icon.liked {
  color: var(--primary-color);
  fill: var(--primary-color);
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-circle);
  background: var(--background-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.control-btn:hover::before {
  opacity: 0.1;
}

.control-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.control-icon {
  width: 18px;
  height: 18px;
  z-index: 1;
}

.play-pause-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-circle);
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out);
  box-shadow: var(--shadow-medium);
}

.play-pause-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: var(--shadow-large);
}

.play-pause-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.play-pause-icon {
  width: 20px;
  height: 20px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-circle);
  background: var(--background-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
}

.volume-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.volume-btn:hover::before {
  opacity: 0.1;
}

.volume-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.1);
}

.volume-icon {
  width: 16px;
  height: 16px;
  z-index: 1;
}

.volume-slider {
  width: 80px;
  height: 4px;
  background: var(--bg-hover);
  border-radius: var(--radius-circle);
  cursor: pointer;
  position: relative;
  transition: height var(--transition-fast);
}

.volume-slider:hover {
  height: 6px;
}

.volume-track {
  width: 100%;
  height: 100%;
}

.volume-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  border-radius: var(--radius-circle);
  transition: width var(--transition-normal) var(--ease-out);
}

.volume-thumb {
  width: 8px;
  height: 8px;
  background: var(--accent-color);
  border-radius: var(--radius-circle);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity var(--transition-normal) var(--ease-out);
}

.volume-slider:hover .volume-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .turntable-container {
    width: 280px;
    height: 280px;
  }

  .turntable-disc {
    width: 240px;
    height: 240px;
  }

  .album-cover {
    width: 150px;
    height: 150px;
  }

  .song-title {
    font-size: 24px;
  }

  .player-content {
    padding: 0 15px;
  }

  .center-controls {
    gap: 12px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
  }

  .play-pause-btn {
    width: 40px;
    height: 40px;
  }

  .volume-slider {
    width: 60px;
  }
}

@media (max-width: 480px) {
  .turntable-container {
    width: 240px;
    height: 240px;
  }

  .turntable-disc {
    width: 200px;
    height: 200px;
  }

  .album-cover {
    width: 120px;
    height: 120px;
  }

  .song-title {
    font-size: 20px;
  }

  .song-artist {
    font-size: 14px;
  }

  .player-main-content {
    padding: 30px 15px 80px;
  }

  .right-controls {
    gap: 4px;
  }

  .volume-control {
    display: none; /* 在小屏幕上隐藏音量控制 */
  }

  .current-lyric {
    font-size: 14px;
    padding: 8px 12px;
  }
}

/* 动画优化 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.current-lyric {
  animation: fadeInUp 0.5s var(--ease-out);
}

/* 加载状态优化 */
.lyrics-loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
}

.loading-dots {
  display: inline-flex;
  gap: 2px;
}

.loading-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 错误状态样式 */
.lyrics-error {
  color: var(--text-muted);
  font-style: italic;
  opacity: 0.7;
}

/* 歌词切换过渡效果 */
.lyrics-transition-enter-active,
.lyrics-transition-leave-active {
  transition: all 0.3s var(--ease-out);
}

.lyrics-transition-enter-from,
.lyrics-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>