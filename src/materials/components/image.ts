import type { MaterialConfig } from '../types'
import { ComponentType } from '@/types'

export const imageMaterial: MaterialConfig = {
  meta: {
    type: ComponentType.IMAGE,
    name: '图片',
    icon: 'Picture',
    description: '显示图片',
    category: '基础'
  },
  defaultStyle: {
    width: 300,
    height: 200,
    borderRadius: 0,
    top: 0,
    left: 0,
    zIndex: 0,
    rotate: 0
  },
  defaultProps: {
    src: ''
  },
  editableFields: ['src']
}
