<template>
  <div class="ai-chat-panel">
    <!-- 消息列表 -->
    <div ref="messagesEl" class="chat-messages">
      <div v-if="messages.length === 0" class="chat-empty">
        <el-icon class="empty-icon"><MagicStick /></el-icon>
        <p>描述你想要的页面，AI 会帮你生成并渲染到画布上</p>
        <div class="chat-examples">
          <div
            v-for="example in examples"
            :key="example"
            class="chat-example"
            @click="sendExample(example)"
          >
            {{ example }}
          </div>
        </div>
      </div>

      <div v-for="(msg, index) in messages" :key="index" class="chat-message" :class="msg.role">
        <div class="message-avatar">
          <el-icon v-if="msg.role === 'assistant'"><MagicStick /></el-icon>
          <el-icon v-else><User /></el-icon>
        </div>
        <div class="message-body">
          <div class="message-text">{{ msg.content }}</div>
          <div v-if="msg.applied" class="message-tag">已应用到画布</div>
        </div>
      </div>

      <div v-if="loading" class="chat-message assistant">
        <div class="message-avatar"><el-icon><MagicStick /></el-icon></div>
        <div class="message-body">
          <div class="message-loading">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="chat-error">
      <el-icon><Warning /></el-icon>
      {{ error }}
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="2"
        :disabled="loading"
        placeholder="描述你想要的修改..."
        resize="none"
        @keydown.enter.exact.prevent="handleSend"
      />
      <div class="chat-input-actions">
        <span class="input-hint">Enter 发送，Shift+Enter 换行</span>
        <div>
          <el-button size="small" text @click="clearChat" :disabled="loading || messages.length === 0">
            清空
          </el-button>
          <el-button size="small" type="primary" :loading="loading" :disabled="!inputText.trim()" @click="handleSend">
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { MagicStick, User, Warning } from '@element-plus/icons-vue'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { chatWithAI } from '@/utils/aiChat'
import type { ChatMessage } from '@/utils/aiChat'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()

const messages = ref<(ChatMessage & { applied?: boolean })[]>([])
const inputText = ref('')
const loading = ref(false)
const error = ref('')
const messagesEl = ref<HTMLElement>()

const examples = [
  '搭建一个登录页面',
  '做一个商品展示页',
  '帮我加一个蓝色的提交按钮',
]

const scrollToBottom = async () => {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

const sendExample = (text: string) => {
  inputText.value = text
  handleSend()
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  error.value = ''
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    // 把 AI 消息历史（不含 applied 字段）传给后端，同时附上当前页面组件状态
    const history = messages.value
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map(({ role, content }) => ({ role, content }))

    const currentComponents = editorStore.currentPage?.components ?? []

    const result = await chatWithAI(history, currentComponents)

    messages.value.push({ role: 'assistant', content: result.message, applied: true })

    // 应用到画布
    editorStore.createNewPage(editorStore.currentPage?.title ?? 'AI 生成页面')
    historyStore.clearHistory()
    result.components.forEach((comp) => {
      editorStore.addComponent(comp.type, { ...comp.style, ...comp.props })
    })
  } catch (err) {
    error.value = (err as Error).message ?? '请求失败，请检查后端服务是否启动'
    messages.value.pop() // 移除刚刚加的用户消息，让用户重试
    inputText.value = text
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

const clearChat = () => {
  messages.value = []
  error.value = ''
}
</script>

<style scoped>
.ai-chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  text-align: center;
  padding: 16px;
}

.empty-icon {
  font-size: 32px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.chat-empty p {
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 16px;
}

.chat-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.chat-example {
  padding: 8px 12px;
  font-size: 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  color: #606266;
  transition: all 0.2s;
}

.chat-example:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #409eff;
}

.chat-message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  background: #ecf5ff;
  color: #409eff;
}

.chat-message.user .message-avatar {
  background: #f0f9eb;
  color: #67c23a;
}

.message-body {
  max-width: calc(100% - 40px);
}

.message-text {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  background: #f5f7fa;
  color: #303133;
}

.chat-message.user .message-text {
  background: #409eff;
  color: white;
}

.message-tag {
  margin-top: 4px;
  font-size: 11px;
  color: #67c23a;
}

.message-loading {
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.message-loading span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #909399;
  animation: blink 1.2s infinite;
}

.message-loading span:nth-child(2) { animation-delay: 0.2s; }
.message-loading span:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.chat-error {
  margin: 0 12px;
  padding: 8px 12px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  font-size: 12px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-input-area {
  border-top: 1px solid #e0e0e0;
  padding: 10px;
  background: white;
}

.chat-input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.input-hint {
  font-size: 11px;
  color: #c0c4cc;
}
</style>
