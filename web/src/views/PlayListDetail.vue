<template>
  <div class="playlist-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载歌单中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">❌</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="retryLoading" class="retry-btn">重试</button>
    </div>

    <!-- 歌单内容 -->
    <div v-else-if="playlist" class="playlist-content">
      <!-- 歌单头部信息 -->
      <div class="playlist-header">
        <div class="cover-section">
          <div class="cover-image" :style="coverStyle">
            <div v-if="!playlist.coverUrl" class="cover-placeholder">
              <MusicIcon class="placeholder-icon" />
            </div>
          </div>
          <div class="cover-overlay">
            <button class="play-all-btn" @click="playAllSongs">
              <PlayIcon class="play-icon" />
              播放全部
            </button>
          </div>
        </div>

        <div class="info-section">
          <div class="playlist-title">{{ playlist.name }}</div>
          <div class="playlist-description" v-if="playlist.description">
            {{ playlist.description }}
          </div>
          <div class="playlist-meta">
            <span class="meta-item">
              <UserIcon class="meta-icon" />
              {{ userInfo?.username || '用户' }}
            </span>
            <span class="meta-item">
              <CalendarIcon class="meta-icon" />
              {{ formatDate(playlist.createdAt) }}
            </span>
            <span class="meta-item">
              <MusicIcon class="meta-icon" />
              {{ playlist.items?.length || 0 }} 首歌曲
            </span>
            <span class="meta-item">
              <PlayCountIcon class="meta-icon" />
              {{ playlist.playCount || 0 }} 次播放
            </span>
          </div>

          <div class="action-buttons">
            <button class="action-btn primary" @click="playAllSongs">
              <PlayIcon class="btn-icon" />
              播放全部
            </button>
            <button class="action-btn" @click="shufflePlay">
              <ShuffleIcon class="btn-icon" />
              随机播放
            </button>
            <button v-if="isOwnPlaylist" class="action-btn" @click="editPlaylist">
              <EditIcon class="btn-icon" />
              编辑
            </button>
            <button v-if="isOwnPlaylist" class="action-btn danger" @click="deletePlaylist">
              <DeleteIcon class="btn-icon" />
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- 歌曲列表 -->
      <div class="songs-section">
        <div class="section-header">
          <h3>歌曲列表</h3>
          <div class="header-actions">
            <div class="search-box">
              <SearchIcon class="search-icon" />
              <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索歌曲..."
                  class="search-input"
              />
            </div>
            <button class="sort-btn" @click="toggleSortMenu">
              <SortIcon class="sort-icon" />
              排序
              <ArrowDownIcon class="arrow-icon" />
            </button>

            <div v-if="showSortMenu" class="sort-menu">
              <div
                  v-for="option in sortOptions"
                  :key="option.value"
                  class="sort-option"
                  :class="{ active: sortBy === option.value }"
                  @click="handleSort(option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>

        <!-- 歌曲列表头部 -->
        <div class="songs-header">
          <div class="header-order">#</div>
          <div class="header-title">歌曲标题</div>
          <div class="header-singer">歌手</div>
          <div class="header-album">专辑</div>
          <div class="header-duration">时长</div>
          <div class="header-actions">操作</div>
        </div>

        <!-- 歌曲列表 -->
        <div v-if="filteredSongs.length > 0" class="songs-list">
          <SongItem
              v-for="(item, index) in filteredSongs"
              :key="item.musicId"
              :song="item.music"
              :track-order="index + 1"
              :playlist-id="playlistId"
              @play="handleSongPlay"
              @like="handleSongLike"
              @star="handleSongStar"
          />
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">🎵</div>
          <h4 v-if="searchQuery">没有找到相关歌曲</h4>
          <h4 v-else>歌单是空的</h4>
          <p v-if="!searchQuery && isOwnPlaylist" class="empty-tip">
            点击下方按钮添加歌曲到歌单
          </p>
          <button v-if="!searchQuery && isOwnPlaylist" class="add-songs-btn" @click="showAddSongsModal = true">
            <AddIcon class="add-icon" />
            添加歌曲
          </button>
        </div>
      </div>
    </div>

    <!-- 添加歌曲模态框 -->
    <div v-if="showAddSongsModal" class="modal-overlay" @click.self="closeAddSongsModal">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>添加歌曲到歌单</h3>
          <button class="close-btn" @click="closeAddSongsModal">×</button>
        </div>

        <div class="modal-body">
          <div class="songs-grid">
            <div
                v-for="song in availableSongs"
                :key="song.id"
                class="song-card"
                :class="{ selected: selectedSongs.has(song.id) }"
                @click="toggleSongSelection(song.id)"
            >
              <div class="song-card-cover" :style="{ backgroundImage: `url(${song.coverUrl})` }">
                <div v-if="!song.coverUrl" class="card-cover-placeholder">
                  <MusicIcon class="card-icon" />
                </div>
                <div class="card-overlay">
                  <PlayIcon class="card-play-icon" />
                </div>
              </div>
              <div class="song-card-info">
                <div class="card-title">{{ song.title }}</div>
                <div class="card-singer">{{ song.singer }}</div>
                <div class="card-labels">
                  <span v-for="label in song.labels" :key="label" class="card-label">
                    {{ label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="selection-info">
            已选择 {{ selectedSongs.size }} 首歌曲
          </div>
          <div class="modal-actions">
            <button @click="closeAddSongsModal" class="btn-cancel">取消</button>
            <button
                @click="addSelectedSongs"
                class="btn-confirm"
                :disabled="selectedSongs.size === 0"
            >
              添加到歌单
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑歌单模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑歌单</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>歌单名称</label>
            <input v-model="editForm.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>歌单描述</label>
            <textarea v-model="editForm.description" class="form-textarea"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button @click="closeEditModal" class="btn-cancel">取消</button>
            <button @click="saveEdit" class="btn-confirm">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'
import SongItem from '@/components/SongItem.vue'

// 图标组件
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import ShuffleIcon from '@/assets/icons/ShuffleIcon.vue'
import EditIcon from '@/assets/icons/EditIcon.vue'
import DeleteIcon from '@/assets/icons/DeleteIcon.vue'
import SearchIcon from '@/assets/icons/SearchIcon.vue'
import SortIcon from '@/assets/icons/SortIcon.vue'
import ArrowDownIcon from '@/assets/icons/ArrowDownIcon.vue'
import AddIcon from '@/assets/icons/AddIcon.vue'
import UserIcon from '@/assets/icons/UserIcon.vue'
import CalendarIcon from '@/assets/icons/CalendarIcon.vue'
import MusicIcon from '@/assets/icons/MusicIcon.vue'
import PlayCountIcon from '@/assets/icons/PlayCountIcon.vue'

// 路由和Store
const route = useRoute()
const router = useRouter()
const musicStore = useMusicStore()

// 状态
const loading = ref(true)
const error = ref('')
const playlistId = ref(null)
const searchQuery = ref('')
const sortBy = ref('trackOrder')
const showSortMenu = ref(false)
const showAddSongsModal = ref(false)
const showEditModal = ref(false)
const selectedSongs = ref(new Set())
const editForm = ref({
  name: '',
  description: ''
})

// 排序选项
const sortOptions = [
  { label: '默认排序', value: 'trackOrder' },
  { label: '歌曲名称', value: 'title' },
  { label: '歌手', value: 'singer' },
  { label: '时长', value: 'duration' }
]

// 计算属性
const playlist = computed(() => musicStore.currentPlaylist)
const userInfo = computed(() => musicStore.userInfo)
const allSongs = computed(() => musicStore.allMusics)

const isOwnPlaylist = computed(() => {
  return playlist.value && userInfo.value && playlist.value.userId === userInfo.value.userId
})

const songs = computed(() => {
  return playlist.value?.items?.map(item => ({
    ...item,
    music: {
      ...item.music,
      duration: item.music.duration || 0
    }
  })) || []
})

const filteredSongs = computed(() => {
  let filtered = [...songs.value]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
        item.music.title.toLowerCase().includes(query) ||
        item.music.singer.toLowerCase().includes(query)
    )
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.music.title.localeCompare(b.music.title)
      case 'singer':
        return a.music.singer.localeCompare(b.music.singer)
      case 'duration':
        return (a.music.duration || 0) - (b.music.duration || 0)
      default:
        return a.trackOrder - b.trackOrder
    }
  })

  return filtered
})

