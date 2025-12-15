// src/utils/lrcParser.js
export function parseLRC(lrcText) {
    const lines = lrcText.split('\n');
    const lyrics = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

    lines.forEach((line) => {
        const timeMatches = [...line.matchAll(timeRegex)];
        const text = line.replace(timeRegex, '').trim();

        if (timeMatches.length > 0 && text) {
            timeMatches.forEach((match) => {
                const minutes = parseFloat(match[1]);
                const seconds = parseFloat(match[2]);
                const milliseconds = parseFloat(match[3]) / (match[3].length === 2 ? 100 : 1000);
                const time = minutes * 60 + seconds + milliseconds / 1000;
                lyrics.push({ time, text });
            });
        }
    });
    return lyrics.sort((a, b) => a.time - b.time);
}