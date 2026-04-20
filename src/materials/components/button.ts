import type { MaterialConfig } from '../types'
import { ComponentType } from '@/types'

export const buttonMaterial: MaterialConfig = {
  meta: {
    type: ComponentType.BUTTON,
    name: '按钮',
    icon: 'CircleCheck',
    description: '可点击的按钮',
    category: '基础'
  },
  defaultStyle: {
    width: 100,
    height: 40,
    backgroundColor: '#409eff',
    color: '#ffffff',
    fontSize: 14,
    borderRadius: 4,
    top: 0,
    left: 0,
    zIndex: 0,
    rotate: 0
  },
  defaultProps: {
    content: '按钮',
    // href：按钮点击后跳转的链接，空字符串表示不跳转
    href: '',
    // openInNewTab：true = 新标签页打开，false = 当前页跳转
    // 活动页场景默认新标签页，用户不会直接离开活动页
    openInNewTab: true,
  },
  editableFields: ['content', 'backgroundColor', 'color']
}