const availableSongs = computed(() => {
  const currentSongIds = new Set(songs.value.map(item => item.musicId))
  return allSongs.value.filter(song => !currentSongIds.has(song.id))
})

const coverStyle = computed(() => {
  if (playlist.value?.coverUrl) {
    return {
      backgroundImage: `url(${playlist.value.coverUrl})`
    }
  }
  return {}
})

// 方法
const loadPlaylistDetail = async () => {
  if (!playlistId.value) return

  loading.value = true
  error.value = ''

  try {
    await musicStore.fetchPlaylistDetail(playlistId.value)
  } catch (err) {
    error.value = err.message || '加载歌单失败'
    console.error('加载歌单详情失败:', err)
  } finally {
    loading.value = false
  }
}

const playAllSongs = () => {
  if (songs.value.length === 0) return

  const songList = songs.value.map(item => item.music)
  musicStore.playSong(songList[0], songList)
}

const shufflePlay = () => {
  if (songs.value.length === 0) return

  const shuffledSongs = [...songs.value]
      .sort(() => Math.random() - 0.5)
      .map(item => item.music)

  musicStore.playSong(shuffledSongs[0], shuffledSongs)
  musicStore.setPlayMode('random')
}

const handleSongPlay = (song) => {
  musicStore.playSong(song, songs.value.map(item => item.music))
}

