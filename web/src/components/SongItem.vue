<template>
  <div
      class="song-item"
      :class="{ 'playing': isPlaying }"
      @click="handleItemClick"
  >
    <!-- 序号/播放按钮 -->
    <div class="track-order">
      <div v-if="!isPlaying" class="order-number" @mouseenter="showPlayIcon = true" @mouseleave="showPlayIcon = false">
        <span v-if="!showPlayIcon">{{ trackOrder }}</span>
        <PlayIcon v-else class="play-icon" />
      </div>
      <div v-else class="playing-indicator">
        <PlayingIcon class="playing-icon" />
      </div>
    </div>

    <!-- 歌曲封面 -->
    <div class="song-cover">

      <div v-if="showPlayIcon" class="cover-overlay" @click.stop="handlePlayClick">
        <PlayIcon class="overlay-play-icon" />
      </div>
    </div>

    <!-- 歌曲信息 -->
    <div class="song-info">
      <div class="song-title">{{ song.title }}</div>
      <div class="song-singer">{{ song.singer }}</div>
    </div>

    <!-- 标签信息 -->
    <div class="song-labels">
      <span v-for="label in song.labels" :key="label" class="label-tag" :style="getLabelStyle(label)">
        {{ label }}
      </span>
    </div>

    <!-- 歌曲时长 -->
    <div class="song-duration">
      {{ formatDuration(song.duration) }}
    </div>

    <!-- 操作按钮 -->
    <div class="song-actions">
      <button
          class="action-btn like-btn"
          :class="{ 'liked': isLiked }"
          @click.stop="handleLike"
          :title="isLiked ? '取消喜欢' : '喜欢'"
      >
        <HeartIcon class="icon" :class="{ 'filled': isLiked }" />
      </button>
      <button
          class="action-btn star-btn"
          :class="{ 'starred': isStarred }"
          @click.stop="handleStar"
          :title="isStarred ? '取消收藏' : '收藏'"
      >
        <StarIcon class="icon" :class="{ 'filled': isStarred }" />
      </button>

      <!-- 添加到歌单下拉菜单 -->
      <div class="dropdown">
        <button
            class="action-btn add-btn"
            @click.stop="togglePlaylistDropdown"
            title="添加到歌单"
        >
          <AddIcon class="icon" />
        </button>

        <div v-if="showPlaylistDropdown" class="dropdown-menu">
          <div class="dropdown-header">添加到歌单</div>
          <div
              v-for="playlist in availablePlaylists"
              :key="playlist.id"
              class="dropdown-item"
              @click="addToPlaylist(playlist.id)"
          >
            {{ playlist.name }}
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item create-item" @click="showCreatePlaylistModal = true">
            <AddIcon class="icon-small" /> 新建歌单
          </div>
        </div>
      </div>

      <!-- 更多操作 -->
      <button
          class="action-btn more-btn"
          @click.stop="toggleMoreDropdown"
          title="更多操作"
      >
        <MoreIcon class="icon" />
      </button>

      <div v-if="showMoreDropdown" class="dropdown-menu more-menu">
        <div class="dropdown-item" @click="addToQueue">
          <QueueIcon class="icon-small" /> 添加到播放队列
        </div>
        <div class="dropdown-item" @click="playNext">
          <NextIcon class="icon-small" /> 下一首播放
        </div>
        <div class="dropdown-divider"></div>
        <div v-if="playlistId" class="dropdown-item remove-item" @click="removeFromPlaylist">
          <RemoveIcon class="icon-small" /> 从歌单移除
        </div>
      </div>
    </div>

    <!-- 新建歌单弹窗 -->
    <div v-if="showCreatePlaylistModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-content">
        <h3>新建歌单</h3>
        <input
            v-model="newPlaylistName"
            type="text"
            placeholder="输入歌单名称"
            class="playlist-input"
            @keyup.enter="confirmCreatePlaylist"
        />
        <textarea
            v-model="newPlaylistDescription"
            placeholder="歌单描述（可选）"
            class="playlist-textarea"
        ></textarea>
        <div class="modal-actions">
          <button @click="closeCreateModal" class="btn-cancel">取消</button>
          <button
              @click="confirmCreatePlaylist"
              class="btn-confirm"
              :disabled="!newPlaylistName.trim()"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

// 图标组件
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import PlayingIcon from '@/assets/icons/PlayingIcon.vue'
import HeartIcon from '@/assets/icons/HeartIcon.vue'
import StarIcon from '@/assets/icons/StarIcon.vue'
import AddIcon from '@/assets/icons/AddIcon.vue'
import MoreIcon from '@/assets/icons/MoreIcon.vue'
import QueueIcon from '@/assets/icons/QueueIcon.vue'
import NextIcon from '@/assets/icons/NextIcon.vue'
import RemoveIcon from '@/assets/icons/RemoveIcon.vue'

// Props
const props = defineProps({
  song: {
    type: Object,
    required: true
  },
  trackOrder: {
    type: Number,
    required: true
  },
  playlistId: {
    type: Number,
    default: null
  }
})

// 状态
const showPlayIcon = ref(false)
const showPlaylistDropdown = ref(false)
const showMoreDropdown = ref(false)
const showCreatePlaylistModal = ref(false)
const newPlaylistName = ref('')
const newPlaylistDescription = ref('')

// Store
const musicStore = useMusicStore()

// 计算属性
const isPlaying = computed(() => {
  return musicStore.currentSong?.id === props.song.id && musicStore.isPlaying
})

