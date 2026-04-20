//types 文件夹存放的是 TypeScript 的接口定义（Interface）和类型别名（Type）。
// 得先在 types 里定好：我的组件到底支持哪些属性？支持旋转吗？支持动画吗？
//这个文件是整个项目的数据契约
export interface ComponentStyle {
  top: number
  left: number
  width: number
  height: number
  zIndex: number
  rotate: number
  fontSize?: number
  color?: string
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderRadius?: number
  // 字体粗细：'normal' = 正常，'bold' = 加粗
  // 用字符串而不是数字，是因为 CSS font-weight 支持 normal/bold 关键字，直接绑定更方便
  fontWeight?: 'normal' | 'bold'
  // 文字对齐：左对齐 / 居中 / 右对齐
  textAlign?: 'left' | 'center' | 'right'
}

export type DeviceType = 'pc' | 'mobile'

export type ComponentLayouts = Partial<Record<DeviceType, ComponentStyle>>

export interface ComponentProps {
  content?: string
  src?: string
  type?: string
  placeholder?: string
  [key: string]: unknown
}

export interface ComponentData {
  id: string
  type: ComponentType
  style: ComponentStyle
  layouts?: ComponentLayouts
  props: ComponentProps
  events?: ComponentEvent[]//可选属性
}

export interface ComponentEvent {
  type: string//事件类型
  handler: string//事件处理函数
}

export interface PageData {
  id: string
  title: string
  components: ComponentData[]
  style: PageStyle
  deviceStyles?: Partial<Record<DeviceType, PageStyle>>
  currentDevice?: DeviceType
}

export interface PageStyle {
  width: number
  height: number
  backgroundColor: string
}

export interface PageTemplateMeta {
  id: string
  name: string
  description: string
  cover: string
  createPageData: () => PageData
}

export enum ComponentType {
  TEXT = 'Text',
  IMAGE = 'Image',
  BUTTON = 'Button',
  INPUT = 'Input',
  FORM = 'Form',
  CHART = 'Chart'
}

export interface Command {
  execute(): void
  undo(): void
}

export interface EditorState {
  currentPage: PageData | null
  currentComponent: ComponentData | null
  currentDevice: DeviceType
  canvasScale: number
  snapToGrid: boolean
  showGuidelines: boolean
}

export interface HistoryState {
  undoStack: Command[]
  redoStack: Command[]
  maxHistorySize: number
}
