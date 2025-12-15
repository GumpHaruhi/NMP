<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
<!--    <header class="home-header">-->
<!--      <div class="header-right">-->
<!--        <button class="avatar-btn" @click="gotoProfile">-->
<!--          <img v-if="userInfo?.avatar" :src="userInfo.avatar" :alt="userInfo.username" class="avatar-img"/>-->
<!--          <div v-else class="avatar-placeholder">{{ userInitials }}</div>-->
<!--        </button>-->
<!--      </div>-->
<!--    </header>-->

    <!-- 主页内容 -->
    <div class="main">
      <!-- 左侧：音乐类型泡泡 -->
      <div class="left-sidebar">
        <div class="section-header">
          <h2>🎵 音乐类型</h2>
<!--          <p class="section-description">点击泡泡选择类型</p>-->
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
              <span v-if="genre.count > 0" class="bubble-count">{{ genre.count }}</span>
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

      <!-- 中间：动态内容区域 -->
      <div class="center-content">
        <div class="content-container" :class="{ 'has-content': hasGeneratedContent }">
          <!-- 引导状态 -->
          <div v-if="!hasGeneratedContent" class="guide-state">
            <div class="guide-animation">
              <div class="floating-music-note">♪</div>
              <div class="floating-music-note">♫</div>
              <div class="floating-music-note">♬</div>
            </div>
            <h2 class="guide-title">发现你的音乐</h2>
            <p class="guide-text">
              {{ getGuideText() }}
            </p>
            <div class="guide-hints">
              <div class="hint-item">
                <div class="hint-icon">🎯</div>
                <span>点击左侧泡泡选择音乐类型</span>
              </div>
              <div class="hint-item">
                <div class="hint-icon">💭</div>
                <span>选择场景标签描述你的心情</span>
              </div>
              <div class="hint-item">
                <div class="hint-icon">🤖</div>
                <span>或直接告诉AI助手你的需求</span>
              </div>
            </div>
          </div>

          <!-- 生成的内容 -->
          <div v-else class="generated-content">
            <!-- 推荐歌单 -->
            <div v-if="generatedPlaylists.length > 0" class="content-section">
              <div class="section-header">
                <h3>🎧 为你推荐</h3>
                <button class="refresh-btn" @click="refreshContent">
                  <RefreshIcon class="refresh-icon" />
                  换一批
                </button>
              </div>
              <div class="playlists-grid animated-fade">
                <div
                    v-for="playlist in generatedPlaylists"
                    :key="playlist.id"
                    class="playlist-card"
                    @click="gotoPlaylist(playlist.id)"
                >
                  <div class="playlist-cover">
                    <div class="cover-gradient" :style="getGradientStyle(playlist)"></div>
                    <div class="cover-icon">🎵</div>
                  </div>
                  <div class="playlist-info">
                    <h4>{{ playlist.name }}</h4>
                    <p>{{ playlist.songCount || 0 }} 首歌曲 · {{ formatDuration(playlist.duration) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 推荐歌曲 -->
            <div v-if="generatedSongs.length > 0" class="content-section">
              <div class="section-header">
                <h3>🎵 精选歌曲</h3>
                <button class="play-all-btn" @click="playAllGeneratedSongs">
                  <PlayIcon class="btn-icon" />
                  播放全部
                </button>
              </div>
              <div class="songs-list">
                <SongItem
                    v-for="(song, index) in generatedSongs"
                    :key="song.id"
                    :song="song"
                    :track-order="index + 1"
                    @play="playSong(song)"
                />
              </div>
            </div>

            <!-- AI生成的歌单 -->
            <div v-if="aiGeneratedPlaylist" class="content-section">
              <div class="section-header">
                <h3>🤖 AI生成歌单</h3>
                <span class="ai-badge">AI</span>
              </div>
              <div class="ai-playlist-card">
                <div class="ai-playlist-header">
                  <div class="ai-playlist-cover">
                    <div class="ai-cover-animation">
                      <div class="pulse-ring"></div>
                      <div class="ai-cover-icon">🤖</div>
                    </div>
                  </div>
                  <div class="ai-playlist-info">
                    <h3>{{ aiGeneratedPlaylist.name }}</h3>
                    <p>{{ aiGeneratedPlaylist.description }}</p>
                    <div class="ai-playlist-stats">
                      <span>{{ aiGeneratedPlaylist.songCount }} 首歌曲</span>
                      <span>时长 {{ formatDuration(aiGeneratedPlaylist.duration) }}</span>
                    </div>
                    <button class="play-ai-btn" @click="playGeneratedPlaylist(aiGeneratedPlaylist)">
                      <PlayIcon class="play-icon" />
                      播放歌单
                    </button>
                  </div>
                </div>
                <div class="ai-playlist-songs">
                  <SongItem
                      v-for="(song, index) in aiGeneratedPlaylist.songs"
                      :key="song.id"
                      :song="song"
                      :track-order="index + 1"
                      @play="playSong(song)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：AI助手 -->
      <div class="right-sidebar">
        <div class="section-header">
          <h2>🤖 音乐助手</h2>
<!--          <p class="section-description">告诉我你的需求</p>-->
        </div>

        <div class="ai-assistant">
          <div class="ai-avatar">
            <div class="avatar-animation">
              <div class="ai-avatar-icon">🤖</div>
            </div>
          </div>

          <div class="ai-chat">
<!--            <div class="chat-history" ref="chatHistory">-->
<!--              <div-->
<!--                  v-for="(message, index) in chatHistory"-->
<!--                  :key="index"-->
<!--                  class="chat-message"-->
<!--                  :class="{ 'user': message.role === 'user', 'ai': message.role === 'ai' }"-->
<!--              >-->
<!--                <div class="message-content">-->
<!--                  {{ message.content }}-->
<!--                </div>-->
<!--                &lt;!&ndash; 显示AI生成的歌单预览 &ndash;&gt;-->
<!--                <div v-if="message.playlist" class="quick-playlist">-->
<!--                  <div class="quick-playlist-cover">-->
<!--                    <div class="quick-cover-icon">🎵</div>-->
<!--                  </div>-->
<!--                  <div class="quick-playlist-info">-->
<!--                    <h5>{{ message.playlist.name }}</h5>-->
<!--                    <button class="quick-play-btn" @click="useAIPlaylist(message.playlist)">-->
<!--                      使用-->
<!--                    </button>-->
<!--                  </div>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->

            <div>
              <div class="input-wrapper">
                <input
                    v-model="userInput"
                    type="text"
                    placeholder="例如：适合学习的轻音乐..."
                    class="chat-input"
                    @keyup.enter="sendMessage"
                    :disabled="loadingAI"
                />
                <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim() || loadingAI">
                  <SendIcon class="send-icon" />
                </button>
              </div>
            </div>

            <div class="quick-prompts">
              <div class="prompts-header">试试这样说：</div>
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
      </div>
    </div>

    <!-- 推荐歌单 -->
    <div class="recommend-main">
    <section class="recommended-playlists">
      <div class="section-header">
        <div class="header-left">
          <h2>📚 推荐歌单</h2>
          <p class="section-description">根据你的喜好精心挑选</p>
        </div>
        <button class="refresh-btn" @click="refreshPlaylists">
          <RefreshIcon class="refresh-icon" />
          换一批
        </button>
      </div>

      <div class="playlists-grid">
        <PlaylistCard
            v-for="playlist in recommendedPlaylists"
            :key="playlist.id"
            :playlist="playlist"
            @click="goToPlaylist(playlist.id)"
        />
      </div>
    </section>

    <!-- 推荐歌曲 -->
    <section class="recommended-songs">
      <div class="section-header">
        <div class="header-left">
          <h2>🎧 今日推荐歌曲</h2>
          <p class="section-description">发现你可能喜欢的新音乐</p>
        </div>
        <button class="play-all-btn" @click="playAllRecommendedSongs">
          <PlayIcon class="btn-icon" />
          播放全部
        </button>
      </div>

      <div class="songs-list">
        <SongItem
            v-for="(song, index) in recommendedSongs"
            :key="song.id"
            :song="song"
            :track-order="index + 1"
            @play="playSong(song)"
        />
      </div>
    </section>

    <!-- 热门歌单 -->
    <section class="popular-playlists">
      <div class="section-header">
        <h2>🔥 热门歌单</h2>
        <p class="section-description">大家都在听什么</p>
      </div>

      <div class="playlists-grid">
        <PlaylistCard
            v-for="playlist in popularPlaylists"
            :key="playlist.id"
            :playlist="playlist"
            @click="goToPlaylist(playlist.id)"
        />
      </div>
    </section>

    <!-- 新歌速递 -->
    <section class="new-songs">
      <div class="section-header">
        <h2>🎶 新歌速递</h2>
        <p class="section-description">最新发布的音乐</p>
      </div>

      <div class="songs-list">
        <SongItem
            v-for="(song, index) in newSongs"
            :key="song.id"
            :song="song"
            :track-order="index + 1"
            @play="playSong(song)"
        />
      </div>
    </section>
    </div>

  <!-- 底部音乐播放栏组件 -->
    <BottomPlayerBar />

    <footer class="home-footer">
      <div class="footer-content">
        <div class="footer-left">
          <h3 class="app-title">音乐播放器</h3>
          <p class="app-tagline">发现属于你的音乐世界</p>
        </div>
        <div class="footer-center">
          <div class="footer-links">
            <a href="#" class="footer-link">关于我们</a>
            <a href="#" class="footer-link">帮助中心</a>
            <a href="#" class="footer-link">隐私政策</a>
            <a href="#" class="footer-link">服务条款</a>
          </div>
          <p class="copyright">© 2023 音乐播放器 版权所有</p>
        </div>
        <div class="footer-right">
          <a href="#" class="social-icon">📱</a>
          <a href="#" class="social-icon">🐦</a>
          <a href="#" class="social-icon">📘</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import {computed, nextTick, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useMusicStore} from '@/stores/musicStore'
import BottomPlayerBar from '@/components/BottomPlayerBar.vue'
import SongItem from '@/components/SongItem.vue'
import PlaylistCard from '@/components/PlaylistCard.vue'

// 图标组件
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import SendIcon from '@/assets/icons/SendIcon.vue'
import RefreshIcon from '@/assets/icons/RefreshIcon.vue'

// 路由和store
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

// AI聊天相关
const chatHistory = ref([])
const userInput = ref('')
const chatHistoryRef = ref(null)

// 计算属性
const userInfo = computed(() => musicStore.userInfo || { username: '音乐爱好者' })
const userInitials = computed(() => {
  const username = userInfo.value.username || '用户'
  return username.charAt(0).toUpperCase()
})

const allSongs = computed(() => musicStore.allMusics || [])
const allPlaylists = computed(() => musicStore.allPlaylists || [])

const hasSelection = computed(() => {
  return selectedGenres.value.length > 0 || selectedTags.value.length > 0
})

// 音乐类型数据
const musicGenres = ref([
  { id: 'pop', name: '流行', icon: '🎤', count: 0 },
  { id: 'rock', name: '摇滚', icon: '🎸', count: 0 },
  { id: 'jazz', name: '爵士', icon: '🎷', count: 0 },
  { id: 'classical', name: '古典', icon: '🎻', count: 0 },
  { id: 'hiphop', name: '嘻哈', icon: '🎧', count: 0 },
  { id: 'electronic', name: '电子', icon: '⚡', count: 0 },
  { id: 'r&b', name: 'R&B', icon: '🎹', count: 0 }
])

// 筛选标签
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

// 引导文本
const getGuideText = () => {
  if (selectedGenres.value.length === 0 && selectedTags.value.length === 0) {
    return '选择音乐类型或场景标签，让我为你推荐合适的音乐'
  } else if (selectedGenres.value.length > 0) {
    return `已选择 ${selectedGenres.value.length} 种音乐类型，点击"生成"开始推荐`
  } else {
    return `已选择 ${selectedTags.value.length} 个场景标签，点击"生成"开始推荐`
  }
}

// 生成渐变背景
const getGradientStyle = (playlist) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  ]
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)]
  return {
    background: randomGradient
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
}

