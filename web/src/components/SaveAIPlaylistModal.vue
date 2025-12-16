<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>保存AI推荐歌单</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>歌单名称</label>
          <input 
            v-model="formData.name" 
            type="text" 
            class="form-input" 
            placeholder="请输入歌单名称"
            @keyup.enter="handleSave"
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label>歌单描述</label>
          <textarea 
            v-model="formData.description" 
            class="form-textarea" 
            placeholder="请输入歌单描述"
            rows="4"
            :disabled="loading"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <div class="modal-actions">
          <button @click="closeModal" class="btn-cancel" :disabled="loading">
            取消
          </button>
          <button
            @click="handleSave"
            class="btn-confirm"
            :disabled="!formData.name.trim() || loading"
          >
            <span v-if="loading">保存中...</span>
            <span v-else>保存歌单</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  defaultName: {
    type: String,
    default: ''
  },
  defaultDescription: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['save', 'close'])

// 表单数据
const formData = reactive({
  name: '',
  description: ''
})

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.description = ''
}

// 关闭模态框
const closeModal = () => {
  if (!props.loading) {
    resetForm()
    emit('close')
  }
}

// 保存操作
const handleSave = () => {
  if (!formData.name.trim()) {
    return
  }
  emit('save', { ...formData })
}

// 监听可见性变化 - 当模态框打开时设置默认值
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      // 模态框打开时设置默认值
      setDefaultValues()
    } else {
      // 模态框关闭时重置表单
      resetForm()
    }
  }
)

// 监听默认值变化（当模态框已打开但默认值变化时更新）
watch(
  () => props.defaultName,
  (newValue) => {
    if (props.visible) {
      formData.name = newValue || ''
    }
  }
)

watch(
  () => props.defaultDescription,
  (newValue) => {
    if (props.visible) {
      formData.description = newValue || ''
    }
  }
)
</script>

<style scoped>
.modal-overlay {
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
  padding: 20px;
}

.modal-content {
  background: var(--background-card, #ffffff);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-large, 0 20px 60px rgba(0, 0, 0, 0.3));
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-light, #e5e5e7);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary, #1d1d1f);
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted, #86868b);
  transition: color 0.3s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover:not(:disabled) {
  color: var(--text-primary, #1d1d1f);
  background-color: var(--background-secondary, #f5f5f7);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid var(--border-light, #e5e5e7);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary, #1d1d1f);
  font-weight: 500;
  font-size: 14px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-light, #e5e5e7);
  border-radius: 8px;
  background: var(--background-card, #ffffff);
  color: var(--text-primary, #1d1d1f);
  font-size: 14px;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #007aff);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb, 0, 122, 255), 0.1);
}

.form-input:disabled, .form-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--background-secondary, #f5f5f7);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* 模态框按钮样式 */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel, .btn-confirm {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel {
  background: var(--background-secondary, #f5f5f7);
  color: var(--text-primary, #1d1d1f);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--border-light, #e5e5e7);
}

.btn-confirm {
  background: var(--primary-color, #007aff);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--primary-hover, #0051a8);
  transform: translateY(-1px);
}

.btn-cancel:disabled, .btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-confirm {
    width: 100%;
  }
}
</style>