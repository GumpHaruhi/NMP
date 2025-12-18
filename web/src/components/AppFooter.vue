<template>
  <footer class="home-footer">
    <div class="footer-content">
      <div class="footer-left">
        <h3 class="app-title">音乐播放器</h3>
        <p class="app-tagline">发现属于你的音乐世界</p>
      </div>
      <div class="footer-center">
        <div class="footer-links">
          <a href="#" class="footer-link">关于我们</a>
          <a href="#" class="footer-link">帮助中心</a>
          <a href="#" class="footer-link">隐私政策</a>
          <a href="#" class="footer-link">服务条款</a>
        </div>
        <p class="copyright">© 2023 音乐播放器 版权所有</p>
      </div>
      <div class="footer-right">
        <a href="#" class="social-icon">📱</a>
        <a href="#" class="social-icon">🐦</a>
        <a href="#" class="social-icon">📘</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 这是一个纯展示组件，没有业务逻辑
</script>

<style scoped>
.home-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  padding: 24px;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left .app-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.footer-left .app-tagline {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

.footer-center {
  text-align: center;
}

.footer-links {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.3s;
}

.footer-link:hover {
  color: var(--primary-color);
}

.copyright {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.footer-right {
  display: flex;
  gap: 16px;
}

.social-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 18px;
  text-decoration: none;
  transition: all 0.3s;
}

.social-icon:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-3px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .footer-left,
  .footer-right {
    width: 100%;
    justify-content: center;
  }

  .footer-links {
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
  }
}
</style>