// 切换标签
const toggleTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// 生成内容
const generateContent = async () => {
  try {
    hasGeneratedContent.value = true
    generatedSongs.value = []
    generatedPlaylists.value = []
    aiGeneratedPlaylist.value = null

    // 生成歌曲推荐
    if (selectedGenres.value.length > 0) {
      generatedSongs.value = await generateSongs()
    }

    // 生成歌单推荐
    if (selectedTags.value.length > 0) {
      generatedPlaylists.value = await generatePlaylists()
    }

    // 如果都没有选择，随机推荐
    if (!hasSelection.value) {
      generatedSongs.value = [...allSongs.value]
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
      generatedPlaylists.value = [...allPlaylists.value]
          .sort(() => Math.random() - 0.5)
          .slice(0, 4)
    }

  } catch (error) {
    console.error('生成内容失败:', error)
  }
}

// 生成歌曲
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

// 生成歌单
const generatePlaylists = async () => {
  if (selectedTags.value.length === 0) return []

  // 根据标签过滤歌单
  return allPlaylists.value.filter(playlist => {
    // 检查歌单名称或描述是否包含标签
    const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase()
    return selectedTags.value.some(tag =>
        playlistText.includes(tag.toLowerCase())
    )
  }).slice(0, 4)
}

// 刷新内容
const refreshContent = () => {
  generateContent()
}

