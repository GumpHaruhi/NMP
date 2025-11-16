window.addEventListener('load', () => {
    // 获取所有新旧元素
    const player = document.getElementById('player');
    const songList = document.getElementById('songList');
    const coverArt = document.getElementById('coverArt');
    const lyricsContainer = document.getElementById('lyricsContainer');

    // 1. 从后端 API 获取歌曲列表
    fetch('/api/songs')
        .then(response => response.json())
        .then(songs => {
            // `songs` 现在是一个对象数组: 每项可能有不同的字段命名，支持多种情况

            songs.forEach(song => {
                // 兼容不同的 JSON 命名：musicMessage/musicSource 或 Message/Source
                const msg = song.musicMessage || song.Message || song.message || {};
                const src = song.musicSource || song.Source || song.source || {};

                const id = msg.id || msg.Id || msg.ID;
                const title = msg.title || msg.Title || src.title || 'Unknown';

                const li = document.createElement('li');
                li.textContent = title; // 显示歌曲标题

                // 3. 添加点击事件
                li.addEventListener('click', () => {
                    // Prefer playing by id endpoint. Fallback to provided audio url if id missing.
                    let audioUrl = '';
                    if (id !== undefined && id !== null) {
                        audioUrl = `/api/music/play/${id}`;
                    } else {
                        audioUrl = src.audioUrl || src.AudioURL || src.url || '';
                    }

                    console.log(`Setting player src to: ${audioUrl}`);

                    // A. 播放音频
                    player.src = audioUrl;
                    const playPromise = player.play();

                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.error('Playback failed:', error);
                        });
                    }

                    // B. 更新海报
                    const coverUrl = src.coverUrl || src.CoverURL || src.cover || '';
                    if (coverUrl) {
                        coverArt.src = coverUrl;
                        coverArt.style.display = 'block'; // 显示图片
                    } else {
                        coverArt.style.display = 'none'; // 没有海报则隐藏
                    }

                    // C. 更新歌词
                    const lyricsUrl = src.lyricsUrl || src.LyricsURL || src.lyrics || '';
                    if (lyricsUrl) {
                        lyricsContainer.style.display = 'block'; // 显示歌词框
                        lyricsContainer.textContent = 'Loading lyrics...'; // 占位符

                        // C.1. 异步获取 .lrc 文件
                        fetch(lyricsUrl)
                            .then(response => response.text())
                            .then(text => {
                                // C.2. (MVP) 简单的歌词解析：
                                // 我们暂时只显示纯文本，去掉时间戳 [00:29.26]
                                const lines = text.split('\n');
                                const cleanLines = lines.map(line => {
                                    // 使用正则表达式去掉 [mm:ss.xx] 这样的时间戳
                                    return line.replace(/^\[\d{2}:\d{2}(\.\d+)?\]\s*/, '');
                                });
                                lyricsContainer.textContent = cleanLines.join('\n').trim();
                            })
                            .catch(err => {
                                console.error('Error fetching lyrics:', err);
                                lyricsContainer.textContent = 'Failed to load lyrics.';
                            });
                    } else {
                        lyricsContainer.style.display = 'none'; // 没有歌词则隐藏
                    }

                });

                songList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching songs:', error));
});