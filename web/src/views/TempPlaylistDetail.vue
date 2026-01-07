<template>
  <div class="temp-playlist-detail-page">
    <!-- 歌单头部 -->
    <div class="playlist-header">
      <div class="cover-section">
        <div class="cover-image">
          <div class="cover-placeholder">🎵</div>
        </div>
      </div>

      <div class="info-section">
        <h1 class="playlist-title">{{ playlist.name }}</h1>
        <p class="playlist-description">{{ playlist.description }}</p>

        <div class="playlist-meta">
          <span class="meta-item">
            <span class="meta-icon">🎵</span>
            {{ playlist.songCount }} 首歌曲
          </span>
          <span class="meta-item">
            <span class="meta-icon">⏱️</span>
            {{ formatTotalDuration(playlist.duration) }}
          </span>
          <span v-if="playlist.tags && playlist.tags.length > 0" class="meta-item">
            <span class="meta-icon">🏷️</span>
            {{ playlist.tags.join(' · ') }}
          </span>
        </div>

        <div class="action-buttons">
          <button class="action-btn primary" @click="playAll">
            <span class="btn-icon">▶</span>
            播放全部
          </button>
          <button class="action-btn" @click="saveToMyPlaylist">
            <span class="btn-icon">⭐</span>
            保存到我的歌单
          </button>
          <button class="action-btn" @click="goBack">
            <span class="btn-icon">←</span>
            返回首页
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
            <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索歌曲..."
                class="search-input"
            />
          </div>
        </div>
      </div>

      <div v-if="filteredSongs.length > 0" class="songs-list">
        <div
            v-for="(song, index) in filteredSongs"
            :key="song.id || index"
            class="song-item"
            @click="playSong(song, index)"
        >
          <div class="song-order">{{ index + 1 }}</div>
          <div class="song-info">
            <div class="song-title">{{ song.title || song.name }}</div>
            <div class="song-singer">{{ song.singer || song.artist }}</div>
            <div v-if="song.labels" class="song-tags">
              <span v-for="label in song.labels" :key="label" class="song-tag">
                {{ label }}
              </span>
            </div>
          </div>
          <div class="song-duration">{{ formatDuration(song.duration || 0) }}</div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🎵</div>
        <h4 v-if="searchQuery">没有找到相关歌曲</h4>
        <h4 v-else>歌单是空的</h4>
        <button v-if="!searchQuery" class="back-btn" @click="goBack">
          返回首页重新生成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const musicStore = useMusicStore()

const playlist = ref({
  name: 'AI推荐歌单',
  description: '魔法师精心调制的专属歌单',
  songCount: 0,
  duration: 0,
  songs: [],
  tags: []
})
const searchQuery = ref('')

onMounted(() => {
  // 只从查询参数获取数据
  if (route.query.playlistData) {
    try {
      const data = JSON.parse(decodeURIComponent(route.query.playlistData))
      playlist.value = {
        ...playlist.value,
        ...data,
        songCount: data.songs?.length || 0,
        duration: data.duration || data.songs?.reduce((sum, song) => sum + (song.duration || 0), 0) || 0
      }
      console.log('加载的临时歌单:', playlist.value)
    } catch (error) {
      console.error('解析歌单数据失败:', error)
      ElMessage.error('加载歌单失败')
      router.push('/')
    }
  } else {
    ElMessage.warning('没有歌单数据')
    router.push('/')
  }
})

// 计算属性：过滤歌曲
const filteredSongs = computed(() => {
  if (!playlist.value.songs || playlist.value.songs.length === 0) return []

  if (!searchQuery.value.trim()) {
    return playlist.value.songs
  }

  const query = searchQuery.value.toLowerCase()
  return playlist.value.songs.filter(song => {
    const title = (song.title || song.name || '').toLowerCase()
    const singer = (song.singer || song.artist || '').toLowerCase()
    return title.includes(query) || singer.includes(query)
  })
})

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTotalDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

const playAll = () => {
  if (playlist.value.songs && playlist.value.songs.length > 0) {
    musicStore.playSong(playlist.value.songs[0], playlist.value.songs)
    ElMessage.success('开始播放全部歌曲')
  }
}

const playSong = (song, index) => {
  musicStore.playSong(song, playlist.value.songs, index)
}

const saveToMyPlaylist = async () => {
  try {
    ElMessageBox.prompt('请输入歌单名称', '保存歌单', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: playlist.value.name,
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return '歌单名称不能为空'
        }
        return true
      }
    }).then(async ({ value }) => {
      const name = value.trim()
      const description = playlist.value.description || 'AI推荐的歌单'

      // 调用保存API
      const response = await musicStore.saveAIRecommendationAsPlaylist(
          name,
          description,
          playlist.value.songs.map(song => song.id)
      )

      if (response.code === 200) {
        ElMessage.success('歌单保存成功！')
        // 可以跳转到保存后的歌单详情页
        // router.push(`/playlist/${response.data.id}`)
      } else {
        throw new Error(response?.message || '保存失败')
      }
    }).catch(() => {
      // 用户取消
    })
  } catch (error) {
    console.error('保存歌单失败:', error)
    ElMessage.error(`保存失败：${error.message || '请稍后重试'}`)
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.temp-playlist-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.playlist-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.cover-section {
  flex-shrink: 0;
}

.cover-image {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.playlist-title {
  font-size: 32px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 10px 0;
}

.playlist-description {
  color: var(--text-secondary);
  margin: 0 0 20px 0;
  line-height: 1.6;
  font-size: 16px;
}

.playlist-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
  background: var(--secondary-color);
  padding: 6px 12px;
  border-radius: 20px;
}

.meta-icon {
  font-size: 16px;
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
  padding: 12px 24px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 16px;
}

.songs-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
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
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 10px 15px;
  padding-left: 40px;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  width: 250px;
  font-size: 14px;
  background: var(--secondary-color);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.songs-list {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.song-item:hover {
  background: var(--secondary-color);
  transform: translateX(5px);
}

.song-item:last-child {
  border-bottom: none;
}

.song-order {
  width: 40px;
  text-align: center;
  color: var(--text-muted);
  font-size: 16px;
  font-weight: 500;
}

.song-info {
  flex: 1;
  min-width: 0;
  margin: 0 20px;
}

.song-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-singer {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.song-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--accent-color);
  color: white;
  border-radius: 10px;
  opacity: 0.8;
}

.song-duration {
  width: 60px;
  text-align: right;
  color: var(--text-muted);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: var(--text-muted);
}

.back-btn {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .playlist-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .cover-image {
    width: 150px;
    height: 150px;
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

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .search-input {
    width: 100%;
  }

  .song-item {
    padding: 12px 15px;
  }

  .song-order {
    width: 30px;
    font-size: 14px;
  }

  .song-info {
    margin: 0 10px;
  }

  .song-title {
    font-size: 14px;
  }

  .song-singer {
    font-size: 12px;
  }

  .song-duration {
    width: 50px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .temp-playlist-detail-page {
    padding: 10px;
  }

  .playlist-header {
    padding: 20px;
  }

  .cover-image {
    width: 120px;
    height: 120px;
    font-size: 40px;
  }

  .playlist-title {
    font-size: 20px;
  }

  .playlist-description {
    font-size: 14px;
  }

  .meta-item {
    font-size: 12px;
    padding: 4px 8px;
  }

  .action-btn {
    padding: 10px 16px;
    font-size: 14px;
  }

  .songs-section {
    padding: 20px;
  }

  .section-header h3 {
    font-size: 20px;
  }
}
</style>
