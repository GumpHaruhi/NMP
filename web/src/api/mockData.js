// 模拟数据
export const mockData = {
    // 音乐数据
    musics: [
        {
            id: 101,
            title: "晴天",
            singer: "周杰伦",
            labels: ["Pop"],
            delabels: [],
            audioUrl: "/static/audio/101.mp3",
            coverUrl: "/static/cover/101.jpg",
            lyricsUrl: "/static/lyrics/101.lrc",
            duration: 258, // 秒
            playCount: 12450,
            likeCount: 8900
        },
        {
            id: 102,
            title: "Hotel California",
            singer: "Eagles",
            labels: ["Rock"],
            delabels: [],
            audioUrl: "/static/audio/102.mp3",
            coverUrl: "/static/cover/102.jpg",
            lyricsUrl: "/static/lyrics/102.lrc",
            duration: 391,
            playCount: 98760,
            likeCount: 45600
        },
        {
            id: 103,
            title: "Moon River",
            singer: "Audrey Hepburn",
            labels: ["Jazz", "Classical"],
            delabels: [],
            audioUrl: "/static/audio/103.mp3",
            coverUrl: "/static/cover/103.jpg",
            lyricsUrl: "/static/lyrics/103.lrc",
            duration: 157,
            playCount: 34500,
            likeCount: 23400
        },
        {
            id: 104,
            title: "Shape of You",
            singer: "Ed Sheeran",
            labels: ["Pop"],
            delabels: [],
            audioUrl: "/static/audio/104.mp3",
            coverUrl: "/static/cover/104.jpg",
            lyricsUrl: "/static/lyrics/104.lrc",
            duration: 233,
            playCount: 156780,
            likeCount: 98700
        },
        {
            id: 105,
            title: "Bohemian Rhapsody",
            singer: "Queen",
            labels: ["Rock"],
            delabels: [],
            audioUrl: "/static/audio/105.mp3",
            coverUrl: "/static/cover/105.jpg",
            lyricsUrl: "/static/lyrics/105.lrc",
            duration: 354,
            playCount: 234500,
            likeCount: 187600
        },
        {
            id: 106,
            title: "Fly Me to the Moon",
            singer: "Frank Sinatra",
            labels: ["Jazz"],
            delabels: [],
            audioUrl: "/static/audio/106.mp3",
            coverUrl: "/static/cover/106.jpg",
            lyricsUrl: "/static/lyrics/106.lrc",
            duration: 148,
            playCount: 67800,
            likeCount: 45600
        },
        {
            id: 107,
            title: "Für Elise",
            singer: "Beethoven",
            labels: ["Classical"],
            delabels: [],
            audioUrl: "/static/audio/107.mp3",
            coverUrl: "/static/cover/107.jpg",
            lyricsUrl: "/static/lyrics/107.lrc",
            duration: 182,
            playCount: 89200,
            likeCount: 67800
        },
        {
            id: 108,
            title: "God's Plan",
            singer: "Drake",
            labels: ["HipHop"],
            delabels: [],
            audioUrl: "/static/audio/108.mp3",
            coverUrl: "/static/cover/108.jpg",
            lyricsUrl: "/static/lyrics/108.lrc",
            duration: 198,
            playCount: 345600,
            likeCount: 234500
        }
    ],

    // 歌单数据
    playlists: [
        {
            id: 1,
            name: "我的最爱",
            description: "收藏的经典歌曲",
            createdAt: "2023-01-01T00:00:00Z",
            coverUrl: "/static/playlist/1.jpg",
            itemCount: 3,
            playCount: 1245,
            items: [
                {
                    musicId: 101,
                    trackOrder: 1,
                    addedAt: "2023-01-01T10:00:00Z",
                    music: {
                        id: 101,
                        title: "晴天",
                        singer: "周杰伦",
                        labels: ["Pop"],
                        delabels: [],
                        audioUrl: "/static/audio/101.mp3",
                        coverUrl: "/static/cover/101.jpg",
                        lyricsUrl: "/static/lyrics/101.lrc",
                        duration: 258,
                        playCount: 12450,
                        likeCount: 8900
                    }
                },
                {
                    musicId: 102,
                    trackOrder: 2,
                    addedAt: "2023-01-02T14:30:00Z",
                    music: {
                        id: 102,
                        title: "Hotel California",
                        singer: "Eagles",
                        labels: ["Rock"],
                        delabels: [],
                        audioUrl: "/static/audio/102.mp3",
                        coverUrl: "/static/cover/102.jpg",
                        lyricsUrl: "/static/lyrics/102.lrc",
                        duration: 391,
                        playCount: 98760,
                        likeCount: 45600
                    }
                },
                {
                    musicId: 104,
                    trackOrder: 3,
                    addedAt: "2023-01-03T16:45:00Z",
                    music: {
                        id: 104,
                        title: "Shape of You",
                        singer: "Ed Sheeran",
                        labels: ["Pop"],
                        delabels: [],
                        audioUrl: "/static/audio/104.mp3",
                        coverUrl: "/static/cover/104.jpg",
                        lyricsUrl: "/static/lyrics/104.lrc",
                        duration: 233,
                        playCount: 156780,
                        likeCount: 98700
                    }
                }
            ]
        },
        {
            id: 2,
            name: "摇滚精选",
            description: "震撼人心的摇滚歌曲",
            createdAt: "2023-02-15T14:30:00Z",
            coverUrl: "/static/playlist/2.jpg",
            itemCount: 2,
            playCount: 890,
            items: [
                {
                    musicId: 102,
                    trackOrder: 1,
                    addedAt: "2023-02-15T14:30:00Z",
                    music: {
                        id: 102,
                        title: "Hotel California",
                        singer: "Eagles",
                        labels: ["Rock"],
                        delabels: [],
                        audioUrl: "/static/audio/102.mp3",
                        coverUrl: "/static/cover/102.jpg",
                        lyricsUrl: "/static/lyrics/102.lrc",
                        duration: 391,
                        playCount: 98760,
                        likeCount: 45600
                    }
                },
                {
                    musicId: 105,
                    trackOrder: 2,
                    addedAt: "2023-02-16T09:15:00Z",
                    music: {
                        id: 105,
                        title: "Bohemian Rhapsody",
                        singer: "Queen",
                        labels: ["Rock"],
                        delabels: [],
                        audioUrl: "/static/audio/105.mp3",
                        coverUrl: "/static/cover/105.jpg",
                        lyricsUrl: "/static/lyrics/105.lrc",
                        duration: 354,
                        playCount: 234500,
                        likeCount: 187600
                    }
                }
            ]
        },
        {
            id: 3,
            name: "爵士之夜",
            description: "优雅的爵士乐旋律",
            createdAt: "2023-03-20T20:00:00Z",
            coverUrl: "/static/playlist/3.jpg",
            itemCount: 2,
            playCount: 567,
            items: [
                {
                    musicId: 103,
                    trackOrder: 1,
                    addedAt: "2023-03-20T20:00:00Z",
                    music: {
                        id: 103,
                        title: "Moon River",
                        singer: "Audrey Hepburn",
                        labels: ["Jazz", "Classical"],
                        delabels: [],
                        audioUrl: "/static/audio/103.mp3",
                        coverUrl: "/static/cover/103.jpg",
                        lyricsUrl: "/static/lyrics/103.lrc",
                        duration: 157,
                        playCount: 34500,
                        likeCount: 23400
                    }
                },
                {
                    musicId: 106,
                    trackOrder: 2,
                    addedAt: "2023-03-21T11:20:00Z",
                    music: {
                        id: 106,
                        title: "Fly Me to the Moon",
                        singer: "Frank Sinatra",
                        labels: ["Jazz"],
                        delabels: [],
                        audioUrl: "/static/audio/106.mp3",
                        coverUrl: "/static/cover/106.jpg",
                        lyricsUrl: "/static/lyrics/106.lrc",
                        duration: 148,
                        playCount: 67800,
                        likeCount: 45600
                    }
                }
            ]
        },
        {
            id: 4,
            name: "古典音乐",
            description: "经典古典音乐作品",
            createdAt: "2023-04-10T08:15:00Z",
            coverUrl: "/static/playlist/4.jpg",
            itemCount: 2,
            playCount: 234,
            items: [
                {
                    musicId: 103,
                    trackOrder: 1,
                    addedAt: "2023-04-10T08:15:00Z",
                    music: {
                        id: 103,
                        title: "Moon River",
                        singer: "Audrey Hepburn",
                        labels: ["Jazz", "Classical"],
                        delabels: [],
                        audioUrl: "/static/audio/103.mp3",
                        coverUrl: "/static/cover/103.jpg",
                        lyricsUrl: "/static/lyrics/103.lrc",
                        duration: 157,
                        playCount: 34500,
                        likeCount: 23400
                    }
                },
                {
                    musicId: 107,
                    trackOrder: 2,
                    addedAt: "2023-04-11T13:45:00Z",
                    music: {
                        id: 107,
                        title: "Für Elise",
                        singer: "Beethoven",
                        labels: ["Classical"],
                        delabels: [],
                        audioUrl: "/static/audio/107.mp3",
                        coverUrl: "/static/cover/107.jpg",
                        lyricsUrl: "/static/lyrics/107.lrc",
                        duration: 182,
                        playCount: 89200,
                        likeCount: 67800
                    }
                }
            ]
        }
    ],

    // 用户数据
    users: [
        {
            userId: 1,
            username: "testuser",
            nickname: "音乐爱好者",
            avatar: "/static/avatar/1.jpg",
            favoritePlaylistId: 1, // 收藏歌单ID
            createdAt: "2023-01-01T00:00:00Z"
        }
    ],

    // 歌词数据（模拟歌词文件内容）
    lyrics: {
        101: `[00:00.00] 晴天 - 周杰伦
[00:05.00] 作词：周杰伦
[00:10.00] 作曲：周杰伦
[00:15.00] 编曲：周杰伦
[00:20.00]
[00:25.00] 故事的小黄花
[00:28.00] 从出生那年就飘着
[00:32.00] 童年的荡秋千
[00:35.00] 随记忆一直晃到现在
[00:39.00]
[01:15.00] 为你翘课的那一天
[01:18.00] 花落的那一天
[01:22.00] 教室的那一间
[01:25.00] 我怎么看不见`,

        102: `[00:00.00] Hotel California - Eagles
[00:10.00] On a dark desert highway, cool wind in my hair
[00:20.00] Warm smell of colitas, rising up through the air
[00:30.00] Up ahead in the distance, I saw a shimmering light
[00:40.00] My head grew heavy and my sight grew dim
[00:50.00] I had to stop for the night`,

        103: `[00:00.00] Moon River - Audrey Hepburn
[00:10.00] Moon river, wider than a mile
[00:20.00] I'm crossing you in style some day
[00:30.00] Oh, dream maker, you heart breaker
[00:40.00] Wherever you're goin', I'm goin' your way`,

        // 其他歌曲的歌词...
    },

    // 当前用户状态
    currentUser: {
        userId: 1,
        username: "testuser",
        likedSongs: [101, 104, 106], // 喜欢的歌曲ID列表
        starredSongs: [101, 102], // 收藏的歌曲ID列表
        recentPlayed: [101, 105, 103] // 最近播放的歌曲ID列表
    }
}

