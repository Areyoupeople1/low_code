<template>
  <button
    class="button-component"
    :style="{
      fontSize: `${component.style.fontSize || 14}px`,
      color: component.style.color || '#ffffff',
      backgroundColor: component.style.backgroundColor || '#409eff',
      border: component.style.borderWidth ? `${component.style.borderWidth}px solid ${component.style.borderColor || '#409eff'}` : 'none',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      padding: '8px 16px',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      height: '100%'
    }"
    @click="handleClick"
  >
    {{ component.props.content || '按钮' }}
  </button>
</template>

<script setup lang="ts">
import type { ComponentData } from '@/types'

// 必须用变量接收 defineProps 的返回值
// 在 <script setup> 里，props 不会自动变成变量，只有 template 里才有这个魔法
const props = defineProps<{
  component: ComponentData
}>()

const handleClick = () => {
  // 通过 props.component 访问，而不是直接用 component
  const href = props.component.props.href as string

  // 没有配置链接就不跳转
  if (!href) return

  const openInNewTab = props.component.props.openInNewTab as boolean

  if (openInNewTab) {
    window.open(href, '_blank')
  } else {
    window.location.href = href
  }
}
</script>

<style scoped>
.button-component {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  min-height: 32px;
}

.button-component:hover {
  opacity: 0.8;
}

.button-component:active {
  transform: scale(0.98);
}
</style>