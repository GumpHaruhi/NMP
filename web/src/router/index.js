import { createRouter, createWebHistory } from 'vue-router'
const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: {
            title: '首页',
            showBottomPlayerBar: true// 显示底栏

        }
    },
    {
        path: '/player',
        name: 'Player',
        component: () => import('@/views/Player.vue'),
        meta: {
            title: '播放器',
            showBottomPlayerBar: false // 隐藏全局底栏（播放页面有自己的底栏）
        }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人主页' }
    },
    {
        path: '/playlist/:id',
        name: 'PlaylistDetail',
        component: () => import('../views/PlayListDetail.vue'), // 注意组件路径和名称
        props: true,
        meta: {
            title: '歌单详情 - NMP音乐播放器',
            requiresAuth: false,
            keepAlive: true
        }
    },
    {
        path: '/temp-playlist',
        name: 'TempPlaylist',
        component: () => import('@/views/TempPlaylistDetail.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router