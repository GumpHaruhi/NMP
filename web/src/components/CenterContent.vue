<template>
  <div class="center-content">
    <div class="content-container" :class="{ 'has-content': hasGeneratedContent }">
      <!-- 引导状态 -->
      <div v-if="!hasGeneratedContent" class="guide-state">
        <div class="guide-animation">
          <div class="floating-music-note">♪</div>
          <div class="floating-music-note">♫</div>
          <div class="floating-music-note">♬</div>
        </div>
        <h2 class="guide-title">发现你的音乐</h2>
        <p class="guide-text">
          {{ getGuideText() }}
        </p>
        <div class="guide-hints">
          <div class="hint-item">
            <div class="hint-icon">🎯</div>
            <span>点击左侧泡泡选择音乐类型</span>
          </div>
          <div class="hint-item">
            <div class="hint-icon">💭</div>
            <span>选择场景标签描述你的心情</span>
          </div>
          <div class="hint-item">
            <div class="hint-icon">🤖</div>
            <span>或直接告诉AI助手你的需求</span>
          </div>
        </div>
      </div>

      <!-- 生成的内容 -->
      <div v-else class="generated-content">
        <!-- 推荐歌单 -->
        <div v-if="generatedPlaylists.length > 0" class="content-section">
          <div class="section-header">
            <h3>🎧 为你推荐</h3>
            <button class="refresh-btn" @click="$emit('refresh')">
              <RefreshIcon class="refresh-icon" />
              换一批
            </button>
          </div>
          <div class="playlists-grid animated-fade">
            <div
              v-for="playlist in generatedPlaylists"
              :key="playlist.id"
              class="playlist-card"
              @click="$emit('goto-playlist', playlist.id)"
            >
              <div class="playlist-cover">
                <div class="cover-gradient" :style="getGradientStyle(playlist)"></div>
                <div class="cover-icon">🎵</div>
              </div>
              <div class="playlist-info">
                <h4>{{ playlist.name }}</h4>
                <p>{{ playlist.songCount || 0 }} 首歌曲 · {{ formatDuration(playlist.duration) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 推荐歌曲 -->
        <div v-if="generatedSongs.length > 0" class="content-section">
          <div class="section-header">
            <h3>🎵 精选歌曲</h3>
            <button class="play-all-btn" @click="$emit('play-all-generated')">
              <PlayIcon class="btn-icon" />
              播放全部
            </button>
          </div>
          <div class="songs-list">
            <SongItem
              v-for="(song, index) in generatedSongs"
              :key="song.id"
              :song="song"
              :track-order="index + 1"
              @play="$emit('play-song', song)"
            />
          </div>
        </div>

        <div v-if="aiGenerating" class="ai-generating-state">
            <div class="loading-animation">
                <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                </div>
                <div class="loading-text">AI正在为你生成歌单...</div>
            </div>
        </div>

        <!-- AI生成的歌单 -->
        <div v-else-if="aiGeneratedPlaylist" class="content-section">
          <div class="section-header">
            <h3>🤖 AI生成歌单</h3>
            <span class="ai-badge">AI</span>
          </div>
          <div class="ai-playlist-card">
            <div class="ai-playlist-header">
              <div class="ai-playlist-cover">
                <div class="ai-cover-animation">
                  <div class="pulse-ring"></div>
                  <div class="ai-cover-icon">🤖</div>
                </div>
              </div>
              <div class="ai-playlist-info">
                <h3>{{ aiGeneratedPlaylist.name }}</h3>
                <p>{{ aiGeneratedPlaylist.description }}</p>
                <div class="ai-playlist-stats">
                  <span>{{ aiGeneratedPlaylist.songCount }} 首歌曲</span>
                  <span>时长 {{ formatDuration(aiGeneratedPlaylist.duration) }}</span>
                </div>
                <div class="ai-playlist-actions">
                  <button class="play-ai-btn" @click="$emit('play-ai-playlist', aiGeneratedPlaylist)">
                    <PlayIcon class="play-icon" />
                    播放歌单
                  </button>
                  <!-- 保存为正式歌单按钮 -->
                  <button class="save-as-playlist-btn" @click="$emit('save-ai-playlist')">
                    <SaveIcon class="save-icon" />
                    保存歌单
                  </button>
                </div>
              </div>
            </div>
            <div class="ai-playlist-songs">
              <SongItem
                v-for="(song, index) in aiGeneratedPlaylist.songs"
                :key="song.id"
                :song="song"
                :track-order="index + 1"
                @play="$emit('play-song', song)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SongItem from '@/components/SongItem.vue'
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import SaveIcon from '@/assets/icons/SaveIcon.vue'
import RefreshIcon from '@/assets/icons/RefreshIcon.vue'

const props = defineProps({
  hasGeneratedContent: {
    type: Boolean,
    default: false
  },
  generatedSongs: {
    type: Array,
    default: () => []
  },
  generatedPlaylists: {
    type: Array,
    default: () => []
  },
  aiGeneratedPlaylist: {
    type: Object,
    default: null
  },
  selectedGenres: {
    type: Array,
    default: () => []
  },
  selectedTags: {
    type: Array,
    default: () => []
  },
  aiGenerating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'refresh',
  'goto-playlist',
  'play-all-generated',
  'play-song',
  'play-ai-playlist',
  'save-ai-playlist',
  'ai-generating'
])

// 引导文本
const getGuideText = () => {
  if (props.selectedGenres.length === 0 && props.selectedTags.length === 0) {
    return '选择音乐类型或场景标签，让我为你推荐合适的音乐'
  } else if (props.selectedGenres.length > 0) {
    return `已选择 ${props.selectedGenres.length} 种音乐类型，点击"生成"开始推荐`
  } else {
    return `已选择 ${props.selectedTags.length} 个场景标签，点击"生成"开始推荐`
  }
}

// 生成渐变背景
const getGradientStyle = (playlist) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  ]
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)]
  return {
    background: randomGradient
  }
}

