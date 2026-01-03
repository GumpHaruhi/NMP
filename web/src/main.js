import { createApp } from 'vue'
import { ElMessage } from 'element-plus'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// 导入全局样式
import './style.css'

const app = createApp(App)


app.use(pinia)
app.use(router)
app.use(ElMessage)

app.config.globalProperties.$message = {
  success: (msg) => ElMessage.success({
    message: msg,
    appendTo: document.body,
    offset: 80
  }),
  error: (msg) => ElMessage.error({
    message: msg,
    appendTo: document.body,
    offset: 80
  }),
  warning: (msg) => ElMessage.warning({
    message: msg,
    appendTo: document.body,
    offset: 80
  }),
  info: (msg) => ElMessage.info({
    message: msg,
    appendTo: document.body,
    offset: 80
  })
}

app.mount('#app')