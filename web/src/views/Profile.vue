<template>
  <div class="profile-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 用户信息部分 -->
    <div v-else class="profile-content">
      <!-- 用户卡片 -->
      <div class="user-card">
        <div class="user-avatar-section">
          <div class="avatar-container">
            <div class="avatar-placeholder">
              {{ userInitials }}
            </div>
            <button class="edit-avatar-btn" @click="showAvatarModal = true">
              <EditIcon class="edit-icon" />
            </button>
          </div>
        </div>

        <div class="user-info-section">
          <div class="user-basic-info">
            <h1 class="username">{{ userInfo.username || '用户' }}</h1>
            <p class="user-nickname" v-if="userInfo.nickname">{{ userInfo.nickname }}</p>
            <p class="user-bio" v-if="userInfo.bio">{{ userInfo.bio }}</p>
            <button class="edit-profile-btn" @click="showEditModal = true">
              <EditIcon class="btn-icon" />
              编辑资料
            </button>
          </div>

          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-number">{{ userStats.createdPlaylists }}</div>
              <div class="stat-label">创建的歌单</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ userStats.likedSongs }}</div>
              <div class="stat-label">喜欢的歌曲</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ userStats.playCount }}</div>
              <div class="stat-label">总播放次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ userStats.joinDays }}</div>
              <div class="stat-label">加入天数</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签导航 -->
      <div class="tab-navigation">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span class="tab-count" v-if="tab.count > 0">({{ tab.count }})</span>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="profile-content-area">
        <!-- 创建的歌单 -->
        <div v-if="activeTab === 'playlists'" class="tab-content">
          <div class="section-header">
            <h2>创建的歌单</h2>
            <button class="create-playlist-btn" @click="showCreatePlaylistModal = true">
              <AddIcon class="btn-icon" />
              新建歌单
            </button>
          </div>

          <div v-if="createdPlaylists.length > 0" class="playlists-grid">
            <PlaylistCard
                v-for="playlist in createdPlaylists"
                :key="playlist.id"
                :playlist="playlist"
                :show-actions="true"
                @click="goToPlaylist(playlist.id)"
                @edit="editPlaylist(playlist)"
                @delete="deletePlaylist(playlist.id)"
            />
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🎵</div>
            <h3>还没有创建歌单</h3>
            <p>创建你的第一个歌单，开始收藏喜欢的音乐</p>
            <button class="create-first-btn" @click="showCreatePlaylistModal = true">
              创建歌单
            </button>
          </div>
        </div>

        <!-- 喜欢的歌曲 -->
        <div v-if="activeTab === 'liked'" class="tab-content">
          <div class="section-header">
            <h2>喜欢的歌曲</h2>
            <button
                v-if="likedSongs.length > 0"
                class="play-all-btn"
                @click="playLikedSongs"
            >
              <PlayIcon class="btn-icon" />
              播放全部
            </button>
          </div>

          <div v-if="likedSongs.length > 0" class="songs-list">
            <SongItem
                v-for="(song, index) in likedSongs"
                :key="song.id"
                :song="song"
                :track-order="index + 1"
                @play="playSong(song)"
            />
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">❤️</div>
            <h3>还没有喜欢的歌曲</h3>
            <p>发现好音乐，点击喜欢按钮收藏它们</p>
          </div>
        </div>

        <!-- 最近播放 -->
        <div v-if="activeTab === 'recent'" class="tab-content">
          <div class="section-header">
            <h2>最近播放</h2>
            <button
                v-if="recentSongs.length > 0"
                class="clear-history-btn"
                @click="clearPlayHistory"
            >
              <ClearIcon class="btn-icon" />
              清空记录
            </button>
          </div>

          <div v-if="recentSongs.length > 0" class="songs-list">
            <SongItem
                v-for="(song, index) in recentSongs"
                :key="song.id"
                :song="song"
                :track-order="index + 1"
                @play="playSong(song)"
            />
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🕒</div>
            <h3>还没有播放记录</h3>
            <p>开始播放音乐，这里会记录你的收听历史</p>
          </div>
        </div>

        <!-- 收藏的歌单 -->
        <div v-if="activeTab === 'starred'" class="tab-content">
          <div class="section-header">
            <h2>收藏的歌单</h2>
          </div>

          <div v-if="starredPlaylists.length > 0" class="playlists-grid">
            <PlaylistCard
                v-for="playlist in starredPlaylists"
                :key="playlist.id"
                :playlist="playlist"
                @click="goToPlaylist(playlist.id)"
            />
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">⭐</div>
            <h3>还没有收藏歌单</h3>
            <p>发现有趣的歌单，收藏它们随时聆听</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑资料模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="editForm.username" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="editForm.nickname" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>个人简介</label>
            <textarea v-model="editForm.bio" class="form-textarea" placeholder="介绍一下自己..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button @click="closeEditModal" class="btn-cancel">取消</button>
            <button @click="saveProfile" class="btn-confirm">保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建歌单模态框 -->
    <div v-if="showCreatePlaylistModal" class="modal-overlay" @click.self="closeCreatePlaylistModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>创建歌单</h3>
          <button class="close-btn" @click="closeCreatePlaylistModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>歌单名称</label>
            <input v-model="newPlaylist.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>歌单描述</label>
            <textarea v-model="newPlaylist.description" class="form-textarea"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button @click="closeCreatePlaylistModal" class="btn-cancel">取消</button>
            <button
                @click="createPlaylist"
                class="btn-confirm"
                :disabled="!newPlaylist.name.trim()"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑头像模态框 -->
    <div v-if="showAvatarModal" class="modal-overlay" @click.self="closeAvatarModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>更换头像</h3>
          <button class="close-btn" @click="closeAvatarModal">×</button>
        </div>

        <div class="modal-body">
          <div class="avatar-options">
            <div
                v-for="(avatar, index) in avatarOptions"
                :key="index"
                class="avatar-option"
                :class="{ selected: selectedAvatar === avatar }"
                @click="selectedAvatar = avatar"
            >
              <div class="avatar-option-inner">
                {{ String.fromCharCode(65 + index) }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button @click="closeAvatarModal" class="btn-cancel">取消</button>
            <button @click="saveAvatar" class="btn-confirm">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'
import SongItem from '@/components/SongItem.vue'
import PlaylistCard from '@/components/PlaylistCard.vue'

// 图标组件
import EditIcon from '@/assets/icons/EditIcon.vue'
import AddIcon from '@/assets/icons/AddIcon.vue'
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import ClearIcon from '@/assets/icons/ClearIcon.vue'

// 路由和Store
const router = useRouter()
const musicStore = useMusicStore()

// 状态
const loading = ref(true)
const activeTab = ref('playlists')
const showEditModal = ref(false)
const showCreatePlaylistModal = ref(false)
const showAvatarModal = ref(false)
const selectedAvatar = ref('')

// 表单数据
const editForm = ref({
  username: '',
  nickname: '',
  bio: ''
})

const newPlaylist = ref({
  name: '',
  description: ''
})

// 标签页配置
const tabs = ref([
  { id: 'playlists', label: '创建的歌单', count: 0 },
  { id: 'liked', label: '喜欢的歌曲', count: 0 },
  { id: 'recent', label: '最近播放', count: 0 },
  { id: 'starred', label: '收藏的歌单', count: 0 }
])

// 头像选项
const avatarOptions = ref(['A', 'B', 'C', 'D'])

// 计算属性
const userInfo = computed(() => {
  return musicStore.userInfo || {}
})

const userInitials = computed(() => {
  const username = userInfo.value.username || '用户'
  return username.charAt(0).toUpperCase()
})

const allPlaylists = computed(() => {
  return musicStore.allPlaylists || []
})

const allSongs = computed(() => {
  return musicStore.allMusics || []
})

const createdPlaylists = computed(() => {
  return allPlaylists.value.filter(playlist => {
    return true
  })
})

const starredPlaylists = computed(() => {
  const starredIds = userInfo.value.starredPlaylists || []
  return allPlaylists.value.filter(playlist => {
    return starredIds.includes(playlist.id)
  })
})

const likedSongs = computed(() => {
  const likedIds = Array.from(musicStore.likedSongs || new Set())
  return allSongs.value.filter(song => {
    return likedIds.includes(song.id)
  })
})

const recentSongs = computed(() => {
  const recentIds = userInfo.value.recentPlayed || []
  return recentIds.map(id => {
    return allSongs.value.find(song => song.id === id)
  }).filter(Boolean)
})

const userStats = computed(() => {
  return {
    createdPlaylists: createdPlaylists.value.length,
    likedSongs: likedSongs.value.length,
    playCount: userInfo.value.totalPlayCount || 0,
    joinDays: formatJoinDate(userInfo.value.createdAt)
  }
})

// 方法
const loadUserData = async () => {
  loading.value = true
  try {
    if (!musicStore.userInfo) {
      await musicStore.userLoginAction()
    }
    await musicStore.fetchAllPlaylists()
    await musicStore.fetchAllMusic()
    updateTabCounts()
  } catch (error) {
    console.error('加载用户数据失败:', error)
  } finally {
    loading.value = false
  }
}

const updateTabCounts = () => {
  tabs.value.forEach(tab => {
    if (tab.id === 'playlists') {
      tab.count = createdPlaylists.value.length
    } else if (tab.id === 'liked') {
      tab.count = likedSongs.value.length
    } else if (tab.id === 'recent') {
      tab.count = recentSongs.value.length
    } else if (tab.id === 'starred') {
      tab.count = starredPlaylists.value.length
    }
  })
}

const playSong = (song) => {
  musicStore.playSong(song)
}

const playLikedSongs = () => {
  if (likedSongs.value.length > 0) {
    musicStore.playSong(likedSongs.value[0], likedSongs.value)
  }
}

const goToPlaylist = (playlistId) => {
  router.push(`/playlist/${playlistId}`)
}

const editPlaylist = (playlist) => {
  console.log('编辑歌单:', playlist)
}

const deletePlaylist = async (playlistId) => {
  if (!confirm('确定要删除这个歌单吗？此操作不可撤销。')) {
    return
  }

  try {
    await musicStore.deleteUserPlaylist(playlistId)
    updateTabCounts()
  } catch (error) {
    console.error('删除歌单失败:', error)
  }
}

const createPlaylist = async () => {
  try {
    await musicStore.createNewPlaylist(newPlaylist.value)
    closeCreatePlaylistModal()
    updateTabCounts()
  } catch (error) {
    console.error('创建歌单失败:', error)
  }
}

const clearPlayHistory = () => {
  if (confirm('确定要清空播放记录吗？')) {
    console.log('清空播放历史')
  }
}

const saveProfile = () => {
  console.log('保存资料:', editForm.value)
  closeEditModal()
}

const saveAvatar = () => {
  console.log('保存头像:', selectedAvatar.value)
  closeAvatarModal()
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = { username: '', nickname: '', bio: '' }
}

const closeCreatePlaylistModal = () => {
  showCreatePlaylistModal.value = false
  newPlaylist.value = { name: '', description: '' }
}

const closeAvatarModal = () => {
  showAvatarModal.value = false
  selectedAvatar.value = ''
}

const formatJoinDate = (dateString) => {
  if (!dateString) {
    return '0'
  }
  const joinDate = new Date(dateString)
  const today = new Date()
  const diffTime = Math.abs(today - joinDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays.toString()
}

// 组件挂载
onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
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

.loading-container p {
  color: var(--text-muted);
  font-size: 16px;
}

/* 用户卡片 */
.user-card {
  display: flex;
  gap: 32px;
  background: var(--background-card);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-small);
}

.user-avatar-section {
  flex-shrink: 0;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  font-weight: bold;
  box-shadow: var(--shadow-medium);
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: var(--primary-color);
  border: 3px solid var(--background-card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-avatar-btn:hover {
  transform: scale(1.1);
  background: var(--primary-hover);
}

.edit-icon {
  width: 16px;
  height: 16px;
  color: white;
}

.user-info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.user-basic-info {
  margin-bottom: 20px;
}

.username {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.user-nickname {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  font-weight: 500;
}

.user-bio {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.edit-profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.edit-profile-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.user-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  min-width: 80px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 标签导航 */
.tab-navigation {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--background-card);
  border-radius: 8px;
  padding: 4px;
  box-shadow: var(--shadow-small);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-small);
}

.tab-btn:hover:not(.active) {
  background: var(--background-secondary);
  color: var(--text-primary);
}

.tab-count {
  font-size: 12px;
  opacity: 0.8;
}

/* 内容区域 */
.profile-content-area {
  min-height: 400px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 8px;
}

.section-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
}

.create-playlist-btn,
.play-all-btn,
.clear-history-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.create-playlist-btn:hover,
.play-all-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.clear-history-btn {
  background: var(--text-muted);
}

.clear-history-btn:hover {
  background: var(--text-secondary);
}

/* 歌单网格 */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* 歌曲列表 */
.songs-list {
  background: var(--background-card);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  box-shadow: var(--shadow-small);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--background-card);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  margin: 20px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 20px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.create-first-btn {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.create-first-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
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
  box-shadow: var(--shadow-large);
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
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: var(--text-primary);
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

/* 头像选择 */
.avatar-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.avatar-option {
  aspect-ratio: 1;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-option.selected {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.avatar-option:hover {
  border-color: var(--accent-color);
}

.avatar-option-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--background-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.btn-cancel:hover {
  background: var(--border-light);
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .user-card {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 24px;
  }

  .avatar-container {
    margin: 0 auto;
  }

  .user-stats {
    justify-content: center;
    gap: 24px;
  }

  .stat-item {
    min-width: 70px;
  }

  .stat-number {
    font-size: 20px;
  }

  .tab-navigation {
    flex-wrap: wrap;
    gap: 4px;
  }

  .tab-btn {
    flex: 1 0 calc(50% - 8px);
    min-width: 120px;
    padding: 10px 12px;
    font-size: 13px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .playlists-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }

  .modal-content {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }

  .avatar-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .profile-page {
    padding: 12px;
  }

  .user-card {
    padding: 20px;
  }

  .avatar-container {
    width: 100px;
    height: 100px;
  }

  .avatar-placeholder {
    font-size: 36px;
  }

  .username {
    font-size: 24px;
  }

  .user-stats {
    gap: 16px;
  }

  .stat-item {
    min-width: 60px;
  }

  .stat-number {
    font-size: 18px;
  }

  .stat-label {
    font-size: 12px;
  }

  .tab-btn {
    flex: 1 0 100%;
  }

  .playlists-grid {
    grid-template-columns: 1fr;
  }

  .avatar-options {
    grid-template-columns: 1fr;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-cancel, .btn-confirm {
    width: 100%;
  }
}

/* 滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: var(--background-secondary);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--primary-hover);
}

/* 悬停效果增强 */
.user-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.tab-content {
  transition: all 0.3s ease;
}

/* 空状态动画 */
.empty-icon {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* 加载状态动画 */
.loading-container {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* 确保所有交互元素都有适当的焦点状态 */
button:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

input:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 1px;
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .user-card {
    border-width: 2px;
  }

  .tab-btn.active {
    font-weight: 700;
  }

  .stat-number {
    font-weight: 800;
  }
}

/* 减少动画支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .loading-spinner {
    animation: none;
    border: 4px solid var(--border-light);
    border-top-color: var(--primary-color);
  }
}
</style>