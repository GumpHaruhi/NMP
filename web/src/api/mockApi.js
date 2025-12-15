import { mockData } from './mockData.js'

// 模拟延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟API响应结构
const mockResponse = (data, message = '成功') => ({
    code: 200,
    message,
    data
})

const mockError = (message = '错误', code = 500) => ({
    code,
    message,
    error: message,
    data: null
})

export const mockApi = {
    // 健康检查
    ping: async () => {
        await delay(200)
        return "pong"
    },

    // 用户登录
    userLogin: async () => {
        await delay(300)
        return mockResponse({
            userId: 1,
            username: 'testuser',
            playlists: mockData.playlists
        }, '登录成功')
    },

    // 获取所有音乐
    getAllMusic: async () => {
        await delay(400)
        return mockResponse({
            total: mockData.musics.length,
            list: mockData.musics
        }, '查询成功')
    },

    // 获取所有歌单
    getAllPlaylists: async () => {
        await delay(400)
        return mockResponse({
            total: mockData.playlists.length,
            list: mockData.playlists
        }, '查询成功')
    },

    // 获取歌单详情
    getPlaylistDetail: async (id) => {
        await delay(300)
        const playlist = mockData.playlists.find(p => p.id === parseInt(id))
        if (!playlist) {
            return mockError('歌单不存在', 404)
        }
        return mockResponse(playlist)
    },

    // 创建歌单
    createPlaylist: async (data) => {
        await delay(500)
        const newPlaylist = {
            id: Date.now(),
            name: data.name,
            description: data.description || '',
            createdAt: new Date().toISOString(),
            items: []
        }
        mockData.playlists.push(newPlaylist)
        return mockResponse(newPlaylist, '创建成功')
    },

    // 删除歌单
    deletePlaylist: async (playlistId) => {
        await delay(400)
        const index = mockData.playlists.findIndex(p => p.id === parseInt(playlistId))
        if (index === -1) {
            return mockError('歌单不存在', 404)
        }
        mockData.playlists.splice(index, 1)
        return mockResponse(null, '删除成功')
    },

    // 添加歌曲到歌单
    addSongToPlaylist: async (playlistId, musicId) => {
        await delay(400)
        const playlist = mockData.playlists.find(p => p.id === parseInt(playlistId))
        const music = mockData.musics.find(m => m.id === parseInt(musicId))

        if (!playlist || !music) {
            return mockError('歌单或歌曲不存在', 404)
        }

        // 检查是否已存在
        const exists = playlist.items.find(item => item.musicId === parseInt(musicId))
        if (exists) {
            return mockError('歌曲已存在于歌单', 500)
        }

        playlist.items.push({
            musicId: music.id,
            trackOrder: playlist.items.length + 1,
            music: music
        })

        return mockResponse(null, '添加成功')
    },

    // 从歌单移除歌曲
    removeSongFromPlaylist: async (playlistId, musicId) => {
        await delay(400)
        const playlist = mockData.playlists.find(p => p.id === parseInt(playlistId))
        if (!playlist) {
            return mockError('歌单不存在', 404)
        }

        const index = playlist.items.findIndex(item => item.musicId === parseInt(musicId))
        if (index === -1) {
            return mockError('歌曲不存在于歌单', 500)
        }

        playlist.items.splice(index, 1)
        // 重新排序
        playlist.items.forEach((item, idx) => {
            item.trackOrder = idx + 1
        })

        return mockResponse(null, '移除成功')
    },

    // 根据标签搜索
    searchByLabels: async (labels) => {
        await delay(500)
        const filteredMusics = mockData.musics.filter(music =>
            labels.some(label => music.labels.includes(label))
        )
        return mockResponse(filteredMusics, '检索成功')
    },

    // 音乐反馈
    likeMusic: async (id) => {
        await delay(200)
        return "Like"
    },

    dislikeMusic: async (id) => {
        await delay(200)
        return "Dislike"
    },

    starMusic: async (id) => {
        await delay(200)
        return "Star!"
    }
}