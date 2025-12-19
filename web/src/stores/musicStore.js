import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
    getAllMusic,
    getAllPlaylists,
    getPlaylistDetail,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    searchByLabels,
    likeMusic,
    dislikeMusic,
    starMusic,
    userLogin,
    getLyrics,
    getCover,
    getAIRecommendation
} from '@/api'
import { getRecommendationFromAI } from '../api/realApi'
import { parseLRC } from '@/utils/lrcParser'
import AudioEngine from "@/utils/AudioEngine.js";

export const useMusicStore = defineStore('music', () => {
    // AI推荐相关
    const aiRecommendation = ref({
        reply: null,
        playlist: [],
        labels: []
    })
    const aiFavoritePlaylists = ref(new Set())
    const aiChatHistory = ref([])

    // 用户相关状态
    const currentSong = ref(null)
    const isPlaying = ref(false)
    const currentTime = ref(0)
    const duration = ref(0)
    const volume = ref(80)
    const playQueue = ref([])
    const currentIndex = ref(-1)
    const playMode = ref('sequential')
    const allMusics = ref([])
    const allPlaylists = ref([])
    const currentPlaylist = ref(null)
    const searchResults = ref([])
    const userInfo = ref(null)
    const likedSongs = ref(new Set())
    const starredSongs = ref(new Set())
    const currentLyrics = ref([])
    const currentLyricIndex = ref(-1)
    const lyricsLoading = ref(false)
    const audioError = ref(null)
    const isWaiting = ref(false)
    const isSeeking = ref(false)

    // 🆕 使用 AudioEngine 替代原生 audioElement
    const audioEngine = ref(null)

    // 加载状态管理
    const loading = ref({
        musics: false,
        playlists: false,
        playlistDetail: false,
        search: false,
        lyrics: false
    })

    // 计算属性
    const currentPlaylistSongs = computed(() => {
        return currentPlaylist.value?.items?.map(item => item.music) || []
    })

    const currentLyric = computed(() => {
        if (currentLyricIndex.value >= 0 && currentLyrics.value[currentLyricIndex.value]) {
            return currentLyrics.value[currentLyricIndex.value].text
        }
        return ''
    })

    const currentQueue = computed(() => {
        return playQueue.value.length > 0 ? playQueue.value : allMusics.value
    })

    const progress = computed(() => {
        return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    })

    const isLiked = computed(() => (songId) => likedSongs.value.has(songId))
    const isStarred = computed(() => (songId) => starredSongs.value.has(songId))

    const audioHealth = computed(() => {
        if (!audioEngine.value) return 'no-engine'
        return audioEngine.value.isInitialized ? 'ready' : 'loading'
    })

    // AI推荐相关计算属性
    const hasAIReply = computed(() => {
        return !!aiRecommendation.value.reply?.content
    })

    const hasAIPlaylist = computed(() => {
        return aiRecommendation.value.playlist.length > 0
    })

    const isAIFavorite = computed(() => (playlistId) => {
        return aiFavoritePlaylists.value.has(playlistId)
    })

    // 🆕 初始化 AudioEngine
    const initAudioEngine = async () => {
        if (!audioEngine.value) {
            audioEngine.value = new AudioEngine()

            // 绑定 AudioEngine 事件
            audioEngine.value.on('timeupdate', (time) => {
                currentTime.value = time
                updateCurrentLyricIndex(time)
            })

            audioEngine.value.on('durationchange', (dur) => {
                duration.value = dur
            })

            audioEngine.value.on('play', () => {
                isPlaying.value = true
                isWaiting.value = false
                audioError.value = null
            })

            audioEngine.value.on('pause', () => {
                isPlaying.value = false
            })

            audioEngine.value.on('ended', () => {
                console.log('播放结束，自动下一首')
                nextSong()
            })

            audioEngine.value.on('error', (error) => {
                console.error('音频播放错误:', error)
                audioError.value = error
                isPlaying.value = false
                isWaiting.value = false
            })

            // 设置初始音量
            audioEngine.value.setVolume(volume.value / 100)
        }
        return audioEngine.value
    }

    // 🆕 简化的播放函数 - 使用 AudioEngine
    const playSong = async (song, playlist = null) => {
        if (!song) return

        try {
            // 初始化 AudioEngine
            await initAudioEngine()

            // 更新状态
            currentSong.value = { ...song }
            isPlaying.value = true
            audioError.value = null

            // 设置播放队列
            if (playlist?.length > 0) {
                playQueue.value = playlist
            }

            // 加载音频
            const audioUrl = `/api/music/play/${song.id}`
            await audioEngine.value.load(audioUrl)

            // 开始播放
            await audioEngine.value.play()

            // 延迟加载歌词
            setTimeout(() => loadLyrics(song), 1000)

        } catch (error) {
            console.error('播放失败:', error)
            handlePlaybackError(error)
        }
    }

    // 🆕 播放控制方法 - 使用 AudioEngine
    const togglePlay = async () => {
        if (!audioEngine.value || !currentSong.value) {
            if (currentQueue.value.length > 0) {
                await playSong(currentQueue.value[0])
            }
            return
        }

        try {
            if (isPlaying.value) {
                audioEngine.value.pause()
            } else {
                await audioEngine.value.play()
            }
        } catch (error) {
            console.error('播放控制失败:', error)
            audioError.value = error
        }
    }

    const pauseSong = () => {
        if (audioEngine.value) {
            audioEngine.value.pause()
        }
    }

    const resumeSong = async () => {
        if (audioEngine.value && currentSong.value) {
            try {
                await audioEngine.value.play()
            } catch (error) {
                console.error('恢复播放失败:', error)
                throw error
            }
        }
    }

    const nextSong = () => {
        if (currentQueue.value.length === 0) return

        let nextIndex
        switch (playMode.value) {
            case 'random':
                nextIndex = Math.floor(Math.random() * currentQueue.value.length)
                break
            case 'loop':
                nextIndex = currentIndex.value
                break
            default:
                nextIndex = (currentIndex.value + 1) % currentQueue.value.length
        }

        if (currentQueue.value[nextIndex]) {
            playSong(currentQueue.value[nextIndex])
            currentIndex.value = nextIndex
        }
    }

    const prevSong = () => {
        if (currentQueue.value.length === 0) return

        let prevIndex
        switch (playMode.value) {
            case 'random':
                prevIndex = Math.floor(Math.random() * currentQueue.value.length)
                break
            case 'loop':
                prevIndex = currentIndex.value
                break
            default:
                prevIndex = (currentIndex.value - 1 + currentQueue.value.length) % currentQueue.value.length
        }

        if (currentQueue.value[prevIndex]) {
            playSong(currentQueue.value[prevIndex])
            currentIndex.value = prevIndex
        }
    }

    // 🆕 时间控制方法 - 使用 AudioEngine
    const seekTo = (time) => {
        if (!audioEngine.value || !currentSong.value) return

        try {
            const newTime = Math.max(0, Math.min(duration.value, time))
            currentTime.value = newTime
            isSeeking.value = true

            audioEngine.value.seek(newTime)

            updateCurrentLyricIndex(newTime)

            setTimeout(() => {
                isSeeking.value = false
            }, 100)
        } catch (error) {
            console.error('跳转时间失败:', error)
            audioError.value = error
        }
    }

    const setCurrentTime = (time) => {
        seekTo(time)
    }

    const setDuration = (time) => {
        duration.value = time
    }

    // 🆕 音量控制 - 使用 AudioEngine
    const setVolume = (value) => {
        const newVolume = Math.max(0, Math.min(100, value))
        volume.value = newVolume
        if (audioEngine.value) {
            audioEngine.value.setVolume(newVolume / 100)
        }
    }

    const setPlayMode = (mode) => {
        if (['sequential', 'loop', 'random'].includes(mode)) {
            playMode.value = mode
        }
    }

    // 错误处理
    const clearError = () => {
        audioError.value = null
    }

    const retryPlay = async () => {
        if (!currentSong.value) return

        try {
            clearError()
            isPlaying.value = false

            if (audioEngine.value) {
                // 重新加载当前歌曲
                await playSong(currentSong.value)
            }
        } catch (error) {
            console.error('重试播放失败:', error)
            audioError.value = error
        }
    }

    const handlePlaybackError = (error) => {
        console.error('播放错误:', error)
        audioError.value = error
        isPlaying.value = false

        // 播放失败时自动下一首
        setTimeout(() => {
            if (!isPlaying.value && currentQueue.value.length > 0) {
                console.log('播放失败，尝试下一首')
                nextSong()
            }
        }, 2000)
    }

    const loadLyrics = async (song) => {
        if (!song?.id) {
            currentLyrics.value = []
            currentLyricIndex.value = -1
            lyricsLoading.value = false
            return
        }

        lyricsLoading.value = true
        currentLyrics.value = []
        currentLyricIndex.value = -1

        try {
            const response = await getLyrics(song.id)
            console.log('歌词API响应:', response)

            // 🆕 更灵活的响应格式判断
            let lrcText = null

            // 情况1: 标准API响应格式 {code: 200, data: "歌词内容"}
            if (response && typeof response === 'object' && response.code === 200) {
                lrcText = response.data
            }
            // 情况2: 直接返回歌词字符串
            else if (typeof response === 'string') {
                lrcText = response
            }
            // 情况3: 其他可能的响应格式
            else if (response?.data) {
                lrcText = response.data
            }
            // 情况4: 响应本身就是歌词内容
            else if (response && typeof response === 'string') {
                lrcText = response
            }

            console.log('提取的歌词文本:', lrcText)

            if (lrcText && lrcText.trim() !== '') {
                // 更严格的空内容检查
                const lowerText = lrcText.toLowerCase().trim()
                const emptyPatterns = [
                    '纯音乐', '暂无歌词', '无歌词', 'no lyrics', 'instrumental',
                    '[]', '【】', '（）', '()', '歌词加载中', 'lrc loading'
                ]

                const isEmpty = emptyPatterns.some(pattern => lowerText.includes(pattern)) ||
                    lrcText.trim().length < 10

                if (isEmpty) {
                    console.log('检测到空歌词或无效内容')
                    currentLyrics.value = [{
                        time: 0,
                        text: '🎵 纯音乐，请欣赏',
                        id: 'no-lyrics-placeholder'
                    }]
                } else {
                    // 解析歌词
                    const parsedLyrics = parseLRC(lrcText)
                    console.log('解析后的歌词行数:', parsedLyrics.length)

                    if (parsedLyrics.length > 0) {
                        currentLyrics.value = parsedLyrics
                        console.log('歌词加载成功')
                    } else {
                        currentLyrics.value = [{
                            time: 0,
                            text: '📝 歌词格式解析失败',
                            id: 'parse-error-placeholder'
                        }]
                    }
                }
            } else {
                console.log('未获取到歌词内容')
                currentLyrics.value = [{
                    time: 0,
                    text: '📝 暂无歌词',
                    id: 'no-content-placeholder'
                }]
            }
        } catch (error) {
            console.error('歌词加载失败:', error)
            currentLyrics.value = [{
                time: 0,
                text: '❌ 歌词加载失败',
                id: 'error-placeholder'
            }]
        } finally {
            lyricsLoading.value = false
            console.log('歌词加载状态结束')
        }
    }
    const updateCurrentLyricIndex = (currentTime) => {
        if (currentLyrics.value.length === 0) {
            currentLyricIndex.value = -1
            return
        }

        // 处理占位符歌词（不需要高亮）
        if (currentLyrics.value.length === 1 &&
            (currentLyrics.value[0].id.includes('placeholder') ||
                currentLyrics.value[0].id.includes('no-lyrics'))) {
            currentLyricIndex.value = -1
            return
        }

        let newIndex = -1

        // 从后向前查找当前时间对应的歌词行
        for (let i = currentLyrics.value.length - 1; i >= 0; i--) {
            if (currentTime >= currentLyrics.value[i].time) {
                newIndex = i
                break
            }
        }

        // 只有当索引真正改变时才更新，避免不必要的渲染
        if (currentLyricIndex.value !== newIndex) {
            currentLyricIndex.value = newIndex
        }
    }

    // 🆕 音频健康检查
    const checkAudioHealth = () => {
        return audioEngine.value?.isInitialized || false
    }

    const getAudioStatus = () => {
        if (!audioEngine.value) return 'no-engine'
        return audioEngine.value.isInitialized ? 'ready' : 'loading'
    }

    const forcePlay = async () => {
        if (!audioEngine.value || !currentSong.value) return false

        try {
            await retryPlay()
            return true
        } catch (error) {
            console.error('强制播放失败:', error)
            return false
        }
    }

    // 🆕 获取音频数据用于可视化
    const getAudioData = () => {
        return audioEngine.value?.getAudioData() || null
    }

    // 队列管理
    const clearQueue = () => {
        playQueue.value = []
        currentIndex.value = -1
        if (audioEngine.value) {
            audioEngine.value.pause()
        }
        currentSong.value = null
        isPlaying.value = false
        currentTime.value = 0
        duration.value = 0
    }

    const addToQueue = (song) => {
        playQueue.value.push(song)
    }

    const removeFromQueue = (index) => {
        if (index >= 0 && index < playQueue.value.length) {
            playQueue.value.splice(index, 1)
            if (currentIndex.value >= index) {
                currentIndex.value--
            }
        }
    }

    // API 数据获取方法
    const fetchAllMusic = async () => {
        loading.value.musics = true
        try {
            const response = await getAllMusic()
            if (response.code === 200) {
                allMusics.value = response.data.list
                if (playQueue.value.length === 0) {
                    playQueue.value = [...response.data.list]
                }
            }
            return response
        } catch (error) {
            console.error('获取音乐列表失败:', error)
            throw error
        } finally {
            loading.value.musics = false
        }
    }

    const fetchAllPlaylists = async () => {
        loading.value.playlists = true
        try {
            const response = await getAllPlaylists()
            if (response.code === 200) {
                allPlaylists.value = response.data.list
            }
            return response
        } catch (error) {
            console.error('获取歌单列表失败:', error)
            throw error
        } finally {
            loading.value.playlists = false
        }
    }

    const fetchPlaylistDetail = async (playlistId) => {
        loading.value.playlistDetail = true
        try {
            const response = await getPlaylistDetail(playlistId)
            if (response.code === 200) {
                currentPlaylist.value = response.data
                if (playQueue.value.length === 0 && response.data.items) {
                    playQueue.value = response.data.items.map(item => item.music)
                }
            }
            return response
        } catch (error) {
            console.error('获取歌单详情失败:', error)
            throw error
        } finally {
            loading.value.playlistDetail = false
        }
    }

    const createNewPlaylist = async (playlistData) => {
        try {
            const response = await createPlaylist(playlistData)
            if (response.code === 200) {
                await fetchAllPlaylists()
            }
            return response
        } catch (error) {
            console.error('创建歌单失败:', error)
            throw error
        }
    }

    const deleteUserPlaylist = async (playlistId) => {
        try {
            const response = await deletePlaylist(playlistId)
            if (response.code === 200) {
                await fetchAllPlaylists()
                if (currentPlaylist.value?.id === playlistId) {
                    currentPlaylist.value = null
                }
            }
            return response
        } catch (error) {
            console.error('删除歌单失败:', error)
            throw error
        }
    }

    const addToPlaylist = async (playlistId, musicId) => {
        try {
            const response = await addSongToPlaylist(playlistId, musicId)
            if (response.code === 200) {
                if (currentPlaylist.value?.id === playlistId) {
                    await fetchPlaylistDetail(playlistId)
                }
            }
            return response
        } catch (error) {
            console.error('添加歌曲到歌单失败:', error)
            throw error
        }
    }

    const removeFromPlaylist = async (playlistId, musicId) => {
        try {
            const response = await removeSongFromPlaylist(playlistId, musicId)
            if (response.code === 200) {
                if (currentPlaylist.value?.id === playlistId) {
                    await fetchPlaylistDetail(playlistId)
                }
            }
            return response
        } catch (error) {
            console.error('从歌单移除歌曲失败:', error)
            throw error
        }
    }

    const searchMusicByLabels = async (labels) => {
        loading.value.search = true
        try {
            const response = await searchByLabels(labels)
            if (response.code === 200) {
                searchResults.value = response.data
            }
            return response
        } catch (error) {
            console.error('搜索音乐失败:', error)
            throw error
        } finally {
            loading.value.search = false
        }
    }

    const userLoginAction = async () => {
        try {
            const response = await userLogin()
            if (response.code === 200) {
                userInfo.value = response.data
                if (response.data.playlists) {
                    const favoritePlaylist = response.data.playlists.find(p => p.name === '我的最爱')
                    if (favoritePlaylist?.items) {
                        favoritePlaylist.items.forEach(item => {
                            likedSongs.value.add(item.musicId)
                        })
                    }
                }
            }
            return response
        } catch (error) {
            console.error('用户登录失败:', error)
            throw error
        }
    }

    const likeSong = async (musicId) => {
        try {
            const response = await likeMusic(musicId)
            if (response === 'Like') {
                likedSongs.value.add(musicId)
            }
            return response
        } catch (error) {
            console.error('喜欢歌曲失败:', error)
            throw error
        }
    }

    const dislikeSong = async (musicId) => {
        try {
            const response = await dislikeMusic(musicId)
            if (response === 'Dislike') {
                likedSongs.value.delete(musicId)
            }
            return response
        } catch (error) {
            console.error('不喜欢歌曲失败:', error)
            throw error
        }
    }

    const starSong = async (musicId) => {
        try {
            const response = await starMusic(musicId)
            if (response === 'Star!') {
                starredSongs.value.add(musicId)
            }
            return response
        } catch (error) {
            console.error('收藏歌曲失败:', error)
            throw error
        }
    }

    // AI推荐功能
    const getAIRecommendation = async (message) => {
        loading.value.aiRecommend = true
        try {
            aiChatHistory.value.push({
                type: 'user',
                content: message,
                timestamp: new Date().toISOString()
            })

            const response = await getRecommendationFromAI(message)
            if (response.code === 200) {
                aiRecommendation.value = {
                    reply: response.data.LLMReply,
                    playlist: response.data.playlist || [],
                    labels: response.data.LLMReply?.labels || []
                }

                if (response.data.LLMReply?.content) {
                    aiChatHistory.value.push({
                        type: 'ai',
                        content: response.data.LLMReply.content,
                        timestamp: new Date().toISOString(),
                        labels: response.data.LLMReply.labels,
                        playlistCount: response.data.playlist?.length || 0
                    })
                }

                if (response.data.playlist?.length > 0 && playQueue.value.length === 0) {
                    playQueue.value = [...response.data.playlist]
                }
            }
            return response
        } catch (error) {
            console.error('获取AI推荐失败:', error)
            aiChatHistory.value.push({
                type: 'error',
                content: '获取推荐失败，请稍后重试',
                timestamp: new Date().toISOString()
            })
            throw error
        } finally {
            loading.value.aiRecommend = false
        }
    }

    const playAIRecommendation = () => {
        if (aiRecommendation.value.playlist.length > 0) {
            playQueue.value = [...aiRecommendation.value.playlist]
            if (aiRecommendation.value.playlist[0]) {
                playSong(aiRecommendation.value.playlist[0])
            }
        }
    }

    const clearAIChatHistory = () => {
        aiChatHistory.value = []
        aiRecommendation.value = {
            reply: null,
            playlist: [],
            labels: []
        }
    }

    const saveAIRecommendationAsPlaylist = async (playlistName, playlistDescription) => {
        if (!playlistName || aiRecommendation.value.playlist.length === 0) {
            throw new Error('请提供歌单名称或确保有推荐歌曲')
        }

        try {
            const createResponse = await createNewPlaylist({
                name: playlistName || `AI推荐歌单 ${new Date().toLocaleDateString()}`,
                description: playlistDescription || 'AI智能推荐的歌单',
            })

            if (createResponse.code === 200) {
                const playlistId = createResponse.data.id
                const songs = aiRecommendation.value.playlist || []

                const addPromises = songs.map(song =>
                    addToPlaylist(playlistId, song.id)
                )

                const results = await Promise.allSettled(addPromises)
                const failedAdds = results.filter(r => r.status === 'rejected' ||
                    (r.status === 'fulfilled' && r.value?.code !== 200))

                if (failedAdds.length > 0) {
                    console.warn(`部分歌曲添加失败: ${failedAdds.length}首`)
                }

                await fetchAllPlaylists()

                return {
                    ...createResponse,
                    addedSongs: songs.length - failedAdds.length,
                    totalSongs: songs.length,
                    playlistId: playlistId
                }
            } else {
                throw new Error(createResponse.message || '创建歌单失败')
            }
        } catch (error) {
            console.error('保存AI推荐歌单失败:', error)
            throw error
        }
    }

    // 初始化store
    const initialize = async () => {
        await Promise.all([
            fetchAllMusic(),
            fetchAllPlaylists(),
            userLoginAction()
        ])
    }

    // 清理资源
    const destroy = () => {
        if (audioEngine.value) {
            audioEngine.value.destroy()
            audioEngine.value = null
        }
    }

    return {
        // 状态
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        playQueue,
        currentIndex,
        playMode,
        allMusics,
        allPlaylists,
        currentPlaylist,
        searchResults,
        aiRecommendation,
        aiChatHistory,
        userInfo,
        likedSongs,
        starredSongs,
        currentLyrics,
        currentLyricIndex,
        lyricsLoading,
        audioError,
        loading,
        isSeeking,
        isWaiting,
        audioEngine, // 🆕 暴露 audioEngine 用于调试

        // 计算属性
        currentPlaylistSongs,
        currentLyric,
        currentQueue,
        progress,
        isLiked,
        isStarred,
        audioHealth,
        hasAIReply,
        hasAIPlaylist,

        // 方法
        playSong,
        pauseSong,
        resumeSong,
        togglePlay,
        nextSong,
        prevSong,
        setPlayMode,
        setVolume,
        setCurrentTime,
        seekTo,
        setDuration,
        loadLyrics,
        updateCurrentLyricIndex,
        clearError,
        retryPlay,

        // 工具方法
        checkAudioHealth,
        getAudioStatus,
        forcePlay,
        getAudioData, // 🆕 新增音频数据获取

        // API方法
        fetchAllMusic,
        fetchAllPlaylists,
        fetchPlaylistDetail,
        createNewPlaylist,
        deleteUserPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        searchMusicByLabels,
        userLoginAction,
        likeSong,
        dislikeSong,
        starSong,

        // 队列管理
        clearQueue,
        addToQueue,
        removeFromQueue,
        initialize,
        destroy, // 🆕 新增销毁方法

        // AI方法
        getAIRecommendation,
        playAIRecommendation,
        clearAIChatHistory,
        saveAIRecommendationAsPlaylist,
    }
}, {
    persist: {
        key: 'music-player-storage',
        paths: [
            'volume',
            'playMode',
            'likedSongs',
            'starredSongs',
            'userInfo',
            'playQueue',
            'currentIndex',
            'currentTime',
            'currentSong',
            'allMusics',
            'allPlaylists'
        ],
        storage: localStorage
    }
})