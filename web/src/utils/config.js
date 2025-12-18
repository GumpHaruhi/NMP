// 环境配置
export const CONFIG = {
    // 当前环境：mock | real
    API_MODE: import.meta.env.VITE_API_MODE || 'real',

    // 基础API路径
    BASE_URL: {
        mock: '/api',
        real: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
    },

    // 请求超时时间
    TIMEOUT: 10000,

    // 是否开启调试日志
    DEBUG: import.meta.env.VITE_DEBUG === 'true'
}

// 导出当前配置
export const isMockMode = CONFIG.API_MODE === 'mock'
export const BASE_URL = CONFIG.BASE_URL[CONFIG.API_MODE]