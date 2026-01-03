// 格式化时间（秒 -> 分:秒）
export const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 防抖函数
export const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// 生成随机ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 格式化日期
export const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDate('zh-CN')
}