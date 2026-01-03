<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="logo">
        <span class="logo-icon">🎵</span>
        <span class="logo-text">NMP音乐</span>
      </router-link>
    </div>

    <nav class="header-nav">
      <router-link to="/" class="nav-link">发现音乐</router-link>
      <router-link to="/profile" class="nav-link">我的音乐</router-link>
    </nav>

    <div class="header-right">
      <GlobalColorPicker />
      <div class="search-box">
        <input type="text" placeholder="搜索音乐..." class="search-input">
        <button class="search-btn">🔍</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import GlobalColorPicker from './GlobalColorPicker.vue'
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 1.5em;
  font-weight: bold;
  color: var(--primary-color);
}

.logo-icon {
  font-size: 1.2em;
}

.header-nav {
  display: flex;
  gap: 30px;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.nav-link:hover, .nav-link.router-link-active {
  background: var(--primary-color);
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 4px;
}

.search-input {
  border: none;
  background: none;
  outline: none;
  padding: 6px 12px;
  width: 200px;
}

.search-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.search-btn:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 10px;
  }

  .header-nav {
    gap: 15px;
  }

  .search-input {
    width: 150px;
  }

  .logo-text {
    display: none;
  }
}
</style>