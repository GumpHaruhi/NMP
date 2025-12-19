// utils/AudioEngine.js
class AudioEngine {
    constructor() {
        this.audioContext = null
        this.audioElement = new Audio()
        this.audioNodes = {}
        this.isInitialized = false
        this.isPlaying = false
        this.currentTime = 0
        this.duration = 0
        this.volume = 0.8

        // 音频分析节点（用于可视化）
        this.analyser = null

        this.init()
    }

    async init() {
        try {
            // 初始化AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

            // 创建音频节点链
            this.source = this.audioContext.createMediaElementSource(this.audioElement)
            this.gainNode = this.audioContext.createGain()
            this.analyser = this.audioContext.createAnalyser()

            // 连接节点：source -> gain -> analyser -> destination
            this.source.connect(this.gainNode)
            this.gainNode.connect(this.analyser)
            this.analyser.connect(this.audioContext.destination)

            // 配置分析器
            this.analyser.fftSize = 256

            this.isInitialized = true


            // 绑定事件
            this.bindEvents()
        } catch (error) {
            console.error('AudioEngine初始化失败:', error)
        }
    }

    bindEvents() {
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration
            this.emit('durationchange', this.duration)
        })

        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime
            this.emit('timeupdate', this.currentTime)
        })

        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true
            this.emit('play')
        })

        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false
            this.emit('pause')
        })

        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false
            this.emit('ended')
        })

        this.audioElement.addEventListener('error', (e) => {
            this.emit('error', e.error)
        })
    }

    // 播放控制方法
    async load(url) {
        if (!this.isInitialized) await this.init()

        this.audioElement.src = url
        await this.audioElement.load()
    }

    async play() {
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume()
        }
        await this.audioElement.play()
    }

    pause() {
        this.audioElement.pause()
    }

    seek(time) {
        this.audioElement.currentTime = time
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume))
        this.gainNode.gain.value = this.volume
    }

    // 事件系统
    events = {}
    on(event, callback) {
        if (!this.events[event]) this.events[event] = []
        this.events[event].push(callback)
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback)
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`AudioEngine事件处理错误:`, error)
                }
            })
        }
    }

    // 获取音频数据用于可视化
    getAudioData() {
        if (!this.analyser) return null

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        this.analyser.getByteFrequencyData(dataArray)
        return dataArray
    }

    // 清理资源
    destroy() {
        this.audioElement.pause()
        this.audioElement.src = ''

        if (this.audioContext) {
            this.audioContext.close()
        }

        this.events = {}
    }
}

export default AudioEngine