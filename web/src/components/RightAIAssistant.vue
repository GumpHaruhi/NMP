<template>
  <div class="right-sidebar">
    <div class="section-header">
      <h2>🤖 音乐助手</h2>
    </div>

    <div class="ai-assistant">
      <div class="ai-avatar">
        <div class="avatar-animation">
          <div class="ai-avatar-icon">🤖</div>
        </div>
      </div>

      <!-- 聊天历史 -->
      <!-- <div v-if="showChatHistory" class="chat-history" ref="chatHistoryRef">
        <div v-for="(message, index) in chatHistory" :key="index" class="chat-message" :class="message.role">
          <div class="message-content">{{ message.content }}</div> -->
          <!-- 如果有歌单推荐，显示歌单预览 -->
          <!-- <div v-if="message.playlist" class="quick-playlist" @click="$emit('use-ai-playlist', message.playlist)">
            <div class="quick-playlist-cover">
              <div class="quick-cover-icon">🎵</div>
            </div>
            <div class="quick-playlist-info">
              <h5>{{ message.playlist.name }}</h5>
              <p>{{ message.playlist.songCount }} 首歌曲</p>
            </div>
            <button class="quick-play-btn">播放</button>
          </div>
        </div>
      </div> -->

      <div class="ai-chat">
        <div>
          <div class="input-wrapper">
            <input
              v-model="userInput"
              type="text"
              placeholder="例如：适合学习的轻音乐..."
              class="chat-input"
              @keyup.enter="sendMessage"
              :disabled="loadingAI"
            />
            <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim() || loadingAI">
              <SendIcon class="send-icon" />
            </button>
          </div>
        </div>

        <div class="quick-prompts">
          <div class="prompts-header">试试这样说：</div>
          <div class="prompts-grid">
            <button
              v-for="prompt in quickPrompts"
              :key="prompt"
              class="prompt-bubble"
              @click="useQuickPrompt(prompt)"
              :disabled="loadingAI"
            >
              {{ prompt }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SendIcon from '@/assets/icons/SendIcon.vue'

const props = defineProps({
  loadingAI: {
    type: Boolean,
    default: false
  },
  showChatHistory: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['send-message', 'use-ai-playlist', 'use-quick-prompt'])

// 响应式数据
const userInput = ref('')
const chatHistoryRef = ref(null)

// 快速提示
const quickPrompts = ref([
  '适合学习的轻音乐',
  '运动时听的电子音乐',
  '睡前放松的钢琴曲',
  '开车时听的节奏感强的歌',
  '雨天适合听的歌',
  '80年代复古金曲',
  '适合派对的动感音乐',
  '早晨唤醒活力的歌'
])

// 聊天历史 - 这里只做展示，实际数据从父组件传入
const chatHistory = computed(() => {
  // 默认的AI问候
  return [
    {
      role: 'ai',
      content: '你好！我是你的音乐助手。告诉我你的心情或需求，我可以为你推荐音乐或生成歌单。'
    }
  ]
})

// 发送消息
const sendMessage = () => {
  if (!userInput.value.trim() || props.loadingAI) return
  
  const message = userInput.value.trim()
  emit('send-message', message)
  userInput.value = ''
}

// 使用快速提示
const useQuickPrompt = (prompt) => {
  userInput.value = prompt
}

// 清空输入
const clearInput = () => {
  userInput.value = ''
}
</script>

<style scoped>
.right-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.ai-assistant {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-animation {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: float 3s ease-in-out infinite;
}

.ai-avatar-icon {
  font-size: 36px;
}

/* 聊天区域 */
.ai-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  padding: 16px;
  background: var(--secondary-color);
  border-radius: 16px;
  margin-bottom: 16px;
}

.chat-history::-webkit-scrollbar {
  display: none;
}

.chat-history {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.chat-message {
  margin-bottom: 12px;
}

.chat-message.ai {
  text-align: left;
}

.chat-message.user {
  text-align: right;
}

.message-content {
  display: inline-block;
  padding: 10px 16px;
  border-radius: 18px;
  max-width: 80%;
  font-size: 14px;
  line-height: 1.4;
}

.chat-message.ai .message-content {
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.chat-message.user .message-content {
  background: var(--primary-color);
  color: white;
  border-bottom-right-radius: 4px;
}

.quick-playlist {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  margin-top: 8px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-playlist:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.quick-playlist-cover {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-cover-icon {
  color: white;
  font-size: 20px;
}

.quick-playlist-info {
  flex: 1;
}

.quick-playlist-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.quick-playlist-info p {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.quick-play-btn {
  padding: 4px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.quick-play-btn:hover {
  background: var(--primary-hover);
}

/* AI聊天输入容器 */
.chat-input-container {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.chat-input-container:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--primary-rgb), 0.2);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 8px 8px 8px 20px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
  transform: translateY(-1px);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 10px 0;
  color: var(--text-primary);
  background: transparent;
  min-width: 0;
  font-family: inherit;
  line-height: 1.5;
}

.chat-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.chat-input:focus::placeholder {
  opacity: 0.4;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 发送按钮 */
.send-btn {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
}

.send-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
  transparent,
  rgba(255, 255, 255, 0.2),
  transparent);
  transition: left 0.5s ease;
}

.send-btn:hover:not(:disabled)::before {
  left: 100%;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.3);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(var(--primary-rgb), 0.2);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, var(--border-color), var(--border-color));
  box-shadow: none;
  transform: none !important;
}

.send-btn:disabled::before {
  display: none;
}

.send-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.send-btn:not(:disabled):hover .send-icon {
  transform: translateX(2px) scale(1.1);
}

/* 快速提示样式优化 */
.quick-prompts {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

.prompts-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompts-header::before {
  content: '💡';
  font-size: 16px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.prompt-bubble {
  padding: 10px 14px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  line-height: 1.4;
}

.prompt-bubble:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
}

.prompt-bubble:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-input-container {
    padding: 16px;
    margin-top: 16px;
  }

  .input-wrapper {
    padding: 6px 6px 6px 16px;
  }

  .chat-input {
    font-size: 14px;
    padding: 8px 0;
  }

  .send-btn {
    width: 44px;
    height: 44px;
  }

  .prompts-grid {
    grid-template-columns: 1fr;
  }

  .prompt-bubble {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .chat-history {
    max-height: 200px;
  }
}
</style>