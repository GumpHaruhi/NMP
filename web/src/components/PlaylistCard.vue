<template>
  <div class="playlist-card" @click="handleClick">
    <div class="playlist-cover">
      <div class="cover-image" :style="coverStyle">
        <div class="cover-placeholder">
          <MusicIcon class="placeholder-icon" />
        </div>
      </div>
      <div class="cover-overlay">
        <button class="play-btn" @click.stop="playPlaylist">
          <PlayIcon class="play-icon" />
        </button>
        <div class="play-count" v-if="playlist.playCount">
          <PlayCountIcon class="count-icon" />
          {{ formatPlayCount(playlist.playCount) }}
        </div>
      </div>
    </div>

    <div class="playlist-info">
      <h3 class="playlist-title">{{ playlist.name }}</h3>
      <p class="playlist-description" v-if="playlist.description">
        {{ playlist.description }}
      </p>
      <div class="playlist-meta">
        <span class="song-count">{{ playlist.items ? playlist.items.length : 0 }} 首歌曲</span>
        <span class="created-date">{{ formatDate(playlist.createdAt) }}</span>
      </div>
    </div>

    <div class="playlist-actions" v-if="showActions">
      <button class="action-btn" @click.stop="$emit('edit')" title="编辑">
        <EditIcon class="action-icon" />
      </button>
      <button class="action-btn danger" @click.stop="$emit('delete')" title="删除">
        <DeleteIcon class="action-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import { useRouter } from 'vue-router'

// 图标组件
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import MusicIcon from '@/assets/icons/MusicIcon.vue'
import PlayCountIcon from '@/assets/icons/PlayCountIcon.vue'
import EditIcon from '@/assets/icons/EditIcon.vue'
import DeleteIcon from '@/assets/icons/DeleteIcon.vue'

const props = defineProps({
  playlist: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'edit', 'delete'])

const musicStore = useMusicStore()
const router = useRouter()

const coverStyle = computed(() => {
  if (props.playlist.coverUrl) {
    return {
      backgroundImage: `url(${props.playlist.coverUrl})`
    }
  }
  return {}
})

const playPlaylist = () => {
  if (props.playlist.items && props.playlist.items.length > 0) {
    const songs = props.playlist.items.map(item => item.music)
    musicStore.playSong(songs[0], songs)
  }
}

const handleClick = () => {
  emit('click')
  router.push(`/playlist/${props.playlist.id}`)
}

const formatPlayCount = (count) => {
  if (count >= 10000) {
    return Math.floor(count / 10000) + '万'
  } else if (count >= 1000) {
    return Math.floor(count / 1000) + '千'
  }
  return count
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.playlist-card {
  background: var(--background-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.playlist-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.playlist-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.cover-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  color: white;
  opacity: 0.8;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.playlist-card:hover .cover-overlay {
  opacity: 1;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-btn:hover {
  transform: scale(1.1);
  background: var(--primary-hover);
}

.play-icon {
  width: 20px;
  height: 20px;
  color: white;
  margin-left: 2px;
}

.play-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 12px;
}

.count-icon {
  width: 12px;
  height: 12px;
}

.playlist-info {
  flex: 1;
  min-height: 80px;
}

.playlist-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.playlist-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.playlist-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
}

.song-count, .created-date {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.playlist-card:hover .playlist-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.action-btn.danger:hover {
  background: #e74c3c;
  color: white;
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .playlist-card {
    padding: 12px;
  }

  .playlist-title {
    font-size: 15px;
  }

  .playlist-description {
    font-size: 13px;
  }

  .playlist-meta {
    font-size: 11px;
  }

  .play-btn {
    width: 40px;
    height: 40px;
  }

  .play-icon {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 480px) {
  .playlist-card {
    padding: 10px;
  }

  .playlist-actions {
    opacity: 1;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 6px;
    padding: 4px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    background: transparent;
  }

  .action-icon {
    width: 14px;
    height: 14px;
  }
}
</style>