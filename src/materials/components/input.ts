import type { MaterialConfig } from '../types'
import { ComponentType } from '@/types'

export const inputMaterial: MaterialConfig = {
  meta: {
    type: ComponentType.INPUT,
    name: '输入框',
    icon: 'EditPen',
    description: '用户输入框',
    category: '表单'
  },
  defaultStyle: {
    width: 200,
    height: 40,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#dcdfe4',
    borderRadius: 4,
    top: 0,
    left: 0,
    zIndex: 0,
    rotate: 0
  },
  defaultProps: {
    placeholder: '请输入内容'
  },
  editableFields: ['placeholder']
}
