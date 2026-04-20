import type { ComponentType } from '@/types'
//物料库类型定义

//描述“物料的基本信息”（展示用）
export interface MaterialMeta {
  type: ComponentType
  name: string
  icon: string
  description?: string
  category?: string
}

//描述“一个物料的完整配置”（运行/初始化/编辑用
export interface MaterialConfig {
  meta: MaterialMeta
  defaultStyle: Record<string, unknown>
  defaultProps: Record<string, unknown>
  editableFields: string[]
}

export interface MaterialLibrary {
  [key: string]: MaterialConfig
}
