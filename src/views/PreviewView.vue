<template>
  <div class="preview-page">
    <!-- 解码失败时显示错误提示 -->
    <div v-if="error" class="preview-error">
      <p>页面数据解析失败，链接可能已损坏</p>
    </div>

    <!-- 正常渲染：按照页面数据的宽高撑开画布 -->
    <div
      v-else-if="pageData"
      class="preview-canvas"
      :style="{
        width: `${pageData.style.width}px`,
        minHeight: `${pageData.style.height}px`,
        backgroundColor: pageData.style.backgroundColor,
      }"
    >
      <!-- 遍历所有组件，和编辑器的渲染逻辑完全一致 -->
      <div
        v-for="component in pageData.components"
        :key="component.id"
        class="preview-component"
        :style="{
          position: 'absolute',
          top: `${component.style.top}px`,
          left: `${component.style.left}px`,
          width: `${component.style.width}px`,
          height: `${component.style.height}px`,
          zIndex: component.style.zIndex,
          transform: `rotate(${component.style.rotate}deg)`,
        }"
      >
        <!-- 动态组件：根据 type 字符串找到对应的 Vue 组件来渲染 -->
        <component :is="componentMap[component.type]" :component="component" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { PageData } from '@/types'
import TextComponent from '@/components/components/TextComponent.vue'
import ImageComponent from '@/components/components/ImageComponent.vue'
import ButtonComponent from '@/components/components/ButtonComponent.vue'
import InputComponent from '@/components/components/InputComponent.vue'

// 组件类型字符串 → 实际 Vue 组件的映射表
// 和 Editor.vue 里的 componentMap 一样，这里单独维护一份
const componentMap: Record<string, unknown> = {
  Text: TextComponent,
  Image: ImageComponent,
  Button: ButtonComponent,
  Input: InputComponent,
}

const route = useRoute()
const pageData = ref<PageData | null>(null)
const error = ref(false)

onMounted(() => {
  // route.hash 拿到的是 "#xxxxxx"，slice(1) 去掉开头的 #
  const hash = route.hash.slice(1)

  if (!hash) {
    error.value = true
    return
  }

  try {
    // 解码步骤（编码的逆过程）：
    // 1. atob：base64 → 带%编码的字符串
    // 2. decodeURIComponent：%E5%8F%8C... → 中文原文
    // 3. JSON.parse：JSON字符串 → JS对象
    const json = decodeURIComponent(atob(hash))
    pageData.value = JSON.parse(json) as PageData
  } catch {
    // 任何一步出错（链接被截断、篡改等）都走错误提示
    error.value = true
  }
})
</script>

<style scoped>
.preview-page {
  /* 让页面内容水平居中，背景用浅灰色衬托画布 */
  min-height: 100vh;
  background: #f0f0f0;
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.preview-canvas {
  /* 相对定位：子组件用 absolute 定位时，以这个元素为基准 */
  position: relative;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.preview-error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 16px;
}
</style>