// AI功能
const sendMessage = async () => {
  console.log('sendMessage called')
  console.log('Current chatHistory:', chatHistory.value)
  console.log('Type of chatHistory.value:', typeof chatHistory.value)

  if (!userInput.value.trim() || loadingAI.value) return

  const userMessage = userInput.value.trim()
  console.log('Processing message:', userMessage)

  // 方法1：确保是数组再操作
  let currentHistory = chatHistory.value
  if (!currentHistory || !Array.isArray(currentHistory)) {
    console.warn('chatHistory is not an array, resetting to empty array')
    currentHistory = []
  }

  // 添加用户消息
  const updatedHistory = [...currentHistory, {
    role: 'user',
    content: userMessage
  }]

  // 更新响应式数据
  chatHistory.value = updatedHistory
  userInput.value = ''

  try {
    loadingAI.value = true
    console.log('Loading started, waiting 1.5s...')

    await new Promise(resolve => setTimeout(resolve, 1500))

    const aiResponse = generateAIResponse(userMessage)
    console.log('AI response generated:', aiResponse)

    // 添加AI响应
    chatHistory.value = [...updatedHistory, aiResponse]

    // 如果有生成的歌单，设置到中间区域
    if (aiResponse.playlist) {
      aiGeneratedPlaylist.value = aiResponse.playlist
      hasGeneratedContent.value = true
      // 清空其他内容
      generatedSongs.value = []
      generatedPlaylists.value = []
      console.log('Playlist set:', aiResponse.playlist)
    }

    await nextTick(() => {
      if (chatHistoryRef.value) {
        chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
        console.log('Chat history scrolled')
      }
    })
  } catch (err) {
    console.error('AI对话失败:', err)
    console.error('Error details:', err.message, err.stack)

    // 确保这里也是安全的
    const currentHistory = Array.isArray(chatHistory.value) ? chatHistory.value : []
    chatHistory.value = [...currentHistory, {
      role: 'ai',
      content: '抱歉，生成歌单时出现错误，请稍后重试。'
    }]
  } finally {
    loadingAI.value = false
    console.log('Loading completed')
  }
}