const handleSongLike = (songId) => {
  // 可以在这里添加额外的逻辑
  console.log('歌曲喜欢状态变化:', songId)
}

const handleSongStar = (songId) => {
  // 可以在这里添加额外的逻辑
  console.log('歌曲收藏状态变化:', songId)
}

const toggleSortMenu = () => {
  showSortMenu.value = !showSortMenu.value
}

const handleSort = (sortValue) => {
  sortBy.value = sortValue
  showSortMenu.value = false
}

const toggleSongSelection = (songId) => {
  if (selectedSongs.value.has(songId)) {
    selectedSongs.value.delete(songId)
  } else {
    selectedSongs.value.add(songId)
  }
}

const addSelectedSongs = async () => {
  if (selectedSongs.value.size === 0) return

  try {
    for (const songId of selectedSongs.value) {
      await musicStore.addToPlaylist(playlistId.value, songId)
    }
    closeAddSongsModal()
  } catch (err) {
    console.error('添加歌曲失败:', err)
  }
}

const editPlaylist = () => {
  if (!playlist.value) return

  editForm.value = {
    name: playlist.value.name,
    description: playlist.value.description || ''
  }
  showEditModal.value = true
}

const saveEdit = async () => {
  // 这里需要实现歌单编辑的API调用
  console.log('保存编辑:', editForm.value)
  closeEditModal()
}

const deletePlaylist = async () => {
  if (!playlist.value || !confirm('确定要删除这个歌单吗？此操作不可撤销。')) return

  try {
    await musicStore.deleteUserPlaylist(playlistId.value)
    router.push('/') // 删除后跳转到首页
  } catch (err) {
    console.error('删除歌单失败:', err)
  }
}

const closeAddSongsModal = () => {
  showAddSongsModal.value = false
  selectedSongs.value.clear()
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = { name: '', description: '' }
}