// 工具函数
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.center-content {
  min-height: calc(100vh - 250px);
  overflow: hidden;
}

.content-container {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  height: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.5s ease;
  overflow-y: auto;
}

/* 移除滚动条样式 */
.content-container::-webkit-scrollbar {
  display: none;
}

.content-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 引导状态 */
.guide-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  gap: 32px;
}

.guide-animation {
  position: relative;
  width: 200px;
  height: 200px;
}

.floating-music-note {
  position: absolute;
  font-size: 40px;
  animation: float 6s ease-in-out infinite;
  color: var(--primary-color);
}

.floating-music-note:nth-child(1) {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.floating-music-note:nth-child(2) {
  top: 40%;
  left: 60%;
  animation-delay: 2s;
}

.floating-music-note:nth-child(3) {
  top: 70%;
  left: 30%;
  animation-delay: 4s;
}

.guide-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.guide-text {
  font-size: 16px;
  color: var(--text-secondary);
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}

.guide-hints {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--secondary-color);
  border-radius: 12px;
  color: var(--text-primary);
  animation: slideIn 0.5s ease backwards;
}

.hint-item:nth-child(1) { animation-delay: 0.1s; }
.hint-item:nth-child(2) { animation-delay: 0.2s; }
.hint-item:nth-child(3) { animation-delay: 0.3s; }

.hint-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 生成的内容 */
.generated-content {
  animation: fadeIn 0.5s ease;
}

.content-section {
  margin-bottom: 40px;
}

.content-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.ai-badge {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* AI歌单卡片 */
.ai-playlist-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.ai-playlist-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.ai-playlist-cover {
  position: relative;
  width: 120px;
  height: 120px;
}

.ai-cover-animation {
  width: 100%;
  height: 100%;
  position: relative;
}

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid var(--primary-color);
  border-radius: 20px;
  animation: pulse 2s infinite;
}

.ai-cover-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
}

.ai-playlist-info h3 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 24px;
}

.ai-playlist-info p {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.ai-playlist-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.play-ai-btn, .save-as-playlist-btn {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.play-ai-btn:hover, .save-as-playlist-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

/* 播放全部按钮 */
.play-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--primary-color);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-all-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 刷新按钮 */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

/* 歌单网格 */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.playlist-card {
  background: var(--secondary-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.playlist-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.playlist-cover {
  height: 120px;
  position: relative;
}

.cover-gradient {
  width: 100%;
  height: 100%;
}

.cover-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 40px;
  color: white;
}

.playlist-info {
  padding: 16px;
}

.playlist-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
}

.playlist-info p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 歌曲列表 */
.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animated-fade {
  animation: fadeIn 0.5s ease;
}

.ai-playlist-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .playlists-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .playlists-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ai-playlist-header {
    flex-direction: column;
  }

  .ai-playlist-cover {
    width: 100%;
    height: 120px;
  }
}

@media (max-width: 480px) {
  .playlists-grid {
    grid-template-columns: 1fr;
  }
}

.ai-generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 20px;
}

.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

.loading-text {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}
</style>