// 使用AI生成的歌单
const useAIPlaylist = (playlist) => {
  aiGeneratedPlaylist.value = playlist
  hasGeneratedContent.value = true
  generatedSongs.value = []
  generatedPlaylists.value = []
}

// 播放相关
const playAllGeneratedSongs = () => {
  if (generatedSongs.value.length > 0) {
    musicStore.playSong(generatedSongs.value[0], generatedSongs.value)
  }
}

// 工具函数
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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

const generateAIResponse = (userMessage) => {
  console.log('Generating AI response for:', userMessage)

  const allSongsVal = allSongs.value || []
  console.log('Total songs available:', allSongsVal.length)
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
      // 检查歌曲标签是否匹配
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
    // 随机选择5首
    filteredSongs = [...filteredSongs]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
  }

  const totalDuration = filteredSongs.reduce((sum, song) => sum + (song.duration || 0), 0)

  return {
    role: 'ai',
    content: `根据"${userMessage}"为你推荐（标签: ${matchedTags.join(', ') || '随机'}）：`,
    playlist: {
      id: Date.now(),
      name: `${matchedKeyword}歌单`,
      description: `适合${matchedKeyword}场景的音乐合集`,
      songCount: filteredSongs.length,
      duration: totalDuration,
      songs: filteredSongs,
      tags: matchedTags  // 新增：记录使用的标签
    }
  }
}

// 其他方法保持不变...
const useQuickPrompt = (prompt) => {
  userInput.value = prompt
}

const gotoProfile = () => {
  router.push('/profile')
}

const playSong = (song) => {
  musicStore.playSong(song)
}

const playGeneratedPlaylist = (playlist) => {
  if (playlist.songs && playlist.songs.length > 0) {
    musicStore.playSong(playlist.songs[0], playlist.songs)
  }
}