const isLiked = computed(() => musicStore.isLiked(props.song.id))
const isStarred = computed(() => musicStore.isStarred(props.song.id))

const availablePlaylists = computed(() => {
  return musicStore.allPlaylists.filter(playlist =>
      !playlist.items.some(item => item.musicId === props.song.id)
  )
})

// 方法
const handleItemClick = () => {
  musicStore.playSong(props.song)
}

const handlePlayClick = () => {
  emit('play', props.song)
  musicStore.playSong(props.song)
}

const handleLike = async () => {
  try {
    if (isLiked.value) {
      await musicStore.dislikeSong(props.song.id)
    } else {
      await musicStore.likeSong(props.song.id)
    }
  } catch (error) {
    console.error('喜欢操作失败:', error)
  }
}

const handleStar = async () => {
  try {
    await musicStore.starSong(props.song.id)
  } catch (error) {
    console.error('收藏操作失败:', error)
  }
}

const togglePlaylistDropdown = () => {
  showPlaylistDropdown.value = !showPlaylistDropdown.value
  showMoreDropdown.value = false
}

const toggleMoreDropdown = () => {
  showMoreDropdown.value = !showMoreDropdown.value
  showPlaylistDropdown.value = false
}

const addToPlaylist = async (playlistId) => {
  try {
    await musicStore.addToPlaylist(playlistId, props.song.id)
    showPlaylistDropdown.value = false
  } catch (error) {
    console.error('添加到歌单失败:', error)
  }
}

const removeFromPlaylist = async () => {
  if (!props.playlistId) return

  try {
    await musicStore.removeFromPlaylist(props.playlistId, props.song.id)
    showMoreDropdown.value = false
  } catch (error) {
    console.error('从歌单移除失败:', error)
  }
}

const addToQueue = () => {
  musicStore.addToQueue(props.song)
  showMoreDropdown.value = false
}

const playNext = () => {
  // 实现播放下一首的逻辑
  showMoreDropdown.value = false
}

const closeCreateModal = () => {
  showCreatePlaylistModal.value = false
  newPlaylistName.value = ''
  newPlaylistDescription.value = ''
}

const confirmCreatePlaylist = async () => {
  if (!newPlaylistName.value.trim()) return

  try {
    await musicStore.createNewPlaylist({
      name: newPlaylistName.value,
      description: newPlaylistDescription.value
    })
    closeCreateModal()
  } catch (error) {
    console.error('创建歌单失败:', error)
  }
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getLabelStyle = (label) => {
  const labelColors = {
    'Pop': '#e74c3c',
    'Rock': '#3498db',
    'Jazz': '#9b59b6',
    'Classical': '#e67e22',
    'HipHop': '#34495e'
  }
  return {
    backgroundColor: labelColors[label] || '#95a5a6'
  }
}

const handleImageError = (event) => {
  event.target.src = '/default-cover.jpg'
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown') && !event.target.closest('.action-btn')) {
    showPlaylistDropdown.value = false
    showMoreDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.song-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: var(--background-card);
  border: 1px solid var(--border-light);
  position: relative;
}

.song-item:hover {
  background-color: var(--background-secondary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-small);
}

.song-item.playing {
  background-color: color-mix(in srgb, var(--primary-color) 10%, transparent);
  border-color: var(--primary-color);
}

.track-order {
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.order-number {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
}

.play-icon, .playing-icon {
  width: 16px;
  height: 16px;
  color: var(--primary-color);
}

.song-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  margin-right: 16px;
  position: relative;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.song-cover:hover .cover-overlay {
  opacity: 1;
}

.overlay-play-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.song-info {
  flex: 1;
  min-width: 0;
  margin-right: 16px;
}

.song-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-singer {
  font-size: 14px;
  color: var(--text-secondary);
}

.song-labels {
  display: flex;
  gap: 8px;
  margin-right: 16px;
}

.label-tag {
  padding: 4px 8px;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.song-duration {
  color: var(--text-muted);
  font-size: 14px;
  margin-right: 16px;
  min-width: 50px;
}

.song-actions {
  display: flex;
  gap: 4px;
  position: relative;
}

.action-btn {
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--background-secondary);
}

.action-btn .icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.like-btn.liked .icon,
.star-btn.starred .icon {
  color: var(--primary-color);
}

/* 下拉菜单样式 */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--background-card);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-medium);
  z-index: 1000;
  min-width: 160px;
  margin-top: 4px;
}

.dropdown-header {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-light);
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-item:hover {
  background-color: var(--background-secondary);
}

.dropdown-item.remove-item {
  color: #e74c3c;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 0;
}

.icon-small {
  width: 14px;
  height: 14px;
}

/* 模态框样式 */
.modal-overlay {
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
}

.modal-content {
  background: var(--background-card);
  padding: 24px;
  border-radius: 12px;
  min-width: 400px;
  max-width: 90vw;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.playlist-input, .playlist-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  margin-bottom: 12px;
  background: var(--background-secondary);
  color: var(--text-primary);
}

.playlist-textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel, .btn-confirm {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: var(--background-secondary);
  color: var(--text-primary);
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .song-item {
    padding: 10px 12px;
  }

  .song-labels {
    display: none;
  }

  .song-duration {
    display: none;
  }

  .song-info {
    margin-right: 12px;
  }

  .modal-content {
    min-width: unset;
    width: 95vw;
    margin: 20px;
  }
}
</style>