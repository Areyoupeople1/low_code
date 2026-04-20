import type { ComponentData } from '@/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResult {
  message: string
  components: ComponentData[]
}

export async function chatWithAI(
  messages: ChatMessage[],
  currentComponents: ComponentData[],
): Promise<ChatResult> {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, currentComponents }),
  })

  // 先用 text() 读取原始内容，避免空响应时 .json() 抛出难以理解的错误
  const text = await response.text()
  if (!text) {
    throw new Error(`服务端返回空响应 (${response.status})，请检查后端日志`)
  }

  let data: { error?: string; message?: string; components?: unknown[] }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`服务端返回了非 JSON 内容：${text.slice(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(data.error ?? `请求失败 (${response.status})`)
  }

  return data as ChatResult
}
