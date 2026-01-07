<template>
  <div class="home-page">
    <!-- 魔法师场景布局 -->
    <div class="wizard-scene">
      <!-- 左侧柜子 - 音乐类型 -->
      <div class="cabinet-container left-cabinet">
        <img src="@/assets/images/cabinet.png" alt="柜子" class="cabinet-img" />
        <div class="bags-container">
          <div class="bags-grid">
            <div
                v-for="genre in musicGenres"
                :key="genre.id"
                class="bag-item"
                :class="{ selected: selectedGenres.includes(genre.id) }"
                @click="toggleGenre(genre.id)"
            >
              <img src="@/assets/images/bag.png" alt="袋子" class="bag-img" />
              <div class="bag-content">
                <span class="bag-text">{{ genre.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间魔法师区域 -->
      <div class="center-scene">
        <!-- 魔法师头顶的歌单显示区域 -->
        <div
            v-if="showGeneratedPlaylist"
            class="playlist-bubble"
            @click="goToGeneratedPlaylist"
        >
          <div class="playlist-info">
            <div class="playlist-cover">
              <div class="cover-placeholder">🎵</div>
            </div>
            <div class="playlist-details">
              <h3>{{ generatedPlaylist.name }}</h3>
              <p>{{ generatedPlaylist.songCount }} 首歌曲</p>
              <small class="click-hint">点击查看详情 →</small>
            </div>
            <div class="playlist-actions">
              <button class="play-btn" @click.stop="playGeneratedPlaylist(generatedPlaylist)">
                ▶ 播放
              </button>
              <button class="save-btn" @click.stop="openSaveAIPlaylistModal">
                ⭐ 保存
              </button>
            </div>
          </div>
        </div>

        <!-- 魔法师 -->
        <div class="wizard-area" @click="toggleChat">
          <img src="@/assets/images/wizard.png" alt="魔法师" class="wizard-img" />
          <div class="wizard-hint">
            <span>✨ 点击与我对话</span>
          </div>
        </div>

        <!-- 桌子和坩埚 -->
        <div class="table-area">
          <img src="@/assets/images/table.png" alt="桌子" class="table-img" />
          <div class="cauldron-container">
            <img src="@/assets/images/cauldron.png" alt="坩埚" class="cauldron-img" />
            <div
                v-for="item in fallingItems"
                :key="item.id"
                class="falling-text"
            >
              {{ item.text }}
            </div>
            <!-- 调和按钮 -->
            <button
                v-if="hasSelection"
                class="mix-btn"
                @click="startMixing"
                :disabled="isMixing"
            >
              {{ isMixing ? '调和中...' : '开始调和' }}
            </button>
          </div>
        </div>

        <!-- AI助手对话输入框 -->
        <div v-if="showChat" class="chat-input-container">
          <div class="input-wrapper">
            <input
                v-model="userInput"
                type="text"
                placeholder="告诉我你的音乐需求..."
                class="chat-input"
                @keyup.enter="sendMessage"
                :disabled="loadingAI"
            />
            <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim() || loadingAI">
              {{ loadingAI ? '...' : '发送' }}
            </button>
          </div>
          <div class="quick-prompts">
            <span class="prompts-label">试试这样说：</span>
            <div class="prompts-grid">
              <button
                  v-for="prompt in quickPrompts"
                  :key="prompt"
                  class="prompt-bubble"
                  @click="useQuickPrompt(prompt)"
                  :disabled="loadingAI"
              >
                {{ prompt }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧柜子 - 场景/心情 -->
      <div class="cabinet-container right-cabinet">
        <img src="@/assets/images/cabinet.png" alt="柜子" class="cabinet-img" />
        <div class="bags-container">
          <div class="bags-grid">
            <div
                v-for="tag in filterTags"
                :key="tag.id"
                class="bag-item"
                :class="{ selected: selectedTags.includes(tag.id) }"
                @click="toggleTag(tag.id)"
            >
              <img src="@/assets/images/bag.png" alt="袋子" class="bag-img" />
              <div class="bag-content">
                <span class="bag-text">{{ tag.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 原来的推荐板块 - 移动到魔法师场景下面 -->
    <div class="recommendations-wrapper">
      <RecommendationsSection
          :recommended-playlists="recommendedPlaylists"
          :recommended-songs="recommendedSongs"
          :popular-playlists="popularPlaylists"
          :new-songs="newSongs"
          @refresh-playlists="refreshPlaylists"
          @goto-playlist="gotoPlaylist"
          @play-all-recommended-songs="playAllRecommendedSongs"
          @play-song="playSong"
      />
    </div>

    <!-- AI歌单保存模态框 -->
    <SaveAIPlaylistModal
        v-if="showSaveAIPlaylistModal"
        :visible="showSaveAIPlaylistModal"
        :loading="savingAIPlaylist"
        :default-name="aiPlaylistData.name"
        :default-description="aiPlaylistData.description"
        @save="saveAIPlaylist"
        @close="closeSaveAIPlaylistModal"
    />

    <!-- 底部音乐播放栏 -->
    <BottomPlayerBar />

    <!-- 页脚 -->
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMusicStore } from '@/stores/musicStore'

// 导入组件
import RecommendationsSection from '@/components/RecommendationsSection.vue'
import AppFooter from '@/components/AppFooter.vue'
import SaveAIPlaylistModal from '@/components/SaveAIPlaylistModal.vue'
import BottomPlayerBar from '@/components/BottomPlayerBar.vue'



const router = useRouter()
const musicStore = useMusicStore()

// 响应式数据
const loadingAI = ref(false)
const selectedGenres = ref([])
const selectedTags = ref([])
const isMixing = ref(false)
const showChat = ref(false)
const showGeneratedPlaylist = ref(false)
const generatedPlaylist = ref(null)
const userInput = ref('')
const fallingItems = ref([])

// 原有数据保持不变
const recommendedPlaylists = ref([])
const recommendedSongs = ref([])
const popularPlaylists = ref([])
const newSongs = ref([])
const showSaveAIPlaylistModal = ref(false)
const savingAIPlaylist = ref(false)
const aiPlaylistData = reactive({
  name: '',
  description: ''
})

// 音乐类型数据
const musicGenres = ref([
  { id: 'Pop', name: '流行', icon: '🎤', count: 0 },
  { id: 'Rock', name: '摇滚', icon: '🎸', count: 0 },
  { id: 'Jazz', name: '爵士', icon: '🎷', count: 0 },
  { id: 'Classical', name: '古典', icon: '🎻', count: 0 },
  { id: 'Hiphop', name: '嘻哈', icon: '🎧', count: 0 },
  { id: 'Electronic', name: '电子', icon: '⚡', count: 0 },
  { id: 'Folk', name: '民谣', icon: '🎵', count: 0 }
])

// 场景/心情标签
const filterTags = ref([
  { id: 'Studying', name: '学习/工作' },
  { id: 'Fitness', name: '锻炼/健身' },
  { id: 'SleepAid', name: '助眠' },
  { id: 'Relax', name: '放松' },
  { id: 'Party', name: '派对聚会' },
  { id: 'Travel', name: '旅行' },
  { id: 'Driving', name: '驾驶通勤' },
  { id: 'WakeUp', name: '早晨起床' },
  { id: 'FeelDown', name: '沮丧' },
  { id: 'Release', name: '情绪宣泄' },
  { id: 'Instrumental', name: '纯音乐' },
  { id: 'Anime', name: '二次元' }
])

// 快速提示
const quickPrompts = ref([
  '适合学习的轻音乐',
  '运动时听的电子音乐',
  '睡前放松的钢琴曲',
  '开车时听的节奏感强的歌',
  '雨天适合听的歌',
  '80年代复古金曲',
  '适合派对的动感音乐',
  '早晨唤醒活力的歌'
])

// 计算属性
const allSongs = computed(() => musicStore.allMusics || [])
const allPlaylists = computed(() => musicStore.allPlaylists || [])
const hasSelection = computed(() => {
  return selectedGenres.value.length > 0 || selectedTags.value.length > 0
})

// 关键字到标签的映射
const keywordToTags = {
  '学习': ['Studying', 'Classical'],
  '运动': ['Fitness', 'Rock'],
  '睡觉': ['SleepAid', 'Classical'],
  '放松': ['Relax', 'Jazz'],
  '开车': ['Driving', 'Pop'],
  '雨天': ['Relax', 'Jazz'],
  '派对': ['Party', 'Pop', 'Electronic'],
  '早晨': ['WakeUp', 'Pop'],
  '工作': ['Studying', 'Classical'],
  '健身': ['Fitness', 'Rock'],
  '旅行': ['Travel', 'Pop', 'Jazz'],
  '浪漫': ['Pop', 'Relax'],
  '怀旧': ['Jazz', 'Classical']
}

// 通用的添加掉落物函数
const addToCauldron = (text) => {
  const id = Date.now() + Math.random() // 生成唯一ID
  fallingItems.value.push({ id, text })

  // 1秒后（动画结束后）清理掉该元素
  setTimeout(() => {
    fallingItems.value = fallingItems.value.filter(item => item.id !== id)
  }, 1000)
}

// 切换音乐类型
const toggleGenre = (genreId) => {
  const index = selectedGenres.value.indexOf(genreId)
  if (index === -1) {
    selectedGenres.value.push(genreId)

    const genre = musicGenres.value.find(g => g.id === genreId)
    if (genre) addToCauldron(genre.name)

  } else {
    selectedGenres.value.splice(index, 1)
  }
}

// 切换标签
const toggleTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)

  if (index === -1) {
    selectedTags.value.push(tagId)

    const tag = filterTags.value.find(t => t.id === tagId)

    if (tag) {
      addToCauldron(tag.name)
    }

  } else {
    selectedTags.value.splice(index, 1)
  }

  console.log('选中标签:', selectedTags.value)
}

// 开始调和（生成歌单）
const startMixing = async () => {
  try {
    isMixing.value = true
    showGeneratedPlaylist.value = false

    // 模拟调和过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 生成歌单
    const playlist = await generatePlaylistFromSelection()
    generatedPlaylist.value = playlist
    showGeneratedPlaylist.value = true

    // 设置AI歌单数据（用于保存）
    aiPlaylistData.name = playlist.name
    aiPlaylistData.description = playlist.description

  } catch (error) {
    console.error('调和失败:', error)
    ElMessage.error('调和失败，请重试')
  } finally {
    isMixing.value = false
  }
}

// 从选择生成歌单
const generatePlaylistFromSelection = async () => {
  let filteredSongs = [...allSongs.value]

  // 如果有选择的类型，按类型过滤
  if (selectedGenres.value.length > 0) {
    filteredSongs = filteredSongs.filter(song =>
        song.labels?.some(label => {
          const labelStr = label.toString().toLowerCase()
          return selectedGenres.value.some(selected =>
              labelStr.includes(selected.toLowerCase())
          )
        })
    )
  }

  // 如果有选择的标签，按标签映射过滤
  if (selectedTags.value.length > 0) {
    // 将标签映射到音乐类型
    const tagMapping = {
      'Studying': ['Classical', 'Jazz', 'Instrumental'],
      'Fitness': ['Rock', 'HipHop', 'Electronic'],
      'SleepAid': ['Classical', 'Instrumental'],
      'Relax': ['Jazz', 'Classical', 'Instrumental'],
      'Party': ['Pop', 'Electronic', 'HipHop'],
      'Travel': ['Pop', 'Jazz', 'Folk'],
      'Driving': ['Pop', 'Rock'],
      'WakeUp': ['Pop', 'Electronic'],
      'FeelDown': ['Jazz', 'Folk'],
      'Release': ['Rock', 'HipHop'],
      'Instrumental': ['Classical', 'Jazz'],
      'Anime': ['Pop', 'Electronic']
    }

    const tagGenres = selectedTags.value.flatMap(tag => tagMapping[tag] || [])
    filteredSongs = filteredSongs.filter(song =>
        song.labels?.some(label => {
          const labelStr = label.toString().toLowerCase()
          return tagGenres.some(genre => labelStr.includes(genre.toLowerCase()))
        })
    )
  }

  // 如果过滤后没有歌曲，使用随机推荐
  if (filteredSongs.length === 0) {
    filteredSongs = [...allSongs.value]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
  } else {
    filteredSongs = [...filteredSongs]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
  }

  // 计算总时长
  const totalDuration = filteredSongs.reduce((sum, song) => sum + (song.duration || 0), 0)

  // 生成歌单名称
  let playlistName = '魔法师推荐歌单'
  if (selectedGenres.value.length > 0) {
    const selectedGenreNames = selectedGenres.value.map(genreId =>
        musicGenres.value.find(g => g.id === genreId)?.name || genreId
    )
    playlistName = `${selectedGenreNames.join('+')}歌单`
  } else if (selectedTags.value.length > 0) {
    const selectedTagNames = selectedTags.value.map(tagId =>
        filterTags.value.find(t => t.id === tagId)?.name || tagId
    )
    playlistName = `${selectedTagNames.join('+')}歌单`
  }

  return {
    id: Date.now(),
    name: playlistName,
    description: '魔法师精心调制的专属歌单',
    songCount: filteredSongs.length,
    duration: totalDuration,
    songs: filteredSongs,
    tags: [...selectedGenres.value, ...selectedTags.value]
  }
}

// AI助手相关方法
const toggleChat = () => {
  showChat.value = !showChat.value
}

const sendMessage = async () => {
  if (!userInput.value.trim() || loadingAI.value) return

  try {
    loadingAI.value = true

    // 使用原有的AI响应逻辑
    const aiResponse = await generateAIResponse(userInput.value.trim())

    if (aiResponse.playlist) {
      generatedPlaylist.value = aiResponse.playlist
      showGeneratedPlaylist.value = true
      showChat.value = false

      // 设置AI歌单数据
      aiPlaylistData.name = aiResponse.playlist.name
      aiPlaylistData.description = aiResponse.playlist.description
    }

    userInput.value = ''

  } catch (error) {
    console.error('AI对话失败:', error)
    ElMessage.error('AI对话失败')
  } finally {
    loadingAI.value = false
  }
}

const useQuickPrompt = (prompt) => {
  userInput.value = prompt
}

// 播放生成的歌单
const playGeneratedPlaylist = (playlist) => {
  if (playlist.songs && playlist.songs.length > 0) {
    musicStore.playSong(playlist.songs[0], playlist.songs)
  }
}

// 打开保存歌单模态框
const openSaveAIPlaylistModal = () => {
  if (!generatedPlaylist.value) return
  showSaveAIPlaylistModal.value = true
}

const closeSaveAIPlaylistModal = () => {
  showSaveAIPlaylistModal.value = false
}

// 保存AI歌单（保持原有逻辑）
const saveAIPlaylist = async (formData) => {
  if (!formData.name.trim()) {
    ElMessage.warning('请输入歌单名称')
    return
  }

  savingAIPlaylist.value = true

  try {
    const response = await musicStore.saveAIRecommendationAsPlaylist(
        formData.name,
        formData.description
    )

    if (response.code === 200) {
      ElMessage.success('歌单保存成功！')
      setTimeout(() => {
        closeSaveAIPlaylistModal()
      }, 500)
    } else {
      throw new Error(response?.message || '保存失败')
    }
  } catch (error) {
    console.error('保存AI歌单失败:', error)
    ElMessage.error(`保存失败：${error.message || '请稍后重试'}`)
  } finally {
    savingAIPlaylist.value = false
  }
}

// 原有的AI响应生成函数
const generateAIResponse = async (userMessage) => {
  console.log('AI请求:', userMessage)
  try {
    // 尝试调用后端API
    const response = await musicStore.getAIRecommendation(userMessage)
    if (response.code === 200) {
      const aiData = response.data
      return {
        content: aiData.LLMReply?.content || `根据"${userMessage}"为你推荐：`,
        playlist: {
          id: Date.now(),
          name: aiData.LLMReply?.playlistName || `AI推荐歌单`,
          description: aiData.LLMReply?.content || 'AI智能推荐的歌单',
          songCount: aiData.playlist?.length || 0,
          duration: aiData.playlist?.reduce((sum, song) => sum + (song.duration || 0), 0) || 0,
          songs: aiData.playlist || [],
          tags: aiData.LLMReply?.labels || []
        }
      }
    }
  } catch (error) {
    console.error('AI API调用失败:', error)
    // 降级到本地逻辑
    return generateLocalResponse(userMessage)
  }
}
const generateLocalResponse = (userMessage) => {
  let matchedKeyword = '精选'
  let matchedTags = []
  for (const [keyword, tags] of Object.entries(keywordToTags)) {
    if (userMessage.includes(keyword)) {
      matchedKeyword = keyword
      matchedTags = tags
      break
    }
  }
  let filteredSongs = allSongs.value
  if (matchedTags.length > 0) {
    filteredSongs = allSongs.value.filter(song => {
      return song.labels?.some(label => {
        const labelStr = label.toString()
        return matchedTags.some(tag => labelStr === tag)
      })
    })
  }
  if (filteredSongs.length === 0) {
    filteredSongs = [...allSongs.value]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
  } else {
    filteredSongs = [...filteredSongs]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
  }
  const totalDuration = filteredSongs.reduce((sum, song) => sum + (song.duration || 0), 0)
  return {
    content: `根据"${userMessage}"为你推荐（标签: ${matchedTags.join(', ') || '随机'}）：`,
    playlist: {
      id: Date.now(),
      name: `${matchedKeyword}歌单`,
      description: `适合${matchedKeyword}场景的音乐合集`,
      songCount: filteredSongs.length,
      duration: totalDuration,
      songs: filteredSongs,
      tags: matchedTags
    }
  }
}

// 推荐板块相关方法
const refreshPlaylists = () => {
  recommendedPlaylists.value = getRecommendedPlaylists()
}

const playAllRecommendedSongs = () => {
  if (recommendedSongs.value.length > 0) {
    musicStore.playSong(recommendedSongs.value[0], recommendedSongs.value)
  }
}

const playSong = (song) => {
  musicStore.playSong(song)
}

const gotoPlaylist = (playlistId) => {
  router.push(`/playlist/${playlistId}`)
}

// 数据获取函数（保持不变）
const getRecommendedPlaylists = () => {
  if (allPlaylists.value.length === 0) return []

  return [...allPlaylists.value]
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 4)
      .map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        cover: playlist.coverUrl,
        songCount: playlist.itemCount || playlist.items?.length || 0,
        playCount: playlist.playCount || 0,
        duration: playlist.items?.reduce((sum, item) => sum + (item.music?.duration || 0), 0) || 0,
        creator: '系统推荐',
        tags: playlist.items?.[0]?.music?.labels || []
      }))
}

