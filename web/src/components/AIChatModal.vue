<template>
  <div v-if="visible" class="chat-modal-overlay" @click.self="close">
    <div class="chat-modal">
      <div class="chat-modal-header">
        <h3>🤖 魔法师对话</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="chat-modal-body">
        <div class="chat-messages" ref="messagesRef">
          <div v-for="(message, index) in chatHistory" :key="index"
               class="chat-message" :class="message.role">
            <div class="message-avatar">
              {{ message.role === 'ai' ? '🧙' : '👤' }}
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div v-if="message.playlist" class="playlist-suggestion">
                <div class="suggestion-header">🎵 推荐歌单</div>
                <div class="suggestion-body">
                  <div class="suggestion-cover">
                    <div class="cover-icon">🎵</div>
                  </div>
                  <div class="suggestion-info">
                    <h4>{{ message.playlist.name }}</h4>
                    <p>{{ message.playlist.songCount }} 首歌曲</p>
                  </div>
                </div>
                <div class="suggestion-actions">
                  <button @click="$emit('use-ai-playlist', message.playlist)">
                    立即播放
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="loadingAI" class="chat-message ai">
            <div class="message-avatar">🧙</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div class="input-wrapper">
            <input
                v-model="userInput"
                type="text"
                placeholder="告诉魔法师你的需求..."
                @keyup.enter="sendMessage"
                :disabled="loadingAI"
                class="chat-input"
            />
            <button
                class="send-btn"
                @click="sendMessage"
                :disabled="!userInput.trim() || loadingAI"
            >
              发送
            </button>
          </div>
          <div class="quick-prompts">
            <div class="prompts-label">快速提问：</div>
            <div class="prompts-grid">
              <button
                  v-for="prompt in quickPrompts"
                  :key="prompt"
                  class="prompt-btn"
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
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  loadingAI: {
    type: Boolean,
    default: false
  },
  chatHistory: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'close',
  'send-message',
  'use-quick-prompt',
  'use-ai-playlist'
])

// 响应式数据
const userInput = ref('')
const messagesRef = ref(null)

const quickPrompts = [
  '适合学习的轻音乐',
  '运动时听的电子音乐',
  '睡前放松的钢琴曲',
  '适合派对的动感音乐',
  '早晨唤醒活力的歌',
  '雨天适合听的歌',
  '适合开车听的音乐',
  '经典怀旧老歌'
]

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

// 发送消息
const sendMessage = () => {
  if (!userInput.value.trim() || props.loadingAI) return

  const message = userInput.value.trim()
  emit('send-message', message)
  userInput.value = ''
  scrollToBottom()
}

// 使用快速提示
const useQuickPrompt = (prompt) => {
  userInput.value = prompt
  sendMessage()
}

// 关闭模态框
const close = () => {
  emit('close')
}

// 监听聊天历史变化，自动滚动
watch(() => props.chatHistory, scrollToBottom, { deep: true })
</script>

<style scoped>
.chat-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.chat-modal {
  width: 500px;
  max-height: 80vh;
  background: white;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.chat-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.chat-modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-message {
  display: flex;
  gap: 12px;
  animation: slideIn 0.3s ease;
}

.chat-message.user {
  flex-direction: row-reverse;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  background: var(--secondary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: var(--primary-color);
  color: white;
}

.message-content {
  max-width: 70%;
}

.chat-message.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  background: var(--secondary-color);
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.chat-message.user .message-text {
  background: var(--primary-color);
  color: white;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 4px;
}

.playlist-suggestion {
  margin-top: 8px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.suggestion-header {
  padding: 8px 12px;
  background: var(--secondary-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.suggestion-body {
  display: flex;
  padding: 12px;
  gap: 12px;
  align-items: center;
}

.suggestion-cover {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-icon {
  font-size: 24px;
  color: white;
}

.suggestion-info {
  flex: 1;
}

.suggestion-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.suggestion-info p {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.suggestion-actions {
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.suggestion-actions button {
  padding: 6px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggestion-actions button:hover {
  background: var(--primary-hover);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--text-secondary);
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.chat-input-area {
  border-top: 1px solid var(--border-color);
  padding: 20px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.chat-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input:disabled {
  background: var(--secondary-color);
  cursor: not-allowed;
}

.send-btn {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-prompts {
  margin-top: 16px;
}

.prompts-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.prompt-btn {
  padding: 8px 12px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.prompt-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.prompt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
