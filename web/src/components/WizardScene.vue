<template>
  <div class="wizard-scene">
    <!-- 背景装饰 -->
    <div class="scene-background"></div>

    <!-- 场景内容 -->
    <div class="scene-content">
      <!-- 左侧音乐类型袋子 -->
      <div class="genre-bags">
        <div
            v-for="(genre, index) in musicGenres"
            :key="genre.id"
            class="bag"
            :class="{ 'bag-selected': selectedGenres.includes(genre.id) }"
            @click="selectGenre(genre)"
            :data-index="index"
        >
          <img :src="bagImage" alt="袋子" class="bag-img" />
          <div class="bag-content">
            <div class="bag-icon">{{ genre.icon }}</div>
            <div class="bag-name">{{ genre.name }}</div>
          </div>
        </div>
      </div>

      <!-- 中间魔法师区域 -->
      <div class="wizard-center">
        <!-- 桌子 -->
        <img :src="tableImage" alt="桌子" class="table-img" />

        <!-- 坩埚 -->
        <div class="cauldron-container">
          <img :src="cauldronImage" alt="坩埚" class="cauldron-img" />
          <!-- 坩埚气泡效果 -->
          <div class="cauldron-bubbles">
            <div class="bubble"></div>
            <div class="bubble"></div>
            <div class="bubble"></div>
            <div class="bubble"></div>
          </div>

          <!-- 坩埚上方标签 -->
          <div class="cauldron-tags">
            <transition-group name="flying-tag">
              <div
                  v-for="tag in cauldronTags"
                  :key="tag.id"
                  class="flying-tag"
                  :style="tag.style"
              >
                {{ tag.name }}
              </div>
            </transition-group>
          </div>
        </div>

        <!-- 魔法师 -->
        <div class="wizard-container">
          <img :src="wizardImage" alt="魔法师" class="wizard-img" />
          <!-- 对话按钮 -->
          <button class="talk-btn" @click="$emit('open-chat')">
            💬 对话
          </button>
        </div>

        <!-- 坩埚内容显示 -->
        <div class="cauldron-content" v-if="selectedItems.length > 0">
          <div class="selected-items">
            已选择：
            <span v-for="item in selectedItems" :key="item.id" class="selected-item">
              {{ item.name }}
            </span>
          </div>
        </div>

        <!-- 开始调和按钮 -->
        <button
            v-if="selectedItems.length > 0"
            class="mix-btn"
            @click="startMix"
            :disabled="mixing"
        >
          <div class="mix-sparkle">✨</div>
          <span>{{ mixing ? '调和中...' : '开始调和' }}</span>
        </button>
      </div>

      <!-- 右侧标签袋子 -->
      <div class="tag-bags">
        <div
            v-for="(tag, index) in filterTags"
            :key="tag.id"
            class="bag"
            :class="{ 'bag-selected': selectedTags.includes(tag.id) }"
            @click="selectTag(tag)"
            :data-index="index"
        >
          <img :src="bagImage" alt="袋子" class="bag-img" />
          <div class="bag-content">
            <div class="bag-name">{{ tag.name }}</div>
          </div>
        </div>
      </div>

      <!-- AI生成的歌单 -->
      <div v-if="aiGeneratedPlaylist" class="generated-playlist">
        <div class="playlist-bubble">
          <div class="playlist-header">
            <h3>🎵 魔法歌单</h3>
            <div class="playlist-actions">
              <button @click="$emit('play-ai-playlist', aiGeneratedPlaylist)">
                ▶️ 播放
              </button>
              <button @click="$emit('save-ai-playlist')">
                💾 保存
              </button>
            </div>
          </div>
          <div class="playlist-content">
            <div class="playlist-cover">
              <div class="cover-gradient" :style="getPlaylistGradient()"></div>
              <div class="cover-title">{{ aiGeneratedPlaylist.name }}</div>
            </div>
            <div class="playlist-info">
              <p>{{ aiGeneratedPlaylist.description }}</p>
              <div class="playlist-stats">
                <span>{{ aiGeneratedPlaylist.songCount }} 首歌曲</span>
                <span>{{ formatDuration(aiGeneratedPlaylist.duration) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载动画 -->
    <div v-if="mixing" class="mixing-animation">
      <div class="magic-sparkles">
        <!-- 魔法粒子 - 环形旋转效果 -->
        <div class="sparkle-spin s1"></div>
        <div class="sparkle-spin s2"></div>
        <div class="sparkle-spin s3"></div>
        <div class="sparkle-spin s4"></div>
        <div class="sparkle-spin s5"></div>
        <div class="sparkle-spin s6"></div>
        <div class="sparkle-spin s7"></div>
        <div class="sparkle-spin s8"></div>
      </div>
      <div class="mixing-text">魔法师正在调和你的歌单...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 导入图片
import wizardImage from '@/assets/images/wizard.png'
import cauldronImage from '@/assets/images/cauldron.png'
import tableImage from '@/assets/images/table.png'
import bagImage from '@/assets/images/bag.png'

const props = defineProps({
  selectedGenres: {
    type: Array,
    default: () => []
  },
  selectedTags: {
    type: Array,
    default: () => []
  },
  aiGeneratedPlaylist: {
    type: Object,
    default: null
  },
  mixing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'toggle-genre',
  'toggle-tag',
  'generate',
  'open-chat',
  'play-ai-playlist',
  'save-ai-playlist'
])

// 响应式数据
const cauldronTags = ref([])
const musicGenres = ref([
  { id: 'pop', name: '流行', icon: '🎤' },
  { id: 'rock', name: '摇滚', icon: '🎸' },
  { id: 'jazz', name: '爵士', icon: '🎷' },
  { id: 'classical', name: '古典', icon: '🎻' },
  { id: 'hiphop', name: '嘻哈', icon: '🎧' },
  { id: 'electronic', name: '电子', icon: '⚡' },
  { id: 'r&b', name: 'R&B', icon: '🎹' }
])

const filterTags = ref([
  { id: 'chill', name: '放松' },
  { id: 'energy', name: '能量' },
  { id: 'work', name: '工作' },
  { id: 'workout', name: '健身' },
  { id: 'study', name: '学习' },
  { id: 'sleep', name: '睡眠' },
  { id: 'party', name: '派对' },
  { id: 'romantic', name: '浪漫' },
  { id: 'nostalgic', name: '怀旧' },
  { id: 'focus', name: '专注' },
  { id: 'travel', name: '旅行' },
  { id: 'morning', name: '清晨' }
])

// 计算属性
const selectedItems = computed(() => {
  const genres = musicGenres.value.filter(g => props.selectedGenres.includes(g.id))
  const tags = filterTags.value.filter(t => props.selectedTags.includes(t.id))
  return [...genres, ...tags]
})

// 选择音乐类型
const selectGenre = (genre) => {
  emit('toggle-genre', genre.id)
  flyToCauldron(genre)
}

// 选择标签
const selectTag = (tag) => {
  emit('toggle-tag', tag.id)
  flyToCauldron(tag)
}

// 标签飞到坩埚的动画
const flyToCauldron = (item) => {
  const tag = {
    id: Date.now() + Math.random(),
    name: item.name,
    style: {
      left: Math.random() * 100 + 'px',
      animationDelay: Math.random() * 0.5 + 's'
    }
  }
  cauldronTags.value.push(tag)

  // 3秒后移除标签
  setTimeout(() => {
    const index = cauldronTags.value.findIndex(t => t.id === tag.id)
    if (index !== -1) {
      cauldronTags.value.splice(index, 1)
    }
  }, 3000)
}

// 开始调和
const startMix = () => {
  emit('generate')
}

// 生成播放列表渐变背景
const getPlaylistGradient = () => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ]
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)]
  return { background: randomGradient }
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.wizard-scene {
  position: relative;
  min-height: 600px;
  width: 100%;
  padding: 40px 20px;
  overflow: hidden;
}

