import type { ComponentData } from '@/types'
import { ComponentType } from '@/types'

export async function generatePageByAI(description: string): Promise<ComponentData[]> {
  const response = await fetch('/api/ai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })

  const text = await response.text()
  if (!text) {
    throw new Error(`服务端返回空响应 (${response.status})，请检查后端日志`)
  }

  let data: { error?: string; components?: unknown[] }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`服务端返回了非 JSON 内容：${text.slice(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(data.error ?? `请求失败 (${response.status})`)
  }

  const raw: unknown[] = data.components
  if (!Array.isArray(raw)) throw new Error('服务端返回格式错误')

  const validTypes = new Set<string>(Object.values(ComponentType))

  return raw
    .filter(
      (c): c is Record<string, unknown> =>
        typeof c === 'object' && c !== null && validTypes.has((c as Record<string, unknown>).type as string),
    )
    .map((c, index) => {
      const s = (c.style ?? {}) as Record<string, unknown>
      const p = (c.props ?? {}) as Record<string, unknown>
      return {
        id: `ai_${Date.now()}_${index}`,
        type: c.type as ComponentType,
        style: {
          top: (s.top as number) ?? 100,
          left: (s.left as number) ?? 100,
          width: (s.width as number) ?? 200,
          height: (s.height as number) ?? 40,
          zIndex: (s.zIndex as number) ?? index + 1,
          rotate: 0,
          fontSize: s.fontSize as number | undefined,
          color: s.color as string | undefined,
          backgroundColor: s.backgroundColor as string | undefined,
          borderRadius: s.borderRadius as number | undefined,
        },
        props: {
          content: p.content as string | undefined,
          src: p.src as string | undefined,
          placeholder: p.placeholder as string | undefined,
        },
      } satisfies ComponentData
    })
}
