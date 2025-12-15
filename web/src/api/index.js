import { isMockMode } from '../utils/config.js'
import { mockApi } from './mockApi.js'
import * as realApi from './realApi.js'

// 根据环境选择API
const api = isMockMode ? mockApi : realApi

// 统一导出所有API方法
export const {
    ping,
    userLogin,
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
    starMusic
} = api

// 工具函数
export const switchApiMode = (mode) => {
    if (mode === 'mock' || mode === 'real') {
        localStorage.setItem('api_mode', mode)
        window.location.reload()
    }
}

export const getCurrentApiMode = () => {
    return isMockMode ? 'mock' : 'real'
}