// 获取推荐歌单（使用现有数据，不调用API）
const getRecommendedPlaylists = () => {
  if (allPlaylists.value.length === 0) return []

  // 基于播放次数排序，取前4个作为推荐
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

// 获取推荐歌曲（使用现有数据）
const getRecommendedSongs = () => {
  if (allSongs.value.length === 0) return []

  // 基于播放次数和喜欢次数排序
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

// 获取热门歌单（使用现有数据）
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

// 获取新歌（使用现有数据）
const getNewSongs = () => {
  if (allSongs.value.length === 0) return []

  // 假设ID越大越新
  return [...allSongs.value]
      .sort((a, b) => b.id - a.id)
      .slice(0, 6)
      .map(song => ({
        ...song,
        title: song.title || song.name,
        singer: song.singer || song.artist,
        // 添加发布时间（根据ID模拟）
        publishTime: formatPublishTime(song.id)
      }))
}

// 根据ID模拟发布时间
const formatPublishTime = (id) => {
  const hoursAgo = id % 24
  if (hoursAgo < 1) return '刚刚'
  else if (hoursAgo < 24) return `${hoursAgo}小时前`
  else return `${Math.floor(hoursAgo / 24)}天前`
}

// 刷新推荐歌单
const refreshPlaylists = () => {
  recommendedPlaylists.value = getRecommendedPlaylists()
}

// 播放所有推荐歌曲
const playAllRecommendedSongs = () => {
  if (recommendedSongs.value.length > 0) {
    musicStore.playSong(recommendedSongs.value[0], recommendedSongs.value)
  }
}

// 设置推荐数据（使用本地计算，不调用API）
recommendedPlaylists.value = getRecommendedPlaylists()
recommendedSongs.value = getRecommendedSongs()
popularPlaylists.value = getPopularPlaylists()
newSongs.value = getNewSongs()

const gotoPlaylist = (playlistId) => {
  router.push(`/playlist/${playlistId}`)
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

  // 初始化AI问候
  chatHistory.value.push({
    role: 'ai',
    content: '你好！我是你的音乐助手。告诉我你的心情或需求，我可以为你推荐音乐或生成歌单。'
  })
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

.recommend-main{
  padding:24px;
  flex:1;
  width: 100%;
  margin: auto;
}

/* 左侧边栏 */
.left-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

/* 音乐类型泡泡 */
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

/* 中间内容区域 */
.center-content {
  min-height: calc(100vh - 250px);
  overflow: hidden;
}

.content-container {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  height: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.5s ease;
  overflow-y: auto;
}

/* 移除滚动条样式 */
.content-container::-webkit-scrollbar {
  display: none;
}

.content-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 引导状态 */
.guide-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  gap: 32px;
}

.guide-animation {
  position: relative;
  width: 200px;
  height: 200px;
}

.floating-music-note {
  position: absolute;
  font-size: 40px;
  animation: float 6s ease-in-out infinite;
  color: var(--primary-color);
}

.floating-music-note:nth-child(1) {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.floating-music-note:nth-child(2) {
  top: 40%;
  left: 60%;
  animation-delay: 2s;
}

.floating-music-note:nth-child(3) {
  top: 70%;
  left: 30%;
  animation-delay: 4s;
}

.guide-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.guide-text {
  font-size: 16px;
  color: var(--text-secondary);
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}

.guide-hints {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--secondary-color);
  border-radius: 12px;
  color: var(--text-primary);
  animation: slideIn 0.5s ease backwards;
}

.hint-item:nth-child(1) { animation-delay: 0.1s; }
.hint-item:nth-child(2) { animation-delay: 0.2s; }
.hint-item:nth-child(3) { animation-delay: 0.3s; }

.hint-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 生成的内容 */
.generated-content {
  animation: fadeIn 0.5s ease;
}

.content-section {
  margin-bottom: 40px;
}

.content-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.ai-badge {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* AI歌单卡片 */
.ai-playlist-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.ai-playlist-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.ai-playlist-cover {
  position: relative;
  width: 120px;
  height: 120px;
}

.ai-cover-animation {
  width: 100%;
  height: 100%;
  position: relative;
}

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid var(--primary-color);
  border-radius: 20px;
  animation: pulse 2s infinite;
}

.ai-cover-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
}

.ai-playlist-info h3 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 24px;
}

