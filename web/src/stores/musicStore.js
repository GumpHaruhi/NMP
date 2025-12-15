import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
    userLogin
} from '@/api'

export const useMusicStore = defineStore('music', () => {
    // 状态
    const currentSong = ref(null) // 当前播放的歌曲
    const isPlaying = ref(false) // 是否正在播放
    const currentTime = ref(0) // 当前播放时间
    const duration = ref(0) // 歌曲总时长
    const volume = ref(80) // 音量 0-100

    // 播放列表相关
    const playQueue = ref([]) // 播放队列
    const currentIndex = ref(-1) // 当前播放索引
    const playMode = ref('sequential') // 播放模式: sequential, loop, random

    // 数据相关
    const allMusics = ref([]) // 所有音乐
    const allPlaylists = ref([]) // 所有歌单
    const currentPlaylist = ref(null) // 当前查看的歌单
    const searchResults = ref([]) // 搜索结果

    // 用户相关
    const userInfo = ref(null)
    const likedSongs = ref(new Set()) // 喜欢的歌曲ID集合
    const starredSongs = ref(new Set()) // 收藏的歌曲ID集合

    // 加载状态
    const loading = ref({
        musics: false,
        playlists: false,
        playlistDetail: false,
        search: false
    })

    // 计算属性
    const currentPlaylistSongs = computed(() => {
        return currentPlaylist.value?.items?.map(item => item.music) || []
    })

    const currentQueue = computed(() => {
        return playQueue.value.length > 0 ? playQueue.value : allMusics.value
    })

    const progress = computed(() => {
        return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    })

    const isLiked = computed(() => (songId) => {
        return likedSongs.value.has(songId)
    })

    const isStarred = computed(() => (songId) => {
        return starredSongs.value.has(songId)
    })

    // 获取所有音乐
    const fetchAllMusic = async () => {
        loading.value.musics = true
        try {
            const response = await getAllMusic()
            if (response.code === 200) {
                allMusics.value = response.data.list
                // 初始化播放队列
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

    // 获取所有歌单
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

    // 获取歌单详情
    const fetchPlaylistDetail = async (playlistId) => {
        loading.value.playlistDetail = true
        try {
            const response = await getPlaylistDetail(playlistId)
            if (response.code === 200) {
                currentPlaylist.value = response.data
                // 如果当前播放队列为空，使用歌单歌曲作为播放队列
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

    // 创建歌单
    const createNewPlaylist = async (playlistData) => {
        try {
            const response = await createPlaylist(playlistData)
            if (response.code === 200) {
                // 创建成功后重新获取歌单列表
                await fetchAllPlaylists()
            }
            return response
        } catch (error) {
            console.error('创建歌单失败:', error)
            throw error
        }
    }

    // 删除歌单
    const deleteUserPlaylist = async (playlistId) => {
        try {
            const response = await deletePlaylist(playlistId)
            if (response.code === 200) {
                // 删除成功后重新获取歌单列表
                await fetchAllPlaylists()
                // 如果删除的是当前查看的歌单，清空当前歌单
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

    // 添加歌曲到歌单
    const addToPlaylist = async (playlistId, musicId) => {
        try {
            const response = await addSongToPlaylist(playlistId, musicId)
            if (response.code === 200) {
                // 添加成功后刷新当前歌单详情
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

    // 从歌单移除歌曲
    const removeFromPlaylist = async (playlistId, musicId) => {
        try {
            const response = await removeSongFromPlaylist(playlistId, musicId)
            if (response.code === 200) {
                // 移除成功后刷新当前歌单详情
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

    // 根据标签搜索音乐
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

    // 用户登录
    const userLoginAction = async () => {
        try {
            const response = await userLogin()
            if (response.code === 200) {
                userInfo.value = response.data
                // 初始化用户喜欢的歌曲和收藏
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

    // 喜欢歌曲
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

    // 不喜欢歌曲
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

    // 收藏歌曲
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

    // 播放控制
    const playSong = (song, playlist = null) => {
        if (!song) return

        currentSong.value = song? { ...song } : null
        isPlaying.value = true

        if (playlist && playlist.length>0) {
            playQueue.value = [...playlist]
            currentIndex.value = playlist.findIndex(s => s.id === song.id)
        } else if(playQueue.value.length > 0) {
            const index = playQueue.value.findIndex(s => s.id === song.id)
            currentIndex.value = index >= 0 ? index : 0
        } else {
            playQueue.value = song ? [song] : []
            currentIndex.value = song ? 0 : -1
        }

        // 确保时间重置
        currentTime.value = 0
    }

    const pauseSong = () => {
        isPlaying.value = false
    }

    const resumeSong = () => {
        isPlaying.value = true
    }

    const togglePlay = () => {
        isPlaying.value = !isPlaying.value
    }

    const nextSong = () => {
        if (currentQueue.value.length === 0) return

        let nextIndex
        switch (playMode.value) {
            case 'random':
                nextIndex = Math.floor(Math.random() * currentQueue.value.length)
                break
            case 'loop':
            case 'sequential':
            default:
                nextIndex = (currentIndex.value + 1) % currentQueue.value.length
                break
        }

        playSong(currentQueue.value[nextIndex])
    }

    const prevSong = () => {
        if (currentQueue.value.length === 0) return

        let prevIndex
        switch (playMode.value) {
            case 'random':
                prevIndex = Math.floor(Math.random() * currentQueue.value.length)
                break
            case 'loop':
            case 'sequential':
            default:
                prevIndex = (currentIndex.value - 1 + currentQueue.value.length) % currentQueue.value.length
                break
        }

        playSong(currentQueue.value[prevIndex])
    }

    const setPlayMode = (mode) => {
        playMode.value = mode
    }

    const setVolume = (value) => {
        volume.value = Math.max(0, Math.min(100, value))
    }

    const setCurrentTime = (time) => {
        currentTime.value = Math.max(0, Math.min(duration.value, time))
    }

    const setDuration = (time) => {
        duration.value = time
    }

    // 清空播放队列
    const clearQueue = () => {
        playQueue.value = []
        currentIndex.value = -1
        currentSong.value = null
        isPlaying.value = false
    }

    // 添加到播放队列
    const addToQueue = (song) => {
        playQueue.value.push(song)
    }

    // 从播放队列移除
    const removeFromQueue = (index) => {
        playQueue.value.splice(index, 1)
        if (currentIndex.value >= index) {
            currentIndex.value--
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
        loading,

        // 计算属性
        currentPlaylistSongs,
        currentQueue,
        progress,
        isLiked,
        isStarred,

        // 方法
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
        playSong,
        pauseSong,
        resumeSong,
        togglePlay,
        nextSong,
        prevSong,
        setPlayMode,
        setVolume,
        setCurrentTime,
        setDuration,
        clearQueue,
        addToQueue,
        removeFromQueue,
        initialize
    }
})