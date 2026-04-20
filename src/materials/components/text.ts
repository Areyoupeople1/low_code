import type { MaterialConfig } from '../types'
import { ComponentType } from '@/types'

export const textMaterial: MaterialConfig = {
  meta: {
    type: ComponentType.TEXT,
    name: '文本',
    icon: 'Document',
    description: '显示文本内容',
    category: '基础'
  },
  defaultStyle: {
    width: 200,
    height: 50,
    fontSize: 14,
    color: '#333333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: '#ccc',
    borderRadius: 0,
    top: 0,
    left: 0,
    zIndex: 0,
    rotate: 0,
    // 新增默认值：普通粗细、左对齐
    // 这里定义的是"拖入画布时的初始状态"，用户可以在属性面板里修改
    fontWeight: 'normal',
    textAlign: 'left',
  },
  defaultProps: {
    content: '文本内容'
  },
  editableFields: ['content', 'fontSize', 'fontWeight', 'textAlign', 'color', 'backgroundColor']
}