// 工具函数
export const getMusicById = (id) => {
    return mockData.musics.find(music => music.id === id)
}

export const getPlaylistById = (id) => {
    return mockData.playlists.find(playlist => playlist.id === id)
}

export const getUserById = (id) => {
    return mockData.users.find(user => user.userId === id)
}

export const getLyricsByMusicId = (id) => {
    return mockData.lyrics[id] || '[00:00.00] 歌词加载中...'
}

export const isSongLiked = (musicId) => {
    return mockData.currentUser.likedSongs.includes(musicId)
}

export const isSongStarred = (musicId) => {
    return mockData.currentUser.starredSongs.includes(musicId)
}

// 更新用户状态
export const updateUserLike = (musicId, like) => {
    if (like) {
        if (!mockData.currentUser.likedSongs.includes(musicId)) {
            mockData.currentUser.likedSongs.push(musicId)
        }
    } else {
        const index = mockData.currentUser.likedSongs.indexOf(musicId)
        if (index > -1) {
            mockData.currentUser.likedSongs.splice(index, 1)
        }
    }
}

export const updateUserStar = (musicId, star) => {
    if (star) {
        if (!mockData.currentUser.starredSongs.includes(musicId)) {
            mockData.currentUser.starredSongs.push(musicId)
        }
    } else {
        const index = mockData.currentUser.starredSongs.indexOf(musicId)
        if (index > -1) {
            mockData.currentUser.starredSongs.splice(index, 1)
        }
    }
}

export default mockData