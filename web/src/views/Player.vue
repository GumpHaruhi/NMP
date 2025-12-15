<template>
  <div class="player-page" :class = "{'has-song' : currentSong}">

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
            <!-- 渐变背景 -->
            <div class="gradient-layer"></div>
            <!-- 唱片纹理 -->
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

        <!-- 时间显示 -->
        <div class="time-display" v-if="currentSong">
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="duration">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- 歌词显示区域 -->
      <div class="lyrics-section" v-if="showLyrics && lyrics.length > 0">
        <div class="lyrics-container" ref="lyricsContainer">
          <div
              v-for="(line, index) in lyrics"
              :key="index"
              class="lyric-line"
              :class="{
              active: currentLyricIndex === index,
              passed: index < currentLyricIndex
            }"
          >
            {{ line.text }}
          </div>
        </div>
      </div>

      <div v-else-if="showLyrics" class="no-lyrics">
        <p>暂无歌词</p>
      </div>

      <!-- 进度条 -->
      <div class="progress-section" v-if="currentSong">
        <div class="progress-bar" @click="handleProgressClick" ref="progressBar">
          <div class="progress-track"></div>
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <div class="progress-thumb" :style="{ left: progress + '%' }"></div>
        </div>
      </div>

      <!-- 附加控制 -->
      <div class="additional-controls">
        <!-- 歌词显示切换 -->
        <button class="lyrics-toggle-btn" @click="toggleLyricsDisplay">
          {{ showLyrics ? '隐藏歌词' : '显示歌词' }}
        </button>

        <!-- 播放列表按钮 -->
        <button class="playlist-btn" @click="showPlaylist = true" title="播放列表">
          播放列表 ({{ playQueue.length }})
        </button>
      </div>
    </div>

    <!-- 底部播放栏 -->
    <div class="player-bottom-bar" :class="{ 'visible': currentSong }">
      <!-- 进度条 -->
      <div class="bottom-progress-section">
        <div class="progress-bar" @click="handleProgressClick" ref="bottomProgressBar">
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
        </div>

        <!-- 中间：播放控制 -->
        <div class="center-controls">
          <!-- 上一首 -->
          <button class="control-btn prev-btn" @click="handlePrevSong" :disabled="!currentSong" title="上一首">
            <PrevIcon class="control-icon" />
          </button>

          <!-- 播放/暂停 -->
          <button class="play-pause-btn" @click="handleTogglePlay" :disabled="!currentSong" :title="isPlaying ? '暂停' : '播放'">
            <PlayIcon v-if="!isPlaying" class="play-pause-icon" />
            <PauseIcon v-else class="play-pause-icon" />
          </button>

          <!-- 下一首 -->
          <button class="control-btn next-btn" @click="handleNextSong" :disabled="!currentSong" title="下一首">
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
            <LyricsIcon class="control-icon" />
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
import { parseLRC } from '@/utils/lrcParser'

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
import PlaylistIcon from '@/assets/icons/PlaylistIcon.vue'

// 组件
import PlaylistModal from '@/components/PlaylistModal.vue'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const musicStore = useMusicStore()

// 响应式数据
const showLyrics = ref(true)
const showPlaylist = ref(false)
const isMuted = ref(false)
const lyrics = ref([])
const currentLyricIndex = ref(-1)
const lyricsContainer = ref(null)
const progressBar = ref(null)
const volumeSlider = ref(null)
const bottomProgressBar = ref(null)

// 从store获取状态和方法
// 使用 storeToRefs 保持响应式
const {
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  playQueue,
  currentIndex,
  playMode,
  progress,
  isLiked
} = storeToRefs(musicStore)

// 方法不需要响应式，可以直接解构
const {
  playSong,
  togglePlay,
  prevSong,
  nextSong,
  setCurrentTime,
  setVolume,
  setPlayMode,
  likeSong,
  dislikeSong,
  removeFromQueue
} = musicStore

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

const playModeText = computed(() => {
  switch (playMode.value) {
    case 'loop': return '循环播放'
    case 'random': return '随机播放'
    default: return '顺序播放'
  }
})