const getRecommendedSongs = () => {
  if (allSongs.value.length === 0) return []

  return [...allSongs.value]
      .sort((a, b) => {
        const scoreA = (a.playCount || 0) + (a.likeCount || 0)
        const scoreB = (b.playCount || 0) + (b.likeCount || 0)
        return scoreB - scoreA
      })
      .slice(0, 8)
      .map(song => ({
        ...song,
        title: song.title || song.name,
        singer: song.singer || song.artist
      }))
}

const getPopularPlaylists = () => {
  if (allPlaylists.value.length === 0) return []

  return [...allPlaylists.value]
      .sort((a, b) => {
        const playDiff = (b.playCount || 0) - (a.playCount || 0)
        if (playDiff !== 0) return playDiff
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
      .slice(0, 4)
      .map(playlist => ({
        ...playlist,
        songCount: playlist.itemCount || playlist.items?.length || 0,
        creator: '音乐爱好者'
      }))
}

const getNewSongs = () => {
  if (allSongs.value.length === 0) return []

  return [...allSongs.value]
      .sort((a, b) => b.id - a.id)
      .slice(0, 6)
      .map(song => ({
        ...song,
        title: song.title || song.name,
        singer: song.singer || song.artist,
        publishTime: formatPublishTime(song.id)
      }))
}

const formatPublishTime = (id) => {
  const hoursAgo = id % 24
  if (hoursAgo < 1) return '刚刚'
  else if (hoursAgo < 24) return `${hoursAgo}小时前`
  else return `${Math.floor(hoursAgo / 24)}天前`
}


// 跳转到临时歌单详情页
const goToGeneratedPlaylist = () => {
  if (!generatedPlaylist.value) return

  // 将歌单数据编码为URL参数
  const playlistData = encodeURIComponent(JSON.stringify({
    ...generatedPlaylist.value,
    // 确保有必要的字段
    id: generatedPlaylist.value.id || Date.now(),
    name: generatedPlaylist.value.name || 'AI推荐歌单',
    description: generatedPlaylist.value.description || '魔法师精心调制的专属歌单',
    songCount: generatedPlaylist.value.songCount || generatedPlaylist.value.songs?.length || 0,
    duration: generatedPlaylist.value.duration || 0,
    songs: generatedPlaylist.value.songs || [],
    tags: generatedPlaylist.value.tags || []
  }))

  // 跳转到临时歌单详情页
  router.push({
    path: '/temp-playlist',
    query: { playlistData }
  })
}

// 初始化
onMounted(async () => {
  if (musicStore.allMusics.length === 0) {
    await musicStore.fetchAllMusic()
  }
  if (musicStore.allPlaylists.length === 0) {
    await musicStore.fetchAllPlaylists()
  }
  if (!musicStore.userInfo) {
    await musicStore.userLoginAction()
  }

  recommendedPlaylists.value = getRecommendedPlaylists()
  recommendedSongs.value = getRecommendedSongs()
  popularPlaylists.value = getPopularPlaylists()
  newSongs.value = getNewSongs()
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  position: relative;
}

/* 魔法师场景布局 */
.wizard-scene {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  gap: 10px;
}

/* 柜子容器 */
.cabinet-container {
  width: 600px;
  top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin: 0 -20px;
}

.cabinet-img {
  width: 200%;
  height: auto;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

/* 袋子容器 */
.bags-container {
  position: absolute;
  top: 100px;
  width: 400px;
  display: flex;
  flex-direction: column;
}

.bag-label {
  text-align: center;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 10px;
  font-size: 24px;
  left: -2px;
}

.bags-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.bag-item {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.bag-item:hover {
  transform: translateY(-5px);
}

.bag-item.selected {
  transform: translateY(-8px) scale(1.05);
  filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.9));
}

.bag-img {
  width: 120%;
  height: auto;
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
}

.bag-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.bag-text {
  color: #fff;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
}

/* 中间场景 */
.center-scene {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin: 0 10px;
}

/* 魔法师头顶的歌单气泡 */
.playlist-bubble {
  position: fixed;
  top: 100px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border: 2px solid var(--primary-color);
  min-width: 300px;
  z-index: 10;
  animation: float 3s ease-in-out infinite;
}

/* 点击提示文字 */
.click-hint {
  color: var(--primary-color);
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
  display: block;
  transition: opacity 0.3s ease;
}
.playlist-bubble:hover .click-hint {
  opacity: 1;
}
/* 歌单气泡悬停效果 */
.playlist-bubble {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}
.playlist-bubble:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}
.playlist-bubble:hover::after {
  content: '查看详情';
  position: absolute;
  top: -10px;
  right: -10px;
  background: var(--primary-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
/* 防止按钮点击事件冒泡 */
.playlist-actions {
  pointer-events: auto;
}
.playlist-actions button {
  pointer-events: auto;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.playlist-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.playlist-cover {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.cover-placeholder {
  animation: spin 20s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.playlist-details {
  flex: 1;
}

.playlist-details h3 {
  margin: 0 0 5px 0;
  color: var(--text-primary);
  font-size: 16px;
}

.playlist-details p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.playlist-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.play-btn, .save-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.play-btn {
  background: var(--primary-color);
  color: white;
}

.save-btn {
  background: var(--secondary-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.play-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.save-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* 魔法师区域 */
.wizard-area {
  position: relative;
  top: 200px;
  margin-bottom: -50px;
  z-index: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wizard-img {
  width: 250px;
  height: auto;
  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.4));
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 鼠标悬停时的魔法师效果 */
.wizard-area:hover .wizard-img {
  transform: scale(1.05) translateY(-5px); /*稍微放大并上浮*/
  /* 发光效果 */
  filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.6));
}

/* 悬浮提示文字 (替代原来的按钮) */
.wizard-hint {
  position: absolute;
  top: 50%;
  left: 100%; /* 显示在魔法师右侧 */
  transform: translate(-20px, -50%); /* 初始状态稍微靠左，配合透明度做进场动画 */
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0; /* 默认隐藏 */
  pointer-events: none; /* 不干扰点击 */
  transition: all 0.3s ease;

  /* 添加一个小三角指向左边 */
  border: 1px solid rgba(255,255,255,0.2);
}

/* 提示气泡的小三角 */
.wizard-hint::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid rgba(0, 0, 0, 0.7);
}

/* 鼠标悬停时显示提示 */
.wizard-area:hover .wizard-hint {
  opacity: 1;
  transform: translate(10px, -50%); /* 向右移动并显示 */
}



/* 桌子区域 */
.table-area {
  position: relative;
  top: 200px;
  margin-top: -30px;
  z-index: 2;
}

.table-img {
  width: 400px;
  height: auto;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

.cauldron-container {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: block;
  width: auto;
  height: auto;
  z-index: 5;
}

.cauldron-img {
  width: 150px;
  height: auto;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.4));
  animation: bubble 2s ease-in-out infinite;
}

.mix-btn {
  overflow: hidden;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 20px;
  z-index: 5;
  white-space: nowrap;
}

.mix-btn:hover:not(:disabled) {
  transform: translateX(-50%) translateY(-3px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
}

.mix-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.mix-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.mix-btn:hover:not(:disabled)::before {
  left: 100%;
}

.falling-text {
  position: absolute;
  left: 50%;
  top: -50px; /* 起始位置在坩埚上方 */
  transform: translateX(-50%); /* 水平居中 */

  color: #fff;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  pointer-events: none; /* 必须加，否则鼠标点太快会点到文字上 */
  z-index: 20;
  white-space: nowrap;

  /* 执行动画：总时长1秒 */
  animation: dropIn 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
}

/* 定义掉落动画 Keyframes */
@keyframes dropIn {
  0% {
    opacity: 0;
    top: -80px;
    transform: translateX(-50%) scale(1.5); /* 开始时放大 */
  }
  20% {
    opacity: 1; /* 迅速显示 */
  }
  60% {
    top: 30px; /* 到达坩埚口 */
    transform: translateX(-50%) scale(1);
  }
  100% {
    top: 60px; /* 沉入坩埚内部 */
    opacity: 0; /* 消失 */
    transform: translateX(-50%) scale(0.5); /* 缩小 */
  }
}

/* AI对话输入框 */
.chat-input-container {
  position: absolute;
  bottom: -300px;
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 2px solid var(--primary-color);
  z-index: 10;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.chat-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.send-btn {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-prompts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prompts-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.prompt-bubble {
  padding: 8px 12px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.prompt-bubble:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.prompt-bubble:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}



/* 推荐板块包装器 */
.recommendations-wrapper {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  margin: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .wizard-scene {
    flex-direction: column;
    align-items: center;
    gap: 40px;
  }

  .cabinet-container {
    width: 250px;
  }

  .bags-container {
    top: 50px;
  }

  .left-cabinet, .right-cabinet {
    order: 2;
  }

  .center-scene {
    order: 1;
    margin: 0;
  }
}

@media (max-width: 768px) {
  .wizard-scene {
    padding: 10px;
  }

  .cabinet-container {
    width: 600px;
  }

  .bags-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .bag-text {
    font-size: 12px;
  }

  .wizard-img {
    width: 180px;
  }

  .table-img {
    width: 300px;
  }

  .cauldron-img {
    width: 90px;
  }

  .chat-input-container {
    width: 300px;
    bottom: -120px;
  }

  .prompts-grid {
    grid-template-columns: 1fr;
  }

  .playlist-bubble {
    min-width: 250px;
    top: -80px;
  }

  .playlist-info {
    flex-direction: column;
    text-align: center;
  }

  .playlist-actions {
    flex-direction: row;
    justify-content: center;
    width: 100%;
  }
}
</style>
