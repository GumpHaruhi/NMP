-- 此脚本将在 PostgreSQL 容器首次启动时自动执行

-- 1. 创建 music 表
-- 使用 TEXT[] (文本数组) 来存储标签，它灵活且可被索引
CREATE TABLE music (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    singer VARCHAR(255) NOT NULL,
    audio_path TEXT NOT NULL, 
    cover_path TEXT,
    lyrics_path TEXT,
    labels TEXT[],
    delabels TEXT[]
);

-- 2. 创建 users 表 (为未来的推荐功能准备)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建 user_interactions 表 (为推荐功能准备)
CREATE TABLE user_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    music_id INTEGER NOT NULL REFERENCES music(id),
    action VARCHAR(50) NOT NULL, -- 'play', 'like', 'dislike', 'skip'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 user_preferences 表 (为推荐功能准备)
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    selected_labels TEXT[]
);

-- 在这里插入歌曲的信息
INSERT INTO music (title, singer, audio_path, cover_path, lyrics_path, labels, delabels)
VALUES 
    ('晴天', '周杰伦', 'qingtian.mp3', 'temp.jpg', 'qingtian.lrc', ARRAY['Pop', 'Rock'], ARRAY['HipHop']),
    ('可惜没如果', '林俊杰', 'noifs.mp3', 'temp.jpg', 'noifs.lrc', ARRAY['HipHop'], ARRAY['HipHop', 'Rock']),
    ('嘉宾', '张远', 'guest.mp3', 'temp.jpg', 'guest.lrc', ARRAY['Pop'], ARRAY['HipHop', 'Rock']),
    ('不是因为寂寞才想你', 'T.R.Y', 'TRY.mp3', 'temp.jpg', 'TRY.lrc', ARRAY['Pop'], ARRAY['HipHop', 'Rock']);

