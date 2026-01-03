<template>
  <div class="recommend-main">
    <!-- 推荐歌单 -->
    <section class="recommended-playlists">
      <div class="section-header">
        <div class="header-left">
          <h2>📚 推荐歌单</h2>
          <p class="section-description">根据你的喜好精心挑选</p>
        </div>
        <button class="refresh-btn" @click="$emit('refresh-playlists')">
          <RefreshIcon class="refresh-icon" />
          换一批
        </button>
      </div>

      <div class="playlists-grid">
        <PlaylistCard
          v-for="playlist in recommendedPlaylists"
          :key="playlist.id"
          :playlist="playlist"
          @click="$emit('goto-playlist', playlist.id)"
        />
      </div>
    </section>

    <!-- 推荐歌曲 -->
    <section class="recommended-songs">
      <div class="section-header">
        <div class="header-left">
          <h2>🎧 今日推荐歌曲</h2>
          <p class="section-description">发现你可能喜欢的新音乐</p>
        </div>
        <button class="play-all-btn" @click="$emit('play-all-recommended-songs')">
          <PlayIcon class="btn-icon" />
          播放全部
        </button>
      </div>

      <div class="songs-list">
        <SongItem
          v-for="(song, index) in recommendedSongs"
          :key="song.id"
          :song="song"
          :track-order="index + 1"
          @play="$emit('play-song', song)"
        />
      </div>
    </section>

    <!-- 热门歌单 -->
    <section class="popular-playlists">
      <div class="section-header">
        <h2>🔥 热门歌单</h2>
        <p class="section-description">大家都在听什么</p>
      </div>

      <div class="playlists-grid">
        <PlaylistCard
          v-for="playlist in popularPlaylists"
          :key="playlist.id"
          :playlist="playlist"
          @click="$emit('goto-playlist', playlist.id)"
        />
      </div>
    </section>

    <!-- 新歌速递 -->
    <section class="new-songs">
      <div class="section-header">
        <h2>🎶 新歌速递</h2>
        <p class="section-description">最新发布的音乐</p>
      </div>

      <div class="songs-list">
        <SongItem
          v-for="(song, index) in newSongs"
          :key="song.id"
          :song="song"
          :track-order="index + 1"
          @play="$emit('play-song', song)"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import PlaylistCard from '@/components/PlaylistCard.vue'
import SongItem from '@/components/SongItem.vue'
import PlayIcon from '@/assets/icons/PlayIcon.vue'
import RefreshIcon from '@/assets/icons/RefreshIcon.vue'

const props = defineProps({
  recommendedPlaylists: {
    type: Array,
    default: () => []
  },
  recommendedSongs: {
    type: Array,
    default: () => []
  },
  popularPlaylists: {
    type: Array,
    default: () => []
  },
  newSongs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'refresh-playlists',
  'goto-playlist',
  'play-all-recommended-songs',
  'play-song'
])
</script>

<style scoped>
.recommend-main {
  padding: 24px;
  flex: 1;
  width: 100%;
  margin: auto;
}

section {
  margin-bottom: 40px;
  animation: fadeIn 0.6s ease;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.section-header .header-left {
  flex: 1;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
}

/* 刷新按钮 */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

/* 播放全部按钮 */
.play-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--primary-color);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-all-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 歌单网格 */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 歌曲列表 */
.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .playlists-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .recommend-main {
    padding: 16px;
  }
  
  .playlists-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .section-header .refresh-btn,
  .section-header .play-all-btn {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .playlists-grid {
    grid-template-columns: 1fr;
  }
}
</style>