/* 背景 - 改为深紫色/深蓝色魔法主题 */
.scene-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
      radial-gradient(circle at 20% 30%, rgba(63, 94, 251, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(252, 70, 107, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 40% 80%, rgba(131, 58, 180, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 60% 20%, rgba(253, 29, 29, 0.1) 0%, transparent 40%),
      linear-gradient(135deg,
      rgba(12, 20, 69, 0.9) 0%,
      rgba(28, 37, 95, 0.9) 25%,
      rgba(45, 52, 120, 0.9) 50%,
      rgba(28, 37, 95, 0.9) 75%,
      rgba(12, 20, 69, 0.9) 100%
      );
  z-index: 1;
}

/* 添加星空效果 */
.scene-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
      radial-gradient(1px 1px at 10% 20%, rgba(255, 255, 255, 0.8) 1px, transparent 0),
      radial-gradient(1px 1px at 30% 40%, rgba(255, 255, 255, 0.8) 1px, transparent 0),
      radial-gradient(1px 1px at 50% 60%, rgba(255, 255, 255, 0.8) 1px, transparent 0),
      radial-gradient(1px 1px at 70% 80%, rgba(255, 255, 255, 0.8) 1px, transparent 0),
      radial-gradient(2px 2px at 90% 10%, rgba(255, 255, 255, 0.9) 1px, transparent 0),
      radial-gradient(2px 2px at 15% 90%, rgba(255, 255, 255, 0.9) 1px, transparent 0);
  background-size: 300px 300px;
  animation: twinkle 3s infinite alternate;
  z-index: 1;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* 主内容区域 - 简化布局 */
.scene-content {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 500px;
  z-index: 2;
}

/* 左侧音乐类型袋子区域 */
.genre-bags {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-self: center;
  margin-left: 20px;
}

/* 右侧标签袋子区域 */
.tag-bags {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-self: center;
  margin-right: 20px;
}

/* 袋子样式 */
.bag {
  position: relative;
  width: 150px;
  height: 150px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: bagFloat 3s ease-in-out infinite;
}

/* 为每个袋子设置不同的动画延迟 */
.bag[data-index="0"] { animation-delay: 0s; }
.bag[data-index="1"] { animation-delay: 0.2s; }
.bag[data-index="2"] { animation-delay: 0.4s; }
.bag[data-index="3"] { animation-delay: 0.6s; }
.bag[data-index="4"] { animation-delay: 0.8s; }
.bag[data-index="5"] { animation-delay: 1.0s; }
.bag[data-index="6"] { animation-delay: 1.2s; }
.bag[data-index="7"] { animation-delay: 1.4s; }
.bag[data-index="8"] { animation-delay: 1.6s; }
.bag[data-index="9"] { animation-delay: 1.8s; }
.bag[data-index="10"] { animation-delay: 2.0s; }
.bag[data-index="11"] { animation-delay: 2.2s; }

.bag:hover {
  transform: translateY(-10px) scale(1.1);
}

.bag-selected {
  animation: bagSelected 2s infinite alternate;
}

.bag-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 15px rgba(0, 0, 0, 0.3));
}