.ai-playlist-info p {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.ai-playlist-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.play-ai-btn {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.play-ai-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

/* 右侧AI助手 */
.right-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.ai-assistant {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-animation {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: float 3s ease-in-out infinite;
}

.ai-avatar-icon {
  font-size: 36px;
}

/* 聊天区域 */
.ai-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  padding: 16px;
  background: var(--secondary-color);
  border-radius: 16px;
  margin-bottom: 16px;
}

.chat-history::-webkit-scrollbar {
  display: none;
}

.chat-history {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.quick-playlist {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  margin-top: 8px;
  border: 1px solid var(--border-color);
}

.quick-playlist-cover {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-cover-icon {
  color: white;
  font-size: 20px;
}

.quick-playlist-info {
  flex: 1;
}

.quick-playlist-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.quick-play-btn {
  padding: 4px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.quick-play-btn:hover {
  background: var(--primary-hover);
}

/* 快速提示 */
.quick-prompts {
  margin-bottom: 16px;
}

.prompts-header {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
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
  border-radius: 12px;
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

/* 页脚 */
.home-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  padding: 24px;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left .app-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.footer-left .app-tagline {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

.footer-center {
  text-align: center;
}

.footer-links {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.3s;
}

.footer-link:hover {
  color: var(--primary-color);
}

.copyright {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.footer-right {
  display: flex;
  gap: 16px;
}

.social-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 18px;
  text-decoration: none;
  transition: all 0.3s;
}

.social-icon:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-3px);
}

/* 动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animated-fade {
  animation: fadeIn 0.5s ease;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .left-sidebar,
  .right-sidebar {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .main {
    padding: 16px;
    gap: 16px;
  }

  .genre-bubbles {
    grid-template-columns: repeat(3, 1fr);
  }

  .content-container,
  .left-sidebar,
  .right-sidebar {
    padding: 10px;
  }

  .ai-playlist-header {
    flex-direction: column;
  }

  .ai-playlist-cover {
    width: 100%;
    height: 120px;
  }

  /* 页脚响应式 */
  .footer-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .footer-left,
  .footer-right {
    width: 100%;
    justify-content: center;
  }

  .footer-links {
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
  }
}

/* AI聊天输入容器 - 调整为与现有设计更匹配 */
.chat-input-container {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.chat-input-container:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--primary-rgb), 0.2);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 8px 8px 8px 20px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
  transform: translateY(-1px);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 10px 0;
  color: var(--text-primary);
  background: transparent;
  min-width: 0;
  font-family: inherit;
  line-height: 1.5;
}

.chat-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.chat-input:focus::placeholder {
  opacity: 0.4;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 发送按钮 - 调整为与action-btn类似风格 */
.send-btn {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
}

/* 与action-btn一致的悬停效果 */
.send-btn::before {
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

.send-btn:hover:not(:disabled)::before {
  left: 100%;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.3);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(var(--primary-rgb), 0.2);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, var(--border-color), var(--border-color));
  box-shadow: none;
  transform: none !important;
}

.send-btn:disabled::before {
  display: none;
}

.send-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.send-btn:not(:disabled):hover .send-icon {
  transform: translateX(2px) scale(1.1);
}

/* 加载状态动画 - 与sparkle动画一致 */
.send-btn.loading .send-icon {
  animation: sparkle 2s infinite;
}

/* 快速提示样式优化 */
.quick-prompts {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

.prompts-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompts-header::before {
  content: '💡';
  font-size: 16px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.prompt-bubble {
  padding: 10px 14px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  line-height: 1.4;
}

.prompt-bubble:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
}

.prompt-bubble:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-input-container {
    padding: 16px;
    margin-top: 16px;
  }

  .input-wrapper {
    padding: 6px 6px 6px 16px;
  }

  .chat-input {
    font-size: 14px;
    padding: 8px 0;
  }

  .send-btn {
    width: 44px;
    height: 44px;
  }

  .prompts-grid {
    grid-template-columns: 1fr;
  }

  .prompt-bubble {
    padding: 12px 16px;
    font-size: 14px;
  }
}

/* 可选的字符计数器 */
.char-counter {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
  text-align: right;
  opacity: 0.7;
  transition: color 0.3s ease;
}

.char-counter.warning {
  color: #f59e0b;
}

.char-counter.error {
  color: #ef4444;
}

/* 微调现有快速提示的位置 */
.quick-prompts {
  margin-bottom: 20px;
}

/* 通用section样式 */
section {
  margin-bottom: 40px;
  animation: fadeIn 0.6s ease;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.section-header .header-left {
  flex: 1;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
}

/* 刷新按钮 */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

/* 播放全部按钮 */
.play-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--primary-color);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-all-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 歌单网格 */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 歌曲列表 */
.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .playlists-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .playlists-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .section-header .refresh-btn,
  .section-header .play-all-btn {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .playlists-grid {
    grid-template-columns: 1fr;
  }
}
</style>