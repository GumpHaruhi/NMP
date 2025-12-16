<template>
  <div class="left-sidebar">
    <div class="section-header">
      <h2>🎵 音乐类型</h2>
    </div>

    <div class="genre-bubbles">
      <div
        v-for="genre in musicGenres"
        :key="genre.id"
        class="genre-bubble"
        :class="{ active: selectedGenres.includes(genre.id) }"
        @click="toggleGenre(genre.id)"
        :style="getBubbleStyle(genre)"
      >
        <div class="bubble-content">
          <div class="bubble-icon">{{ genre.icon }}</div>
          <span class="bubble-name">{{ genre.name }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选标签云 -->
    <div class="filter-section">
      <h3>🎯 场景/心情</h3>
      <div class="tag-cloud">
        <div
          v-for="tag in filterTags"
          :key="tag.id"
          class="tag-cloud-item"
          :class="{ active: selectedTags.includes(tag.id) }"
          @click="toggleTag(tag.id)"
          :style="getTagCloudStyle(tag)"
        >
          {{ tag.name }}
        </div>
      </div>
    </div>

    <!-- 推荐按钮 -->
    <div class="action-buttons">
      <button
        class="action-btn generate-btn"
        @click="generateContent"
        :disabled="!hasSelection"
      >
        <div class="btn-sparkle">✨</div>
        <span>{{ getButtonText() }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

const musicStore = useMusicStore()

// 响应式数据
const selectedGenres = ref([])
const selectedTags = ref([])
const musicGenres = ref([
  { id: 'pop', name: '流行', icon: '🎤', count: 0 },
  { id: 'rock', name: '摇滚', icon: '🎸', count: 0 },
  { id: 'jazz', name: '爵士', icon: '🎷', count: 0 },
  { id: 'classical', name: '古典', icon: '🎻', count: 0 },
  { id: 'hiphop', name: '嘻哈', icon: '🎧', count: 0 },
  { id: 'electronic', name: '电子', icon: '⚡', count: 0 },
  { id: 'r&b', name: 'R&B', icon: '🎹', count: 0 }
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

const allSongs = computed(() => musicStore.allMusics || [])

const hasSelection = computed(() => {
  return selectedGenres.value.length > 0 || selectedTags.value.length > 0
})

// 泡泡样式生成
const getBubbleStyle = (genre) => {
  const hue = {
    pop: 330,
    rock: 10,
    jazz: 200,
    classical: 280,
    hiphop: 150,
    electronic: 60,
    'r&b': 240
  }[genre.id] || 180

  const scale = selectedGenres.value.includes(genre.id) ? 1.1 : 1
  const shadow = selectedGenres.value.includes(genre.id)
    ? `0 10px 30px hsla(${hue}, 70%, 50%, 0.4)`
    : `0 4px 15px hsla(${hue}, 40%, 50%, 0.2)`

  return {
    '--hue': hue,
    transform: `scale(${scale})`,
    boxShadow: shadow
  }
}

// 标签云样式
const getTagCloudStyle = (tag) => {
  const sizes = ['12px', '14px', '16px', '18px', '20px']
  const randomSize = sizes[Math.floor(Math.random() * sizes.length)]

  const colors = [
    'var(--primary-color)',
    'var(--accent-color)',
    'var(--text-secondary)',
    '#6B7280',
    '#9CA3AF'
  ]
  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  return {
    fontSize: randomSize,
    color: selectedTags.value.includes(tag.id) ? 'white' : randomColor,
    backgroundColor: selectedTags.value.includes(tag.id) ? 'var(--primary-color)' : 'transparent'
  }
}

// 按钮文本
const getButtonText = () => {
  if (selectedGenres.value.length > 0 && selectedTags.value.length > 0) {
    return '生成专属歌单'
  } else if (selectedGenres.value.length > 0) {
    return '推荐歌曲'
  } else if (selectedTags.value.length > 0) {
    return '场景推荐'
  } else {
    return '随机推荐'
  }
}

// 切换音乐类型
const toggleGenre = (genreId) => {
  const index = selectedGenres.value.indexOf(genreId)
  if (index === -1) {
    selectedGenres.value.push(genreId)
  } else {
    selectedGenres.value.splice(index, 1)
  }
  updateGenreCounts()
  emit('toggle-genre', genreId)
}

// 切换标签
const toggleTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
  emit('toggle-tag', tagId) 
}

// 更新类型计数
const updateGenreCounts = () => {
  musicGenres.value.forEach(genre => {
    genre.count = allSongs.value.filter(song =>
      song.labels?.some(label => {
        const labelStr = label.toString().toLowerCase()
        return labelStr.includes(genre.id.toLowerCase())
      })
    ).length || 0
  })
}

// 暴露给父组件的事件
const emit = defineEmits(['generate', 'toggleGenre', 'toggleTag'])

// 生成内容
const generateContent = () => {
  emit('generate', {
    genres: selectedGenres.value,
    tags: selectedTags.value
  })
}

// 监听 allSongs 变化更新计数
watch(allSongs, updateGenreCounts, { immediate: true })
</script>

<style scoped>
.left-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.genre-bubbles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 24px 0;
}

.genre-bubble {
  aspect-ratio: 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  position: relative;
  overflow: hidden;
}

.genre-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
  rgba(255, 255, 255, 0.3) 0%,
  rgba(255, 255, 255, 0.1) 100%);
  border-radius: 50%;
}

.genre-bubble:hover {
  transform: scale(1.05) translateY(-5px);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
}

.genre-bubble.active {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 20px 50px rgba(102, 126, 234, 0.4);
}

.genre-bubble.active::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--primary-color);
}

.bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
}

.bubble-icon {
  font-size: 25px;
}

.bubble-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.bubble-count {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
}

/* 标签云 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.tag-cloud-item {
  padding: 6px 12px;
  border-radius: 16px;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: var(--text-secondary);
}

.tag-cloud-item:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tag-cloud-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 生成按钮 */
.action-buttons {
  margin-top: 32px;
}

.action-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
  transparent,
  rgba(255, 255, 255, 0.2),
  transparent);
  transition: left 0.5s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(var(--primary-rgb), 0.4);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sparkle {
  font-size: 20px;
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

@media (max-width: 768px) {
  .genre-bubbles {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>