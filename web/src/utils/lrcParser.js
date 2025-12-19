export function parseLRC(lrcText) {
    if (!lrcText || typeof lrcText !== 'string') {
        console.warn('无效的歌词文本')
        return []
    }

    // 更全面的空歌词检测
    const lowerText = lrcText.toLowerCase().trim()
    const emptyLyricPatterns = [
        '纯音乐', '暂无歌词', '无歌词', 'no lyrics', 'instrumental',
        '[]', '【】', '（）', '()', '歌词加载中', 'lrc loading'
    ]

    if (lowerText === '' || emptyLyricPatterns.some(pattern => lowerText.includes(pattern))) {
        console.log('检测到空歌词或纯音乐提示')
        return []
    }

    try {
        // 清理歌词文本
        const cleanedText = lrcText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim()

        const lines = cleanedText.split('\n')
        const result = []

        // 🆕 改进的时间格式正则，支持更多格式
        const timeRegex = /\[(\d{1,2}):(\d{2})([:.](\d{1,3}))?\]/g

        let validLines = 0

        lines.forEach((line, index) => {
            const trimmedLine = line.trim()
            if (!trimmedLine) return

            const matches = [...trimmedLine.matchAll(timeRegex)]
            const text = trimmedLine.replace(timeRegex, '').trim()

            // 🆕 更宽松的文本检查，允许各种歌词内容
            if (matches.length > 0 && text) {
                matches.forEach(match => {
                    try {
                        const minutes = parseInt(match[1]) || 0
                        const seconds = parseInt(match[2]) || 0
                        let milliseconds = 0

                        if (match[3]) {
                            const msStr = match[4] || '00'
                            // 处理不同精度的毫秒
                            if (msStr.length === 2) {
                                milliseconds = parseInt(msStr) * 10 // 00-99 -> 0-990ms
                            } else if (msStr.length === 3) {
                                milliseconds = parseInt(msStr) // 000-999
                            } else {
                                milliseconds = parseInt(msStr.padEnd(3, '0').substring(0, 3)) || 0
                            }
                        }

                        const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000

                        result.push({
                            time: timeInSeconds,
                            text: text,
                            id: `lyric-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        })
                        validLines++
                    } catch (error) {
                        console.warn('解析歌词时间戳失败:', match, error)
                    }
                })
            } else {
                console.log('跳过无时间戳的行:', trimmedLine)
            }
        })

        // 按时间排序并去重
        const sortedResult = result.sort((a, b) => a.time - b.time)
        const uniqueResult = sortedResult.filter((item, index, array) =>
            index === 0 || item.time !== array[index - 1].time || item.text !== array[index - 1].text
        )

        console.log(`解析完成，共${validLines}行匹配，${uniqueResult.length}行有效歌词`)
        return uniqueResult

    } catch (error) {
        console.error('歌词解析过程中发生错误:', error)
        return []
    }
}