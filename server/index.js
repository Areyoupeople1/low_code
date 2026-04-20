require('dotenv').config()
const express = require('express')
const cors = require('cors')

// 从 AI 返回的文本中提取第一个完整的 JSON 对象
// 比正则替换更鲁棒：AI 经常在 JSON 前后加解释文字或代码块标记
function extractJSON(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`AI 返回内容中未找到有效 JSON，原始内容：${text.slice(0, 200)}`)
  }
  return text.slice(start, end + 1)
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

const SYSTEM_PROMPT = `你是一个低代码页面生成助手。根据用户描述，生成页面组件配置。

可用组件类型：
- Text：文本标签，props.content 为文字内容
- Image：图片，props.src 为图片 URL（使用 https://picsum.photos/宽/高 作为占位图）
- Button：按钮，props.content 为按钮文字
- Input：输入框，props.placeholder 为占位符

画布尺寸：1200x800，坐标原点在左上角。每个组件结构如下：
{
  "type": "Text" | "Image" | "Button" | "Input",
  "style": {
    "top": number,
    "left": number,
    "width": number,
    "height": number,
    "zIndex": number,
    "rotate": 0,
    "fontSize": number,
    "color": "#333333",
    "backgroundColor": "transparent",
    "borderRadius": number
  },
  "props": {
    "content": "文字内容（Text/Button）",
    "src": "图片URL（Image）",
    "placeholder": "占位符（Input）"
  }
}

注意：
1. 组件布局要合理，不要重叠
2. 只返回 JSON 数组，不要有任何解释文字或代码块标记`

app.post('/api/ai-generate', async (req, res) => {
  const { description } = req.body

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: '缺少页面描述' })
  }

  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: '服务端未配置 QWEN_API_KEY，请检查 server/.env 文件' })
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(502).json({ error: `AI API 请求失败 (${response.status}): ${errText}` })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    if (!content) {
      return res.status(502).json({ error: 'AI 返回内容为空' })
    }

    const components = JSON.parse(extractJSON(content))

    if (!Array.isArray(components)) {
      return res.status(502).json({ error: 'AI 返回格式错误，期望数组' })
    }

    res.json({ components })
  } catch (err) {
    console.error('[AI Generate Error]', err)
    res.status(500).json({ error: err.message || '服务器内部错误' })
  }
})

// AI 对话接口：支持多轮对话，基于当前页面状态进行增量修改
app.post('/api/ai-chat', async (req, res) => {
  const { messages, currentComponents } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '缺少对话内容' })
  }

  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: '服务端未配置 QWEN_API_KEY，请检查 server/.env 文件' })
  }

  const currentState =
    Array.isArray(currentComponents) && currentComponents.length > 0
      ? `\n\n当前画布已有 ${currentComponents.length} 个组件：\n${JSON.stringify(currentComponents, null, 2)}`
      : '\n\n当前画布为空。'

  const chatSystemPrompt = `你是一个低代码页面编辑助手，帮助用户通过对话来创建和修改页面。
${currentState}

可用组件类型：
- Text：文本，props.content 为文字内容
- Image：图片，props.src 为图片 URL（用 https://picsum.photos/宽/高 作占位图）
- Button：按钮，props.content 为按钮文字
- Input：输入框，props.placeholder 为占位符

画布尺寸：1200x800。组件结构：
{ "type": "Text"|"Image"|"Button"|"Input", "style": { "top": number, "left": number, "width": number, "height": number, "zIndex": number, "rotate": 0, "fontSize": number, "color": string, "backgroundColor": string, "borderRadius": number }, "props": { "content": string, "src": string, "placeholder": string } }

根据用户的要求，返回修改后的完整组件数组。必须严格按以下 JSON 格式返回，不要有任何其他文字：
{ "message": "用一句中文描述你做了什么", "components": [ ...完整的组件数组... ] }`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: chatSystemPrompt },
          ...messages,
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(502).json({ error: `AI API 请求失败 (${response.status}): ${errText}` })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    if (!content) {
      return res.status(502).json({ error: 'AI 返回内容为空' })
    }

    const result = JSON.parse(extractJSON(content))

    if (!result.message || !Array.isArray(result.components)) {
      return res.status(502).json({ error: 'AI 返回格式错误，请重试' })
    }

    res.json({ message: result.message, components: result.components })
  } catch (err) {
    console.error('[AI Chat Error]', err)
    res.status(500).json({ error: err.message || '服务器内部错误' })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`[server] 运行在 http://localhost:${PORT}`)
  console.log(`[server] QWEN_API_KEY: ${process.env.QWEN_API_KEY ? '已配置' : '未配置 ⚠️'}`)
})
