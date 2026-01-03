<template>
  <div class="playlist-modal" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>播放列表 ({{ songs.length }})</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="playlist-items" v-if="songs.length > 0">
        <div
            v-for="(song, index) in songs"
            :key="song.id"
            class="playlist-item"
            :class="{ active: index === currentIndex }"
            @click="$emit('play-song', song, index)"
        >
          <div class="item-cover">
            <div class="cover-image" :style="{ backgroundImage: `url(${song.coverUrl})` }">
              <div v-if="!song.coverUrl" class="cover-placeholder">
                <MusicIcon class="placeholder-icon" />
              </div>
            </div>
          </div>
          <div class="item-info">
            <div class="item-title">{{ song.title }}</div>
            <div class="item-artist">{{ song.singer }}</div>
          </div>
          <div class="item-duration">{{ formatTime(song.duration) }}</div>
          <button
              class="remove-btn"
              @click.stop="$emit('remove-song', index)"
              title="从队列移除"
          >
            ×
          </button>
        </div>
      </div>

      <div v-else class="empty-playlist">
        <div class="empty-icon">🎵</div>
        <p>播放队列为空</p>
      </div>

      <div class="modal-footer" v-if="songs.length > 0">
        <button
            class="clear-btn"
            @click="handleClearQueue"
        >
          清空队列
        </button>
        <button class="close-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import MusicIcon from '@/assets/icons/MusicIcon.vue'

const props = defineProps({
  songs: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: -1
  }
})

const emit = defineEmits(['close', 'play-song', 'remove-song', 'clear-queue'])

const formatTime = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleClearQueue = () => {
  if (confirm('确定要清空播放队列吗？')) {
    emit('clear-queue')
  }
}
</script>

<style scoped>
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
  backdrop-filter: blur(5px);
}

.modal-content {
  background: var(--background-card, #ffffff);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-light, #e0e0e0);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary, #333);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted, #666);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: var(--background-secondary, #f8f9fa);
}

.playlist-items {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
  margin-bottom: 5px;
}

.playlist-item:hover {
  background: var(--background-secondary, #f8f9fa);
}

.playlist-item.active {
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.item-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  flex-shrink: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  border-radius: 6px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: var(--background-secondary, #f8f9fa);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 20px;
  height: 20px;
  color: var(--text-muted, #999);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 600;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  font-size: 12px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-duration {
  font-size: 12px;
  color: var(--text-muted, #999);
  margin: 0 12px;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted, #999);
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.3s ease;
}

.playlist-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: #ff4757;
  color: white;
}

.empty-playlist {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted, #999);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light, #e0e0e0);
}

.clear-btn, .close-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn {
  background: var(--background-secondary, #f8f9fa);
  color: var(--text-primary, #333);
}

.close-btn {
  background: var(--primary-color, #007bff);
  color: white;
}
</style>