@keyframes bagFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes bagSelected {
  0% {
    filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.5));
  }
  100% {
    filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.8));
  }
}

.bag-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.bag-icon {
  font-size: 28px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
}

.bag-name {
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  padding: 5px 10px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 中间魔法师区域 */
.wizard-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  height: 500px;
  margin-top: 20px;
}

/* 桌子 */
.table-img {
  position: absolute;
  bottom: 0;
  width: 450px;
  height: auto;
  z-index: 10;
  filter: drop-shadow(0 12px 25px rgba(0, 0, 0, 0.4));
}

/* 坩埚容器 */
.cauldron-container {
  position: absolute;
  bottom: 130px;
  z-index: 20;
  width: 160px;
  height: 160px;
}

.cauldron-img {
  width: 160px;
  height: auto;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.5));
  animation: cauldronFloat 4s ease-in-out infinite;
}

@keyframes cauldronFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.cauldron-bubbles {
  position: absolute;
  top: -25px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  z-index: 21;
}

.bubble {
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 50%;
  opacity: 0.8;
  animation: bubbleFloat 2s infinite ease-in-out;
}

.bubble:nth-child(1) { animation-delay: 0s; }
.bubble:nth-child(2) { animation-delay: 0.5s; width: 14px; height: 14px; }
.bubble:nth-child(3) { animation-delay: 1s; width: 10px; height: 10px; }
.bubble:nth-child(4) { animation-delay: 1.5s; width: 12px; height: 12px; }