// 方法
const goBack = () => {
  router.back()
}

const handleTogglePlay = () => {
  if (!currentSong.value) return
  togglePlay()
}

const handlePrevSong = () => {
  if (!currentSong.value) return
  prevSong()
}

const handleNextSong = () => {
  if (!currentSong.value) return
  nextSong()
}

const handleToggleLike = () => {
  if (!currentSong.value) return

  if (isLiked.value) {
    dislikeSong(currentSong.value.id)
  } else {
    likeSong(currentSong.value.id)
  }
}

const togglePlayMode = () => {
  const modes = ['sequential', 'loop', 'random']
  const currentModeIndex = modes.indexOf(playMode.value)
  const nextMode = modes[(currentModeIndex + 1) % modes.length]
  setPlayMode(nextMode)
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  setVolume(isMuted.value ? 0 : volume.value || 50)
}

const handleProgressClick = (event) => {
  if (!currentSong.value || !progressBar.value) return

  try {
    const rect = progressBar.value.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    const percentage = (clickX / width) * 100
    const newTime = (percentage / 100) * duration.value
    setCurrentTime(Math.max(0, Math.min(duration.value, newTime)))
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
  setVolume(Math.max(0, Math.min(100, newVolume)))
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
  playSong(song, playQueue.value)
}

const handleRemoveFromQueue = (index) => {
  removeFromQueue(index)
}

// 歌词功能
const loadLyrics = async () => {
  if (!currentSong.value?.lyricsUrl) {
    lyrics.value = []
    return
  }

  try {
    const response = await fetch(currentSong.value.lyricsUrl)
    const lrcText = await response.text()
    lyrics.value = parseLRC(lrcText)
    currentLyricIndex.value = -1
  } catch (error) {
    console.error('歌词加载失败:', error)
    lyrics.value = []
  }
}

const updateCurrentLyric = () => {
  if (lyrics.value.length === 0) {
    currentLyricIndex.value = -1
    return
  }

  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (currentTime.value >= lyrics.value[i].time) {
      currentLyricIndex.value = i
      break
    }
  }
}

const scrollToCurrentLyric = async () => {
  if (!lyricsContainer.value || currentLyricIndex.value === -1) return

  await nextTick()

  const container = lyricsContainer.value
  const activeLine = container.querySelector('.lyric-line.active')

  if (activeLine) {
    const containerHeight = container.clientHeight
    const lineHeight = activeLine.offsetHeight
    const lineTop = activeLine.offsetTop

    const scrollTo = lineTop - (containerHeight - lineHeight) / 2

    container.scrollTo({
      top: scrollTo,
      behavior: 'smooth'
    })
  }
}

// 键盘快捷键
const handleKeyPress = (event) => {
  switch (event.code) {
    case 'Space':
      event.preventDefault()
      handleTogglePlay()
      break
    case 'ArrowLeft':
      event.preventDefault()
      setCurrentTime(Math.max(0, currentTime.value - 10))
      break
    case 'ArrowRight':
      event.preventDefault()
      setCurrentTime(Math.min(duration.value, currentTime.value + 10))
      break
    case 'ArrowUp':
      event.preventDefault()
      setVolume(Math.min(100, volume.value + 10))
      isMuted.value = false
      break
    case 'ArrowDown':
      event.preventDefault()
      setVolume(Math.max(0, volume.value - 10))
      if (volume.value <= 0) isMuted.value = true
      break
    case 'Escape':
      goBack()
      break
    case 'KeyL':
      event.preventDefault()
      toggleLyricsDisplay()
      break
    case 'KeyP':
      event.preventDefault()
      showPlaylist.value = !showPlaylist.value
      break
  }
}

// 增强监听器 - 添加更多状态的监听
watch(currentSong, async (newSong, oldSong) => {
  console.log('歌曲切换:', oldSong?.title, '->', newSong?.title)

  if (newSong && newSong !== oldSong) {
    await loadLyrics()
    // 强制更新视图
    await nextTick()
    updateDisplay()
  } else if (!newSong) {
    lyrics.value = []
  }
})

