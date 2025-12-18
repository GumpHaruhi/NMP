<template>
  <div class="home-page">
    <!-- 主页主要内容区域 -->
    <div class="main">
      <!-- 左侧推荐组件 -->
      <LeftRecommendations 
        @generate="handleGenerate"
        @toggle-genre="toggleGenre"
        @toggle-tag="toggleTag"
      />

      <!-- 中间内容组件 -->
      <CenterContent 
        :has-generated-content="hasGeneratedContent"
        :generated-songs="generatedSongs"
        :generated-playlists="generatedPlaylists"
        :ai-generated-playlist="aiGeneratedPlaylist"
        :selected-genres="selectedGenres"
        :selected-tags="selectedTags"
        :ai-generating="aiGenerating"
        @refresh="refreshContent"
        @goto-playlist="gotoPlaylist"
        @play-all-generated="playAllGeneratedSongs"
        @play-song="playSong"
        @play-ai-playlist="playGeneratedPlaylist"
        @save-ai-playlist="openSaveAIPlaylistModal"
      />

      <!-- 右侧AI助手组件 -->
      <RightAIAssistant 
        :loading-ai="loadingAI"
        @send-message="sendMessage"
        @use-ai-playlist="useAIPlaylist"
        @use-quick-prompt="useQuickPrompt"
      />
    </div>

    <!-- AI歌单保存模态框组件 -->
    <SaveAIPlaylistModal
      :visible="showSaveAIPlaylistModal"
      :loading="savingAIPlaylist"
      :default-name="aiPlaylistData.name"
      :default-description="aiPlaylistData.description"
      @save="saveAIPlaylist"
      @close="closeSaveAIPlaylistModal"
    />

    <!-- 推荐板块组件 -->
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

    <!-- 底部音乐播放栏组件 -->
    <BottomPlayerBar />

    <!-- 页脚组件 -->
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMusicStore } from '@/stores/musicStore'

// 导入组件
import LeftRecommendations from '@/components/LeftRecommendations.vue'
import CenterContent from '@/components/CenterContent.vue'
import RightAIAssistant from '@/components/RightAIAssistant.vue'
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
const hasGeneratedContent = ref(false)
const generatedSongs = ref([])
const generatedPlaylists = ref([])
const aiGeneratedPlaylist = ref(null)
const recommendedPlaylists = ref([])
const recommendedSongs = ref([])
const popularPlaylists = ref([])
const newSongs = ref([])
const isLoading = ref(false)
const aiGenerating = ref(false)

// AI聊天相关
const chatHistory = ref([])
const userInput = ref('')
const showSaveAIPlaylistModal = ref(false)
const savingAIPlaylist = ref(false)
const aiPlaylistData = reactive({
  name: '',
  description: ''
})

// 计算属性
const allSongs = computed(() => musicStore.allMusics || [])
const allPlaylists = computed(() => musicStore.allPlaylists || [])

// 关键字到标签的映射
const keywordToTags = {
  '学习': ['classical', 'jazz'],
  '运动': ['rock', 'hiphop'],
  '睡觉': ['classical'],
  '放松': ['jazz'],
  '开车': ['pop'],
  '雨天': ['jazz'],
  '派对': ['pop', 'electronic'],
  '早晨': ['pop'],
  '工作': ['work', 'focus'],
  '健身': ['rock'],
  '旅行': ['jazz', 'pop'],
  '浪漫': ['pop'],
  '怀旧': ['jazz', 'classical']
}

// 左侧推荐事件处理
const handleGenerate = async () => {
  try {
    hasGeneratedContent.value = true
    generatedSongs.value = []
    generatedPlaylists.value = []
    aiGeneratedPlaylist.value = null

    // 如果选择了标签，可以调用AI
    if (selectedTags.value.length > 0) {
      const message = `我想要${selectedTags.value.join('、')}类型的音乐`
      const aiResponse = await generateAIResponse(message)
      if (aiResponse.playlist) {
        aiGeneratedPlaylist.value = aiResponse.playlist
      }
    }

    // 生成歌曲推荐
    if (selectedGenres.value.length > 0) {
      generatedSongs.value = await generateSongs()
    }

     // 如果都没有选择，随机推荐
    if (selectedGenres.value.length === 0 && selectedTags.value.length === 0) {
      generatedSongs.value = [...allSongs.value]
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
      generatedPlaylists.value = [...allPlaylists.value]
          .sort(() => Math.random() - 0.5)
          .slice(0, 4)
    }

  } catch (error) {
    console.error('生成内容失败:', error)
    ElMessage.error('生成内容失败')
  }
}

const toggleGenre = (genreId) => {
  const index = selectedGenres.value.indexOf(genreId)
  if (index === -1) {
    selectedGenres.value.push(genreId)
  } else {
    selectedGenres.value.splice(index, 1)
  }
}

const toggleTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// AI助手事件处理
const sendMessage = async (message) => {
  try {
    loadingAI.value = true
    aiGenerating.value = true
    
    // 调用AI响应
    const aiResponse = await generateAIResponse(message)
    
    // 如果有生成的歌单，设置到中间区域
    if (aiResponse.playlist) {
      aiGeneratedPlaylist.value = aiResponse.playlist
      hasGeneratedContent.value = true
      // 清空其他内容
      generatedSongs.value = []
      generatedPlaylists.value = []
    }
  } catch (err) {
    console.error('AI对话失败:', err)
    ElMessage.error('AI对话失败')
  } finally {
    loadingAI.value = false
    aiGenerating.value = false
  }
}

const useAIPlaylist = (playlist) => {
  aiGeneratedPlaylist.value = playlist
  hasGeneratedContent.value = true
  generatedSongs.value = []
  generatedPlaylists.value = []

  // 可以直接播放AI推荐歌单
  if (playlist.songs && playlist.songs.length > 0) {
    musicStore.playSong(playlist.songs[0], playlist.songs)
  }
}

const useQuickPrompt = (prompt) => {
  sendMessage(prompt)
}

// 中间内容事件处理
const refreshContent = () => {
  handleGenerate()
}

const playAllGeneratedSongs = () => {
  if (generatedSongs.value.length > 0) {
    musicStore.playSong(generatedSongs.value[0], generatedSongs.value)
  }
}

const playGeneratedPlaylist = (playlist) => {
  if (playlist.songs && playlist.songs.length > 0) {
    musicStore.playSong(playlist.songs[0], playlist.songs)
  }
}

// 推荐板块事件处理
const refreshPlaylists = () => {
  recommendedPlaylists.value = getRecommendedPlaylists()
}

const playAllRecommendedSongs = () => {
  if (recommendedSongs.value.length > 0) {
    musicStore.playSong(recommendedSongs.value[0], recommendedSongs.value)
  }
}

// 通用事件处理
const playSong = (song) => {
  musicStore.playSong(song)
}

const gotoPlaylist = (playlistId) => {
  router.push(`/playlist/${playlistId}`)
}

// AI歌单保存相关
const openSaveAIPlaylistModal = () => {
  if (!aiGeneratedPlaylist.value) return
  
  aiPlaylistData.name = `AI推荐 - ${new Date().toLocaleDateString()}`
  aiPlaylistData.description = aiGeneratedPlaylist.value.description || 'AI智能推荐的歌单'
  
  showSaveAIPlaylistModal.value = true
}

const closeSaveAIPlaylistModal = () => {
  showSaveAIPlaylistModal.value = false
}

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
        musicStore.clearAIChatHistory()
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

// 工具函数
const generateAIResponse = async (userMessage) => {
  console.log('Calling backend AI API for:', userMessage)
  
  try {
    // 调用后端的AI推荐API
    const response = await musicStore.getAIRecommendation(userMessage)
    
    if (response.code === 200) {
      const aiData = response.data
      return {
        content: aiData.LLMReply?.content || `根据"${userMessage}"为你推荐：`,
        playlist: {
          id: Date.now(),
          name: `AI推荐歌单`,
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
  // 1. 找到匹配的关键词和对应的标签
  let matchedKeyword = '精选'
  let matchedTags = []

  for (const [keyword, tags] of Object.entries(keywordToTags)) {
    if (userMessage.includes(keyword)) {
      matchedKeyword = keyword
      matchedTags = tags
      break
    }
  }

  // 2. 使用标签过滤歌曲
  let filteredSongs = allSongs.value

  if (matchedTags.length > 0) {
    filteredSongs = allSongs.value.filter(song => {
      return song.labels?.some(label => {
        const labelStr = label.toString().toLowerCase()
        return matchedTags.some(tag =>
            labelStr.includes(tag.toLowerCase())
        )
      })
    })
  }

  // 3. 如果没有匹配的歌曲，使用随机推荐
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

const generateSongs = async () => {
  try {
    if (selectedGenres.value.length === 0) return []

    // 使用store搜索
    const res = await musicStore.searchMusicByLabels(selectedGenres.value)
    if (res.code === 200 && res.data.length > 0) {
      return res.data.slice(0, 8)
    }

    // 本地过滤
    return allSongs.value.filter(song =>
        song.labels?.some(label => {
          const labelStr = label.toString().toLowerCase()
          return selectedGenres.value.some(selected =>
              labelStr.includes(selected.toLowerCase())
          )
        })
    ).slice(0, 8)

  } catch (error) {
    console.error('生成歌曲失败:', error)
    return allSongs.value.slice(0, 8)
  }
}

// 数据获取函数
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

// 初始化
onMounted(async () => {
  // 初始化store数据
  if (musicStore.allMusics.length === 0) {
    await musicStore.fetchAllMusic()
  }
  if (musicStore.allPlaylists.length === 0) {
    await musicStore.fetchAllPlaylists()
  }
  if (!musicStore.userInfo) {
    await musicStore.userLoginAction()
  }

  // 初始化推荐数据
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
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  overflow-x: hidden;
}

.main {
  display: grid;
  grid-template-columns: 350px 1fr 350px;
  gap: 24px;
  padding: 24px;
  flex: 1;
  margin: auto;
  width: 100%;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
}

@media (max-width: 768px) {
  .main {
    padding: 16px;
    gap: 16px;
  }

  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
}
</style>