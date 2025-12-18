export function parseLRC(lrcText) {
    if (!lrcText || typeof lrcText !== 'string') {
        console.warn('无效的歌词文本')
        return []
    }

    // 清理歌词文本
    const cleanedText = lrcText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()

    const lines = cleanedText.split('\n')
    const result = []

    // 支持更多时间格式
    const timeRegex = /\[(\d{1,2}):(\d{2})([:.](\d{2,3}))?\]/g

    lines.forEach((line, index) => {
        if (!line.trim()) return

        const matches = [...line.matchAll(timeRegex)]
        const text = line.replace(timeRegex, '').trim()

        if (matches.length > 0 && text) {
            matches.forEach(match => {
                try {
                    const minutes = parseInt(match[1]) || 0
                    const seconds = parseInt(match[2]) || 0
                    let milliseconds = 0

                    if (match[3]) {
                        const msStr = match[4] || '00'
                        milliseconds = parseFloat(msStr) / (msStr.length === 2 ? 100 : 1000)
                    }

                    const timeInSeconds = minutes * 60 + seconds + milliseconds

                    result.push({
                        time: timeInSeconds,
                        text: text,
                        id: `lyric-${index}-${minutes}_${seconds}_${milliseconds}`
                    })
                } catch (error) {
                    console.warn('解析歌词时间戳失败:', match, error)
                }
            })
        }
    })

    // 按时间排序并去重
    const sortedResult = result.sort((a, b) => a.time - b.time)
    const uniqueResult = sortedResult.filter((item, index, array) =>
        index === 0 || item.time !== array[index - 1].time
    )

    console.log(`解析完成，共${uniqueResult.length}行歌词`)
    return uniqueResult
}