const retryLoading = () => {
  loadPlaylistDetail()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 监听路由变化
watch(() => route.params.id, (newId) => {
  playlistId.value = parseInt(newId)
  loadPlaylistDetail()
})

// 组件挂载
onMounted(() => {
  playlistId.value = parseInt(route.params.id)
  loadPlaylistDetail()
})
</script>

<style scoped>
.playlist-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 加载和错误状态 */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-light);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

/* 歌单头部 */
.playlist-header {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
}

.cover-section {
  position: relative;
  flex-shrink: 0;
}

.cover-image {
  width: 240px;
  height: 240px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  background-color: var(--background-secondary);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--border-light);
  border-radius: 12px;
}

.placeholder-icon {
  width: 64px;
  height: 64px;
  color: var(--text-muted);
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cover-section:hover .cover-overlay {
  opacity: 1;
}

.play-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

.play-icon {
  width: 20px;
  height: 20px;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.playlist-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.playlist-description {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.5;
}

.playlist-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.meta-icon {
  width: 16px;
  height: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--background-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.action-btn.danger {
  color: #e74c3c;
  border-color: #e74c3c;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-small);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 歌曲列表部分 */
.songs-section {
  background: var(--background-card);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-light);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  position: relative;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.search-input {
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--background-secondary);
  color: var(--text-primary);
  width: 200px;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--background-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.sort-icon, .arrow-icon {
  width: 14px;
  height: 14px;
}

.sort-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--background-card);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  box-shadow: var(--shadow-medium);
  z-index: 100;
  min-width: 120px;
  margin-top: 4px;
}

.sort-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.sort-option:hover, .sort-option.active {
  background: var(--background-secondary);
}

/* 歌曲列表头部 */
.songs-header {
  display: grid;
  grid-template-columns: 60px 1fr 1fr 1fr 80px 100px;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.empty-tip {
  color: var(--text-muted);
  margin-bottom: 20px;
}

.add-songs-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.add-icon {
  width: 16px;
  height: 16px;
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
  padding: 20px;
}

.modal-content {
  background: var(--background-card);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid var(--border-light);
}

/* 歌曲网格 */
.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.song-card {
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--background-secondary);
}

.song-card.selected {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.song-card-cover {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  margin-bottom: 8px;
  position: relative;
}

.card-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--border-light);
  border-radius: 6px;
}

.card-icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
}

.card-overlay {
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
.card-play-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.song-card:hover .card-overlay {
  opacity: 1;
}

.song-card-info {
  text-align: center;
}

.card-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-singer {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.card-labels {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.card-label {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent-color);
  color: white;
  border-radius: 8px;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-primary);
  font-weight: 600;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--background-secondary);
  color: var(--text-primary);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* 选择信息和操作按钮 */
.selection-info {
  color: var(--text-muted);
  font-size: 14px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .playlist-detail {
    padding: 12px;
  }

  .playlist-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .cover-image {
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }

  .playlist-title {
    font-size: 24px;
  }

  .playlist-meta {
    justify-content: center;
  }

  .action-buttons {
    justify-content: center;
  }

  .songs-section {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: space-between;
  }

  .search-input {
    width: 150px;
  }

  .songs-header {
    display: none; /* 在移动端隐藏表头 */
  }

  .songs-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .modal-content {
    margin: 10px;
  }

  .modal-content.large {
    max-width: calc(100vw - 20px);
  }
}

@media (max-width: 480px) {
  .playlist-title {
    font-size: 20px;
  }

  .playlist-meta {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .search-input {
    width: 100%;
  }

  .songs-grid {
    grid-template-columns: 1fr;
  }
}

/* 动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 滚动条样式 */
.songs-grid::-webkit-scrollbar,
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.songs-grid::-webkit-scrollbar-track,
.modal-body::-webkit-scrollbar-track {
  background: var(--background-secondary);
  border-radius: 3px;
}

.songs-grid::-webkit-scrollbar-thumb,
.modal-body::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.songs-grid::-webkit-scrollbar-thumb:hover,
.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--primary-hover);
}
</style>