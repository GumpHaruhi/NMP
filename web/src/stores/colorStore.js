import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'

export const useColorStore =
    defineStore('color', () => {
    // 预设配色方案
    const presetColors = [
        { primary: '#e74c3c', secondary: '#ecf0f1', accent: '#3498db', name: '热情红' },
        { primary: '#3498db', secondary: '#ecf0f1', accent: '#e74c3c', name: '科技蓝' },
        { primary: '#9b59b6', secondary: '#ecf0f1', accent: '#f1c40f', name: '优雅紫' },
        { primary: '#e67e22', secondary: '#fdfefe', accent: '#3498db', name: '活力橙' },
        { primary: '#34495e', secondary: '#f8f9fa', accent: '#e74c3c', name: '深邃灰' }
    ]

    // 当前配色
    const currentColor = ref(loadFromLocalStorage()||presetColors[0])

    // 自定义颜色
    const customColor = ref({
        primary: '#e74c3c',
        secondary: '#ecf0f1',
        accent: '#3498db'
    })
        // 从localStorage加载配色
        // 从localStorage加载配色
        function loadFromLocalStorage() {
            try {
                const saved = localStorage.getItem('colorScheme')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // 验证数据完整性
                    if (parsed.primary && parsed.secondary && parsed.accent && parsed.name) {
                        console.log('从localStorage加载配色:', parsed)
                        return parsed
                    }
                }
            } catch (error) {
                console.error('从localStorage加载配色失败:', error)
            }
            return null
        }

        // 保存到localStorage
    function saveToLocalStorage() {
        try {
                localStorage.setItem('colorScheme', JSON.stringify(currentColor.value))
                console.log('配色已保存到localStorage:', currentColor.value)
        } catch (error) {
                console.error('保存到localStorage失败:', error)
        }
    }
    // 计算样式变量
    const colorStyles = computed(() => {
        console.log('颜色样式更新:', currentColor.value) // 调试日志
        return {
            '--primary-color': currentColor.value.primary,
            '--secondary-color': currentColor.value.secondary,
            '--accent-color': currentColor.value.accent,
            '--primary-hover': adjustBrightness(currentColor.value.primary, -20),
            '--accent-hover': adjustBrightness(currentColor.value.accent, -20),
            '--text-primary': '#2c3e50',
            '--text-secondary': '#7f8c8d',
            '--border-color': adjustBrightness(currentColor.value.secondary, -10),
            '--shadow-color': 'rgba(0, 0, 0, 0.1)'
        }
    })

    // 调整亮度函数
    function adjustBrightness(hex, percent) {
        // 移除 # 号
        hex = hex.replace(/^#/, '')

        // 解析 RGB
        let r = parseInt(hex.substring(0, 2), 16)
        let g = parseInt(hex.substring(2, 4), 16)
        let b = parseInt(hex.substring(4, 6), 16)

        // 调整亮度
        r = Math.max(0, Math.min(255, r + (r * percent / 100)))
        g = Math.max(0, Math.min(255, g + (g * percent / 100)))
        b = Math.max(0, Math.min(255, b + (b * percent / 100)))

        // 转回十六进制
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
    }

    // 设置配色方案
    function setColorScheme(color) {
        console.log('设置配色方案:', color) // 调试日志
        currentColor.value = { ...color }
        // 保存到本地存储
        localStorage.setItem('colorScheme', JSON.stringify(currentColor.value))

        // 强制更新DOM
        updateDOMStyles()
    }

    // 应用自定义颜色
    function applyCustomColor() {
        console.log('应用自定义颜色:', customColor.value) // 调试日志
        setColorScheme({
            ...customColor.value,
            name: '自定义'
        })
    }

    // 直接更新DOM样式
    function updateDOMStyles() {
        const styles = colorStyles.value
        const root = document.documentElement

        Object.entries(styles).forEach(([key, value]) => {
            root.style.setProperty(key, value)
        })

        console.log('DOM样式已更新') // 调试日志
    }

    // 初始化
    onMounted(() => {
        try {
            const saved = localStorage.getItem('colorScheme')
            if (saved) {
                const parsed = JSON.parse(saved)
                // 确保解析后的对象有正确的结构
                if (parsed.primary && parsed.secondary && parsed.accent) {
                    currentColor.value = parsed
                }
            }
        } catch (error) {
            console.error('加载配色方案失败:', error)
        }
        updateDOMStyles()
    })

    // 重置为默认
    function resetToDefault() {
        setColorScheme(presetColors[0])
    }

    // 获取当前配色名称
    const currentColorName = computed(() => currentColor.value.name)

    return {
        presetColors,
        currentColor,
        customColor,
        colorStyles,
        currentColorName,
        setColorScheme,
        applyCustomColor,
        resetToDefault
    }
})