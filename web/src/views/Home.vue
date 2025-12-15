<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <header class="home-header">
      <div class="header-left">
        <h1 class="app-title">音乐播放器</h1>
      </div>
      <div class="header-right">
        <!-- 用户头像按钮 -->
        <button class="avatar-btn" @click="goToProfile">

        </button>
      </div>
    </header>

    <!-- 主页内容区域（留空，由您开发） -->
    <main class="home-content">
      <!-- 您的主页内容将在这里开发 -->
      <div class="placeholder-content">
        <h2>主页内容区域</h2>
        <p>这里将由您开发主页的具体内容</p>
      </div>
    </main>

    <!-- 底部音乐播放栏组件 -->
    <BottomPlayerBar
        :currentMusic="currentMusic"
        :isPlaying="isPlaying"
        @togglePlay="togglePlay"
        @openPlayer="openPlayer"
    />
  </div>
</template>

<script>
// 导入底部播放栏组件
import BottomPlayerBar from '../components/BottomPlayerBar..vue'

export default {
  name: 'Home',
  components: {
    BottomPlayerBar
  },
  data() {
    return {
      // 模拟用户数据
      user: {
        id: 1,
        username: '音乐爱好者',
        avatar: '/static/avatar/default.jpg'
      },
      // 模拟当前播放的歌曲
      currentMusic: {
        id: 101,
        title: '晴天',
        singer: '周杰伦',
        coverUrl: '/static/cover/101.jpg',
        duration: 258
      },
      // 播放状态
      isPlaying: false
    }
  },
  methods: {
    // 跳转到个人主页
    goToProfile() {
      this.$router.push('/profile')
    },
    // 切换播放状态
    togglePlay() {
      this.isPlaying = !this.isPlaying
    },
    // 打开播放器页面
    openPlayer() {
      this.$router.push('/play')
    }
  }
}
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #ec4141;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-left .app-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.avatar-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.avatar-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.home-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #666;
}

.placeholder-content h2 {
  margin-bottom: 10px;
  color: #333;
}
</style>