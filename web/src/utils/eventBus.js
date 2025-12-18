// /src/utils/eventBus.js
import { ref } from 'vue'

// 创建全局事件总线
const events = ref({})

const eventBus = {
    // 监听事件
    $on(event, callback) {
        if (!events.value[event]) {
            events.value[event] = []
        }
        events.value[event].push(callback)
    },

    // 触发事件
    $emit(event, ...args) {
        const callbacks = events.value[event]
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(...args)
                } catch (error) {
                    console.error(`事件处理错误 ${event}:`, error)
                }
            })
        }
    },

    // 移除事件监听
    $off(event, callback) {
        const callbacks = events.value[event]
        if (callbacks) {
            if (callback) {
                events.value[event] = callbacks.filter(cb => cb !== callback)
            } else {
                events.value[event] = []
            }
        }
    },

    $audio: {
        // 请求播放权限
        requestPlay(source) {
            eventBus.$emit('audio:request-play', {
                source,
                timestamp: Date.now()
            })
        },

        // 通知音频开始播放
        notifyPlaying(song, source) {
            eventBus.$emit('audio:playing', {
                song,
                source,
                timestamp: Date.now()
            })
        },

        // 通知音频暂停
        notifyPaused(source) {
            eventBus.$emit('audio:paused', {
                source,
                timestamp: Date.now()
            })
        }
    }
}

export default eventBus