@keyframes bubbleFloat {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-20px);
    opacity: 1;
  }
}

/* 坩埚上方标签 */
.cauldron-tags {
  position: absolute;
  top: -70px;
  left: 0;
  width: 100%;
  height: 70px;
  pointer-events: none;
  z-index: 100;
}

.flying-tag {
  position: absolute;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  border-radius: 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  animation: flyToCauldron 3s forwards;
  z-index: 100;
  border: 2px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(5px);
}

@keyframes flyToCauldron {
  0% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
  }
  30% {
    transform: translateY(-50px) scale(1.1) rotate(5deg);
    opacity: 0.9;
  }
  60% {
    transform: translateY(-100px) scale(0.9) rotate(-5deg);
    opacity: 0.7;
  }
  100% {
    transform: translateY(-150px) scale(0.7) rotate(0deg);
    opacity: 0;
  }
}

/* 魔法师容器 */
.wizard-container {
  position: absolute;
  bottom: 220px;
  right: 80px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wizard-img {
  width: 180px;
  height: auto;
  filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.5));
  animation: wizardBreath 3s ease-in-out infinite;
}

@keyframes wizardBreath {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.talk-btn {
  margin-top: 12px;
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  display: flex;
  align-items: center;
  gap: 6px;
}

.talk-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.7);
}

/* 坩埚内容显示 */
.cauldron-content {
  position: absolute;
  top: 40px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 20px;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  min-width: 250px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.4);
  z-index: 40;
  animation: contentFloat 3s ease-in-out infinite;
}

