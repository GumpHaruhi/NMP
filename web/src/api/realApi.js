import { apiClient } from '../utils/request.js'

// 健康检查
export const ping = () => apiClient.get('/ping')

// 用户相关
export const userLogin = () => apiClient.get('/user/login')

// 音乐相关
export const getAllMusic = () => apiClient.get('/check/music')
export const getMusicDetail = (id) => apiClient.get(`/music/detail/${id}`)
export const playMusic = (id) => apiClient.get(`/music/play/${id}`)
export const getLyrics = (id) => apiClient.get(`/music/lyrics/${id}`)
export const getCover = (id) => apiClient.get(`/music/cover/${id}`)

// 音乐反馈
export const likeMusic = (id) => apiClient.get(`/music/like/${id}`)
export const dislikeMusic = (id) => apiClient.get(`/music/dislike/${id}`)
export const starMusic = (id) => apiClient.get(`/music/star/${id}`)

// 歌单相关
export const getAllPlaylists = () => apiClient.get('/check/playlist')
export const getPlaylistDetail = (id) => apiClient.get(`/playlist/detail/${id}`)
export const createPlaylist = (data) => apiClient.post('/playlist/create', data)
export const deletePlaylist = (playlistId) => apiClient.post('/playlist/delete', { playlistId })
export const addSongToPlaylist = (playlistId, musicId) =>
    apiClient.post('/playlist/addsong', { playlistId, musicId })
export const removeSongFromPlaylist = (playlistId, musicId) =>
    apiClient.post('/playlist/removesong', { playlistId, musicId })

// 搜索相关
export const searchByLabels = (labels) => apiClient.post('/music/search/labels', { labels })

// AI生成歌单
export const getRecommendationFromAI = (message) => apiClient.post('/ai-recommend', { message })