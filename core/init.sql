-- 此脚本将在 PostgreSQL 容器首次启动时自动执行，用于创建索引
-- 索引
CREATE INDEX idx_music_labels_gin ON music USING GIN (labels);
CREATE INDEX idx_music_delabels_gin ON music USING GIN (delabels);