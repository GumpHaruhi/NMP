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
    getCover
} from '@/api'
import { parseLRC } from '@/utils/lrcParser'

export const useMusicStore = defineStore('music', () => {
    // 状态定义 - 保持原有状态
    const currentSong = ref(null)
    const isPlaying = ref(false)
    const currentTime = ref(0)
    const duration = ref(0)
    const volume = ref(80)
    const playQueue = ref([])
    const currentIndex = ref(-1)
    const playMode = ref('sequential') // sequential, loop, random
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
    const audioElement = ref(null)
    const isSeeking = ref(false)
    const audioError = ref(null)
    const isWaiting = ref(false)

    // 🆕 新增：全局音频控制状态
    const audioInstances = ref(new Set())
    const currentAudioUID = ref(null)
    const audioControlLock = ref(null)
    const lastUserInteraction = ref(0)

    // 加载状态管理
    const loading = ref({
        musics: false,
        playlists: false,
        playlistDetail: false,
        search: false,
        lyrics: false
    })

    // 计算属性 - 保持原有计算属性
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

    // 🆕 新增：音频健康状态计算属性
    const audioHealth = computed(() => {
        if (!audioElement.value) return 'no-element'
        const audio = audioElement.value
        if (audio.error) return `error-${audio.error.code}`
        if (audio.networkState === audio.NETWORK_EMPTY) return 'empty'
        if (audio.readyState >= audio.HAVE_ENOUGH_DATA) return 'ready'
        return 'loading'
    })

    // 🆕 新增：音频实例管理
    const ensureAudioElement = (element) => {
        if (!element) return null

        // 为音频元素添加唯一标识
        if (!element.audioUID) {
            element.audioUID = Symbol('audio-instance')
        }

        // 注册音频实例
        audioInstances.value.add(element)

        // 确保只有一个音频在播放
        audioInstances.value.forEach(instance => {
            if (instance.audioUID !== element.audioUID && !instance.paused) {
                instance.pause()
                instance.dispatchEvent(new Event('force-pause'))
            }
        })

        return element
    }

    // 🎯 修复的关键方法 - 保持原有函数名称
    const seekTo = (time) => {
        if (!audioElement.value || !currentSong.value) return

        try {
            const newTime = Math.max(0, Math.min(duration.value, time))
            currentTime.value = newTime
            isSeeking.value = true

            if (audioElement.value) {
                audioElement.value.currentTime = newTime
            }

            updateCurrentLyricIndex(newTime)

            // 延迟重置seeking状态，避免频繁触发timeupdate
            setTimeout(() => {
                isSeeking.value = false
            }, 100)
        } catch (error) {
            console.error('跳转时间失败:', error)
            audioError.value = error
        }
    }

    const clearError = () => {
        audioError.value = null
    }

    const retryPlay = async () => {
        if (!currentSong.value) return

        try {
            clearError()
            isPlaying.value = false

            // 重置音频元素
            if (audioElement.value) {
                const currentSrc = audioElement.value.src
                audioElement.value.src = ''
                audioElement.value.load()

                // 短暂延迟后重新加载
                setTimeout(() => {
                    if (audioElement.value) {
                        audioElement.value.src = currentSrc
                        audioElement.value.load()

                        // 重新尝试播放
                        audioElement.value.play().then(() => {
                            isPlaying.value = true
                        }).catch(error => {
                            console.error('重试播放失败:', error)
                            audioError.value = error
                        })
                    }
                }, 100)
            } else {
                // 如果没有audio元素，直接重新播放歌曲
                await playSong(currentSong.value)
            }
        } catch (error) {
            console.error('重试播放失败:', error)
            audioError.value = error
        }
    }

    // 🆕 增强的音频元素管理
    const setAudioElement = (element) => {
        if (!element) return

        const audioEl = ensureAudioElement(element)
        audioElement.value = audioEl
        audioElement.value.volume = volume.value / 100
        bindAudioEvents()

        // 记录用户交互时间
        lastUserInteraction.value = Date.now()
    }

    const bindAudioEvents = () => {
        if (!audioElement.value) return

        const audio = audioElement.value

        // 移除旧的事件监听器
        audio.ontimeupdate = null
        audio.onloadedmetadata = null
        audio.onended = null
        audio.onplay = null
        audio.onpause = null
        audio.onerror = null
        audio.onwaiting = null
        audio.oncanplay = null
        audio.oncanplaythrough = null

        // 绑定新的事件
        audio.ontimeupdate = handleTimeUpdate
        audio.onloadedmetadata = handleLoadedMetadata
        audio.onended = handleEnded
        audio.onplay = handlePlay
        audio.onpause = handlePause
        audio.onerror = handleError
        audio.onwaiting = handleWaiting
        audio.oncanplay = handleCanPlay
        audio.oncanplaythrough = handleCanPlayThrough

        // 🆕 新增：额外的错误恢复监听
        audio.addEventListener('stalled', handleStalled)
        audio.addEventListener('suspend', handleSuspend)
    }

    // 🆕 新增：增强的错误处理
    const enhancedErrorHandler = (error, context = 'unknown') => {
        console.error(`音频错误 [${context}]:`, error)
        audioError.value = {
            message: error.message,
            code: error.code,
            context,
            timestamp: Date.now()
        }

        // 自动错误恢复机制
        if (context !== 'retry' && currentSong.value) {
            setTimeout(() => {
                if (!isPlaying.value && audioError.value) {
                    retryPlay()
                }
            }, 2000)
        }
    }

    // 音频事件处理 - 保持原有函数
    const handleTimeUpdate = () => {
        if (!audioElement.value || isSeeking.value) return
        currentTime.value = audioElement.value.currentTime
        updateCurrentLyricIndex(currentTime.value)
    }

    const handleLoadedMetadata = () => {
        if (audioElement.value) {
            duration.value = audioElement.value.duration
        }
    }

    const handleEnded = () => {
        console.log('播放结束，自动下一首')
        nextSong()
    }

    const handlePlay = () => {
        console.log('音频开始播放')
        isPlaying.value = true
        isWaiting.value = false
        audioError.value = null
    }

    const handlePause = () => {
        console.log('音频暂停')
        isPlaying.value = false
    }

    const handleError = (event) => {
        const error = event.target.error
        console.error('音频播放错误:', error)
        audioError.value = error
        isPlaying.value = false
        isWaiting.value = false

        // 播放失败时自动下一首（延迟执行）
        setTimeout(() => {
            if (!isPlaying.value && currentQueue.value.length > 0) {
                console.log('播放失败，尝试下一首')
                nextSong()
            }
        }, 2000)
    }

    const handleWaiting = () => {
        console.log('音频等待数据加载')
        isWaiting.value = true
        lyricsLoading.value = true
    }

    const handleCanPlay = () => {
        console.log('音频可以播放')
        isWaiting.value = false
        lyricsLoading.value = false
    }

    const handleCanPlayThrough = () => {
        console.log('音频可以完整播放')
        isWaiting.value = false
        lyricsLoading.value = false
    }

    // 🆕 新增：额外的音频事件处理
    const handleStalled = () => {
        console.warn('音频加载停滞')
        isWaiting.value = true
    }

    const handleSuspend = () => {
        console.log('音频加载暂停')
    }

    // 🎯 修复的播放控制核心方法 - 保持原有函数名称
    const playSong = async (song, playlist = null) => {
        if (!song) return

        try {
            console.log('准备播放歌曲:', song.title)

            // 先停止所有音频播放
            audioInstances.value.forEach(instance => {
                if (!instance.paused) {
                    instance.pause()
                }
            })

            // 更新状态
            currentSong.value = { ...song }
            isPlaying.value = true
            currentTime.value = 0
            currentLyricIndex.value = -1
            audioError.value = null
            isWaiting.value = true

            // 设置播放队列
            if (playlist && playlist.length > 0) {
                playQueue.value = [...playlist]
                currentIndex.value = playlist.findIndex(s => s.id === song.id)
            } else if (playQueue.value.length === 0 && allMusics.value.length > 0) {
                playQueue.value = [...allMusics.value]
                const index = allMusics.value.findIndex(s => s.id === song.id)
                currentIndex.value = index >= 0 ? index : 0
            }

            // 加载歌词
            await loadLyrics(song)

            const audioUrl = `/api/music/play/${song.id}`
            console.log('设置音频源:', audioUrl)

            // 使用requestAnimationFrame确保在浏览器重绘后执行
            requestAnimationFrame(() => {
                if (!audioElement.value) {
                    enhancedErrorHandler(new Error('音频元素未初始化'), 'playSong-setup')
                    return
                }

                try {
                    // 先停止当前播放
                    audioElement.value.pause()
                    audioElement.value.currentTime = 0

                    // 设置新的音频源
                    audioElement.value.src = audioUrl
                    audioElement.value.load()

                    // 处理自动播放策略
                    const playPromise = audioElement.value.play()

                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log('开始播放:', song.title)
                                isPlaying.value = true
                                isWaiting.value = false
                            })
                            .catch(error => {
                                if (error.name === 'NotAllowedError') {
                                    // 自动播放被阻止，等待用户交互
                                    console.log('需要用户交互才能播放')
                                    isPlaying.value = false
                                    isWaiting.value = false
                                    // 设置标记，等待用户手动触发播放
                                    audioError.value = {
                                        message: '点击播放按钮开始播放',
                                        type: 'userInteractionRequired'
                                    }
                                } else {
                                    enhancedErrorHandler(error, 'playSong-play')
                                }
                            })
                    }
                } catch (error) {
                    enhancedErrorHandler(error, 'playSong-inner')
                }
            })

        } catch (error) {
            enhancedErrorHandler(error, 'playSong-outer')
            isPlaying.value = false
            isWaiting.value = false
        }
    }

    // 🎯 修复的togglePlay方法 - 保持原有函数名称
    const togglePlay = async () => {
        if (!audioElement.value || !currentSong.value) {
            // 如果没有当前歌曲，尝试播放队列第一首
            if (currentQueue.value.length > 0) {
                await playSong(currentQueue.value[0])
            }
            return
        }

        try {
            if (isPlaying.value) {
                // 暂停播放
                audioElement.value.pause()
                isPlaying.value = false
            } else {
                // 恢复播放 - 处理自动播放策略
                const playPromise = audioElement.value.play()

                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            isPlaying.value = true
                            audioError.value = null
                        })
                        .catch(error => {
                            if (error.name === 'NotAllowedError') {
                                // 在用户交互上下文中重试
                                retryPlay()
                            } else {
                                enhancedErrorHandler(error, 'togglePlay')
                            }
                        })
                }
            }
        } catch (error) {
            enhancedErrorHandler(error, 'togglePlay')
        }
    }

    const pauseSong = () => {
        if (audioElement.value) {
            audioElement.value.pause()
            isPlaying.value = false
        }
    }

    const resumeSong = async () => {
        if (audioElement.value && currentSong.value) {
            try {
                const playPromise = audioElement.value.play()
                if (playPromise !== undefined) {
                    await playPromise
                    isPlaying.value = true
                }
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

    const setPlayMode = (mode) => {
        if (['sequential', 'loop', 'random'].includes(mode)) {
            playMode.value = mode
        }
    }

    const setVolume = (value) => {
        const newVolume = Math.max(0, Math.min(100, value))
        volume.value = newVolume
        if (audioElement.value) {
            audioElement.value.volume = newVolume / 100
        }
    }

    const setCurrentTime = (time) => {
        seekTo(time)
    }

    const setDuration = (time) => {
        duration.value = time
    }

    // 歌词功能 - 保持原有函数
    const loadLyrics = async (song) => {
        if (!song?.id) {
            currentLyrics.value = []
            currentLyricIndex.value = -1
            return
        }

        lyricsLoading.value = true
        try {
            const response = await getLyrics(song.id)
            if (response.code === 200 && response.data) {
                const lrcText = response.data.lyric || response.data
                currentLyrics.value = parseLRC(lrcText)
                currentLyricIndex.value = -1
                console.log('歌词加载成功，行数:', currentLyrics.value.length)
            } else {
                currentLyrics.value = []
                currentLyricIndex.value = -1
                console.log('未找到歌词')
            }
        } catch (error) {
            console.error('歌词加载失败:', error)
            currentLyrics.value = []
            currentLyricIndex.value = -1
        } finally {
            lyricsLoading.value = false
        }
    }

    const updateCurrentLyricIndex = (currentTime) => {
        if (currentLyrics.value.length === 0) {
            currentLyricIndex.value = -1
            return
        }

        // 找到当前时间对应的歌词行
        for (let i = currentLyrics.value.length - 1; i >= 0; i--) {
            if (currentTime >= currentLyrics.value[i].time) {
                if (currentLyricIndex.value !== i) {
                    currentLyricIndex.value = i
                }
                break
            }
        }

        // 如果当前时间小于第一行歌词的时间，重置索引
        if (currentTime < currentLyrics.value[0]?.time) {
            currentLyricIndex.value = -1
        }
    }

    // 🆕 新增：全局音频控制工具方法
    const checkAudioHealth = () => {
        if (!audioElement.value) return false
        const audio = audioElement.value
        return (
            audio.readyState > 0 &&
            !audio.error &&
            audio.duration > 0
        )
    }

    const getAudioStatus = () => {
        if (!audioElement.value) return 'no-element'
        const audio = audioElement.value
        if (audio.error) return `error-${audio.error.code}`
        if (audio.networkState === audio.NETWORK_EMPTY) return 'empty'
        if (audio.readyState === audio.HAVE_NOTHING) return 'no-data'
        if (audio.readyState >= audio.HAVE_METADATA) return 'ready'
        return 'unknown'
    }

    const forcePlay = async () => {
        if (!audioElement.value || !currentSong.value) return false

        try {
            // 强制重置音频元素
            const currentSrc = audioElement.value.src
            audioElement.value.src = ''
            audioElement.value.load()

            await new Promise(resolve => setTimeout(resolve, 100))

            audioElement.value.src = currentSrc
            audioElement.value.load()

            const playPromise = audioElement.value.play()
            if (playPromise !== undefined) {
                await playPromise
                return true
            }
            return false
        } catch (error) {
            console.error('强制播放失败:', error)
            return false
        }
    }

    // API 数据获取方法 - 保持原有函数
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

    // 播放队列管理 - 保持原有函数
    const clearQueue = () => {
        playQueue.value = []
        currentIndex.value = -1
        if (audioElement.value) {
            audioElement.value.pause()
            audioElement.value.src = ''
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

    // 初始化store
    const initialize = async () => {
        await Promise.all([
            fetchAllMusic(),
            fetchAllPlaylists(),
            userLoginAction()
        ])
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
        userInfo,
        likedSongs,
        starredSongs,
        currentLyrics,
        currentLyricIndex,
        lyricsLoading,
        audioElement,
        audioError,
        loading,
        isSeeking,
        isWaiting,

        // 计算属性
        currentPlaylistSongs,
        currentLyric,
        currentQueue,
        progress,
        isLiked,
        isStarred,
        audioHealth, // 🆕 新增

        // 方法
        setAudioElement,
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

        // 🆕 新增工具方法
        checkAudioHealth,
        getAudioStatus,
        forcePlay,

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
        initialize
    }
}, {
    // 持久化配置 - 增强持久化范围
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