// 监听播放索引变化
watch(currentIndex, (newIndex, oldIndex) => {
  if (newIndex !== oldIndex && newIndex >= 0 && playQueue.value[newIndex]) {
    console.log('播放索引变化:', oldIndex, '->', newIndex)

    updateDisplay()
  }
},{ deep: true })

// 监听播放队列变化
watch(playQueue, (newQueue, oldQueue) => {
  console.log('播放队列更新，长度:', newQueue.length)
}, { deep: true })

// 新增显示更新方法
const updateDisplay = () => {
  // 强制更新相关计算属性
  coverStyle.value = { ...coverStyle.value }
  backgroundStyle.value = { ...backgroundStyle.value }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)

  // 初始化store数据
  if (musicStore.allMusics.length === 0) {
    musicStore.initialize()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
/* 播放器主容器 */
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
}

/* 背景模糊层 */
.player-background {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background-size: cover;
  background-position: center;
  filter: var(--bg-blur) brightness(0.6);
  transform: scale(1.1);
  z-index: 1;
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: var(--secondary-color);
  border: none;
  border-radius: var(--radius-circle);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all var(--transition-normal) var(--ease-out);
  backdrop-filter: var(--bg-blur);
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

/* 主内容区域 */
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

/* 转盘区域样式 */
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

/* 时间显示 */
.time-display {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  font-size: 14px;
  color: var(--text-muted);
}

/* 歌词区域 */
.lyrics-section {
  width: 100%;
  max-width: 600px;
  margin-bottom: 40px;
  max-height: 200px;
  overflow-y: auto;
  scroll-behavior: smooth;
  background: var(--background-card);
  backdrop-filter: var(--bg-blur);
  border-radius: var(--radius-large);
  padding: 20px;
  border: 1px solid var(--border-light);
}

.lyrics-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
}

.lyric-line {
  font-size: 18px;
  line-height: 1.5;
  opacity: 0.6;
  transition: all var(--transition-normal) var(--ease-out);
  text-align: center;
  padding: 8px 16px;
  border-radius: var(--radius-medium);
  color: var(--text-muted);
  margin: 4px 0;
}

.lyric-line.active {
  font-size: 22px;
  font-weight: 600;
  opacity: 1;
  background: var(--bg-hover);
  backdrop-filter: var(--bg-blur);
  transform: scale(1.02);
  color: var(--text-primary);
}

.lyric-line.passed {
  opacity: 0.8;
  color: var(--text-secondary);
}

.no-lyrics {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  opacity: 0.7;
}

/* 进度条区域 */
.progress-section {
  width: 100%;
  max-width: 500px;
  margin-bottom: 40px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-hover);
  border-radius: var(--radius-circle);
  cursor: pointer;
  position: relative;
  margin-bottom: 8px;
  transition: height var(--transition-fast);
}

.progress-bar:hover {
  height: 6px;
}

.progress-track {
  width: 100%;
  height: 100%;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  border-radius: var(--radius-circle);
  transition: width 0.1s ease;
  position: relative;
}

.progress-thumb {
  width: 12px;
  height: 12px;
  background: var(--accent-color);
  border-radius: var(--radius-circle);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity var(--transition-normal) var(--ease-out);
  box-shadow: var(--shadow-small);
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 附加控制按钮 */
.additional-controls {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.lyrics-toggle-btn, .playlist-btn {
  background: var(--background-card);
  border: none;
  border-radius: var(--radius-large);
  padding: 8px 16px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out);
  backdrop-filter: var(--bg-blur);
}

.lyrics-toggle-btn:hover, .playlist-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.05);
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

/* 播放控制区域 - 关键修改部分 */
.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  flex: 1;
}

/* 左侧：歌曲信息和喜欢按钮 */
.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
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

  .soulform-text {
    font-size: 20px;
  }

  .song-title {
    font-size: 24px;
  }
}
</style>