@keyframes contentFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.selected-items {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.selected-item {
  display: inline-block;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 4px 10px;
  margin: 4px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
  animation: itemPulse 2s infinite;
}

@keyframes itemPulse {
  0%, 100% {
    box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 3px 15px rgba(102, 126, 234, 0.7);
  }
}

/* 调和按钮 */
.mix-btn {
  position: absolute;
  bottom: 320px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 15px 40px rgba(245, 87, 108, 0.6);
  backdrop-filter: blur(5px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  z-index: 50;
}

.mix-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 20px 50px rgba(245, 87, 108, 0.8);
}

.mix-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.mix-sparkle {
  animation: sparkle 2s infinite;
  font-size: 20px;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* 生成的歌单 */
.generated-playlist {
  position: absolute;
  top: 30px;
  right: 20px;
  width: 320px;
  animation: floatPlaylist 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 60;
}

@keyframes floatPlaylist {
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.playlist-bubble {
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.playlist-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.playlist-actions {
  display: flex;
  gap: 10px;
}

.playlist-actions button {
  padding: 8px 15px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.playlist-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
}

.playlist-content {
  display: flex;
  gap: 15px;
}

.playlist-cover {
  width: 90px;
  height: 90px;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.cover-gradient {
  width: 100%;
  height: 100%;
}

.cover-title {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  padding: 10px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  line-height: 1.4;
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-info p {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.playlist-stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

/* 调和动画 */
.mixing-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

/* 魔法粒子 - 环形旋转效果 */
.magic-sparkles {
  position: relative;
  width: 250px;
  height: 250px;
}

.sparkle-spin {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  opacity: 0;
  transform-origin: 0 100px;
  animation: sparkleOrbit 2.5s infinite ease-in-out;
}

/* 设置不同粒子的属性和延迟 */
.s1 {
  background: #FF6B6B;
  animation-delay: 0s;
  box-shadow: 0 0 12px #FF6B6B;
}

.s2 {
  background: #4ECDC4;
  animation-delay: 0.3s;
  box-shadow: 0 0 12px #4ECDC4;
}

.s3 {
  background: #FFD166;
  animation-delay: 0.6s;
  box-shadow: 0 0 12px #FFD166;
}

.s4 {
  background: #06D6A0;
  animation-delay: 0.9s;
  box-shadow: 0 0 12px #06D6A0;
}

.s5 {
  background: #118AB2;
  animation-delay: 1.2s;
  box-shadow: 0 0 12px #118AB2;
}

.s6 {
  background: #EF476F;
  animation-delay: 1.5s;
  box-shadow: 0 0 12px #EF476F;
}

.s7 {
  background: #8338EC;
  animation-delay: 1.8s;
  box-shadow: 0 0 12px #8338EC;
}

.s8 {
  background: #FF006E;
  animation-delay: 2.1s;
  box-shadow: 0 0 12px #FF006E;
}

@keyframes sparkleOrbit {
  0% {
    transform: rotate(0deg) translateY(0) scale(0.5);
    opacity: 0;
  }
  25% {
    opacity: 1;
    filter: blur(0px);
  }
  50% {
    transform: rotate(180deg) translateY(100px) scale(1.5);
    opacity: 0.9;
    filter: blur(1px);
  }
  75% {
    opacity: 0.5;
    filter: blur(0px);
  }
  100% {
    transform: rotate(360deg) translateY(0) scale(0.5);
    opacity: 0;
  }
}

/* 添加中心魔法光效 */
.magic-sparkles::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: radial-gradient(circle,
  rgba(102, 126, 234, 0.9) 0%,
  rgba(118, 75, 162, 0.6) 50%,
  transparent 70%
  );
  border-radius: 50%;
  animation: centerPulse 2s infinite alternate;
  filter: blur(6px);
}

@keyframes centerPulse {
  0% {
    width: 35px;
    height: 35px;
    opacity: 0.6;
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 1;
  }
}

.mixing-text {
  margin-top: 30px;
  color: white;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
  animation: mixingText 2s infinite alternate;
  background: linear-gradient(90deg, #f093fb, #f5576c, #4ECDC4, #06D6A0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  background-size: 300% 100%;
  animation: mixingText 2s infinite alternate, gradientMove 3s infinite alternate;
}

@keyframes mixingText {
  0% {
    opacity: 0.7;
    letter-spacing: 0px;
  }
  100% {
    opacity: 1;
    letter-spacing: 2px;
  }
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .scene-content {
    max-width: 1200px;
  }

  .bag {
    width: 140px;
    height: 140px;
  }

  .table-img {
    width: 400px;
  }

  .wizard-img {
    width: 160px;
  }

  .cauldron-img {
    width: 140px;
  }

  .wizard-container {
    bottom: 200px;
    right: 60px;
  }
}

@media (max-width: 992px) {
  .scene-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 30px;
  }

  .genre-bags, .tag-bags {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    margin: 0;
    gap: 15px;
  }

  .bag {
    width: 120px;
    height: 120px;
  }

  .bag-name {
    font-size: 14px;
  }

  .bag-icon {
    font-size: 24px;
  }

  .wizard-center {
    order: 0;
    height: 450px;
  }

  .table-img {
    width: 350px;
  }

  .wizard-img {
    width: 140px;
  }

  .wizard-container {
    right: 40px;
    bottom: 180px;
  }

  .cauldron-img {
    width: 120px;
  }

  .generated-playlist {
    position: static;
    margin: 30px auto 0;
    width: 300px;
  }
}

@media (max-width: 768px) {
  .wizard-scene {
    padding: 20px 10px;
  }

  .bag {
    width: 100px;
    height: 100px;
  }

  .bag-icon {
    font-size: 20px;
  }

  .bag-name {
    font-size: 12px;
    padding: 4px 8px;
  }

  .table-img {
    width: 300px;
  }

  .wizard-img {
    width: 120px;
  }

  .wizard-container {
    right: 20px;
    bottom: 160px;
  }

  .cauldron-img {
    width: 100px;
  }

  .mix-btn {
    bottom: 280px;
    padding: 12px 25px;
    font-size: 14px;
  }

  .generated-playlist {
    width: 280px;
  }

  .playlist-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }
}
</style>
