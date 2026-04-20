<template>
  <div class="editor-canvas">
    <div class="canvas-toolbar">
      <el-button-group>
        <!-- zoomOut缩小，限制最小缩放比例为 50%。 -->
        <el-button @click="zoomOut" :disabled="canvasScale <= 0.5">
          <el-icon>
            <ZoomOut />
          </el-icon>
        </el-button>
        <el-button>{{ Math.round(canvasScale * 100) }}%</el-button>
        <el-button @click="zoomIn" :disabled="canvasScale >= 2">
          <el-icon>
            <ZoomIn />
          </el-icon>
        </el-button>
        <el-button @click="resetZoom">
          <el-icon>
            <FullScreen />
          </el-icon>
        </el-button>
      </el-button-group>

      <el-switch v-model="snapToGrid" active-text="吸附网格" inactive-text="自由拖拽" />

      <el-switch v-model="showGuidelines" active-text="显示辅助线" inactive-text="隐藏辅助线" />
    </div>

    <div class="canvas-container" :style="{
      transform: `scale(${canvasScale})`,
      transformOrigin: 'center center' // 默认缩放是绕着中心点缩放的
    }" @mousedown="handleCanvasClick" @dragover="handleDragOver" @drop="handleDrop">
      <div class="canvas-background" :style="{
        width: `${currentPage?.style.width || 1200}px`,
        height: `${currentPage?.style.height || 800}px`,
        backgroundColor: currentPage?.style.backgroundColor || '#ffffff'
      }">
        <!-- 这个问号，一开始currentPage 是 null，没有值就不往后执行了 -->
        <!-- px这里拿到的是纯字符串，但是在css中我们需要是像素，所以这里要拼接字符串，才能正确渲染 -->
        <!-- zIndex用来控制元素的层级（前后遮挡关系）。数字越大，组件就越在“上面” -->
        <!-- rotate也是后面可以修改的属性，在右侧属性面板 -->
        <div v-for="component in currentPage?.components" :key="component.id" class="component-wrapper"
          :class="{ selected: currentComponent?.id === component.id }" :style="{
            top: `${component.style.top}px`,
            left: `${component.style.left}px`,
            width: `${component.style.width}px`,
            height: `${component.style.height}px`,
            zIndex: component.style.zIndex,
            transform: `rotate(${component.style.rotate}deg)`
          }" @mousedown="handleComponentMouseDown(component, $event)">
          <component :is="getComponentByType(component.type)" :component="component" class="component-content" />

          <div v-if="currentComponent?.id === component.id" class="component-resize-handles">
            <div class="handle handle-tl" @mousedown.stop="startResize(component, 'tl', $event)"></div>
            <div class="handle handle-tr" @mousedown.stop="startResize(component, 'tr', $event)"></div>
            <div class="handle handle-bl" @mousedown.stop="startResize(component, 'bl', $event)"></div>
            <div class="handle handle-br" @mousedown.stop="startResize(component, 'br', $event)"></div>
            <div class="handle handle-t" @mousedown.stop="startResize(component, 't', $event)"></div>
            <div class="handle handle-r" @mousedown.stop="startResize(component, 'r', $event)"></div>
            <div class="handle handle-b" @mousedown.stop="startResize(component, 'b', $event)"></div>
            <div class="handle handle-l" @mousedown.stop="startResize(component, 'l', $event)"></div>
          </div>
        </div>

        <div v-if="showGuidelines" class="guidelines">
          <!-- 简洁的十字辅助线 -->
          <div class="guideline vertical center" :style="{ left: '50%' }"></div>
          <div class="guideline horizontal center" :style="{ top: '50%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { ComponentData } from '@/types'
import { ComponentType } from '@/types'
import TextComponent from './components/TextComponent.vue'
import ImageComponent from './components/ImageComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import InputComponent from './components/InputComponent.vue'

const editorStore = useEditorStore()
// 从 store 里获取当前页面和组件，本来是响应式的，但是直接赋值会丢失响应式，所以要用computed
// storeToRefs也可以达到同样效果，实时监控 store 里的数据变化
const currentPage = computed(() => editorStore.currentPage)
const currentComponent = computed(() => editorStore.currentComponent)
const canvasScale = computed(() => editorStore.canvasScale)
const snapToGrid = computed({
  get: () => editorStore.snapToGrid,
  set: (value) => editorStore.setSnapToGrid(value)
})
const showGuidelines = computed({
  get: () => editorStore.showGuidelines,
  set: (value) => editorStore.setShowGuidelines(value)
})

const componentMap = {
  Text: TextComponent,
  Image: ImageComponent,
  Button: ButtonComponent,
  Input: InputComponent
}

const getComponentByType = (type: string) => {
  return componentMap[type as keyof typeof componentMap] || TextComponent
}

const selectComponent = (component: ComponentData) => {
  editorStore.selectComponent(component)
}

const handleComponentMouseDown = (component: ComponentData, event: MouseEvent) => {
  // 先选择组件
  selectComponent(component)

  // 然后开始拖拽
  startDrag(component, event)

  // 阻止事件冒泡，避免触发画布点击事件
  event.stopPropagation()
  event.preventDefault()
}

const handleCanvasClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    editorStore.selectComponent(null)
  }
}

const zoomIn = () => {
  editorStore.setCanvasScale(Math.min(canvasScale.value + 0.1, 2))
}

const zoomOut = () => {
  editorStore.setCanvasScale(Math.max(canvasScale.value - 0.1, 0.5))
}

const resetZoom = () => {
  editorStore.setCanvasScale(1)
}
// 必须在这里preventDefault()否则 drop 不会触发！
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}
// 想在松开鼠标时自己处理数据而不让页面乱跳,自己处理数据
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!event.dataTransfer || !editorStore.currentPage) return
  //接收拖拽的组件类型
  const componentType = event.dataTransfer.getData('componentType') as ComponentType
  if (!componentType) return
  // 获取画布背景的实际位置（组件应该相对于canvas-background定位）
  const canvasBackground = document.querySelector('.canvas-background') as HTMLElement
  if (!canvasBackground) return
  // getBoundingClientRect获取该元素在当前视口里的矩形信息（位置+尺寸），返回一个 DOMRect
  const canvasRect = canvasBackground.getBoundingClientRect()
  // console.log("canvasRect", canvasRect)

  // 计算相对于画布背景的精确位置
  // 注意：getBoundingClientRect返回的是实际渲染位置，已经包含了缩放
  // 所以我们需要将鼠标位置转换为画布坐标系中的位置
  const scale = canvasScale.value
  // console.log("event.clientX", event.clientX)
  // console.log("event.clientY", event.clientY)
  const offsetX = (event.clientX - canvasRect.left) / scale
  const offsetY = (event.clientY - canvasRect.top) / scale

  // 添加新组件到画布，放置在鼠标位置
  editorStore.addComponent(componentType, {
    left: Math.max(0, offsetX),
    top: Math.max(0, offsetY)
  })
}

let isDragging = false
let dragStartX = 0
let dragStartY = 0
let originalLeft = 0
let originalTop = 0

const startDrag = (component: ComponentData, event: MouseEvent) => {
  isDragging = true

  // 记录拖拽开始时的鼠标位置和组件位置
  dragStartX = event.clientX
  dragStartY = event.clientY
  originalLeft = component.style.left
  originalTop = component.style.top

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

const handleDrag = (event: MouseEvent) => {
  if (!isDragging || !currentComponent.value) return

  // 计算鼠标移动的偏移量（考虑缩放）
  const deltaX = (event.clientX - dragStartX) / canvasScale.value
  const deltaY = (event.clientY - dragStartY) / canvasScale.value

  // 计算新位置
  let newLeft = originalLeft + deltaX
  let newTop = originalTop + deltaY

  // 网格吸附功能，组件会自动对齐格子，摆起来更整齐
  if (snapToGrid.value) {
    newLeft = Math.round(newLeft / 10) * 10
    newTop = Math.round(newTop / 10) * 10
  }

  // 确保位置不超出画布边界
  newLeft = Math.max(0, newLeft)
  newTop = Math.max(0, newTop)

  // 立即更新组件位置，把我们更新的数据传进去，id和坐标
  editorStore.updateComponentStyle(currentComponent.value.id, {
    left: newLeft,
    top: newTop
  })
}

const stopDrag = () => {
  isDragging = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

let isResizing = false
let resizeDirection = ''
let resizeStartX = 0
let resizeStartY = 0
let originalWidth = 0
let originalHeight = 0
let originalLeftResize = 0
let originalTopResize = 0

const startResize = (component: ComponentData, direction: string, event: MouseEvent) => {
  isResizing = true
  resizeDirection = direction
  resizeStartX = event.clientX
  resizeStartY = event.clientY
  // console.log("resizeStartX", resizeStartX)
  // console.log("resizeStartY", resizeStartY)
  originalWidth = component.style.width//右边界相对左边界的距离
  originalHeight = component.style.height//下边界相对上边界的距离
  originalLeftResize = component.style.left//初始左边界位置（left）
  originalTopResize = component.style.top//初始上边界位置（top）
  // console.log("originalWidth", originalWidth)
  // console.log("originalHeight", originalHeight)
  // console.log("originalLeftResize", originalLeftResize)
  // console.log("originalTopResize", originalTopResize)

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
  event.stopPropagation()
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing || !currentComponent.value) return

  const deltaX = (event.clientX - resizeStartX) / canvasScale.value
  const deltaY = (event.clientY - resizeStartY) / canvasScale.value
  console.log("deltaX", deltaX)
  console.log("deltaY", deltaY)

  let newWidth = originalWidth
  let newHeight = originalHeight
  let newLeft = originalLeftResize
  let newTop = originalTopResize

  switch (resizeDirection) {
    case 'tl':
      // 20是给组件设置最小宽度限制，防止用户把组件拖成负数或者缩成 0
      newWidth = Math.max(20, originalWidth - deltaX)
      newHeight = Math.max(20, originalHeight - deltaY)
      newLeft = originalLeftResize + (originalWidth - newWidth)
      newTop = originalTopResize + (originalHeight - newHeight)
      console.log("newLeft", newLeft)
      console.log("newTop", newTop)
      console.log("newWidth", newWidth)
      console.log("newHeight", newHeight)
      break
    case 'tr':
      newWidth = Math.max(20, originalWidth + deltaX)
      newHeight = Math.max(20, originalHeight - deltaY)
      newTop = originalTopResize + (originalHeight - newHeight)
      break
    case 'bl':
      newWidth = Math.max(20, originalWidth - deltaX)
      newHeight = Math.max(20, originalHeight + deltaY)
      newLeft = originalLeftResize + (originalWidth - newWidth)
      break
    case 'br':
      newWidth = Math.max(20, originalWidth + deltaX)
      newHeight = Math.max(20, originalHeight + deltaY)
      break
    case 't':
      newHeight = Math.max(20, originalHeight - deltaY)
      newTop = originalTopResize + (originalHeight - newHeight)
      break
    case 'b':
      newHeight = Math.max(20, originalHeight + deltaY)
      break
    case 'l':
      newWidth = Math.max(20, originalWidth - deltaX)
      newLeft = originalLeftResize + (originalWidth - newWidth)
      break
    case 'r':
      newWidth = Math.max(20, originalWidth + deltaX)
      break
  }

  editorStore.updateComponentStyle(currentComponent.value.id, {
    width: newWidth,
    height: newHeight,
    left: newLeft,
    top: newTop
  })
}

const stopResize = () => {
  isResizing = false
  // 移除事件监听
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  // 确保页面在组件挂载时已经创建，首次打开编辑器时会创建默认页面
  if (!currentPage.value) {
    editorStore.createNewPage()
  }

  // 添加拖放区域初始化检查
  const canvasContainer = document.querySelector('.canvas-container') as HTMLElement
  if (canvasContainer) {
    // 确保拖放区域已准备好
    console.log('Canvas container ready for drag and drop')
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.editor-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.canvas-toolbar {
  padding: 10px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 20px;
  align-items: center;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  /* 改为 flex-start：画布从顶部开始排列
     原来是 center，画布高度超过容器时上半部分会跑到视口外，滚动条也无法滚到顶 */
  align-items: flex-start;
  padding: 40px 20px;
  overflow: auto;
  min-height: 400px;
  cursor: default;
  max-width: 100%;
}

.canvas-background {
  position: relative;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  min-width: 0;
  min-height: 0;
  /* 去掉 max-width / max-height：原来这两个限制让画布无法超出屏幕尺寸
     现在画布宽高完全由 currentPage.style.width/height 决定，靠外层 overflow:auto 滚动 */
}

.component-wrapper {
  position: absolute;
  cursor: move;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.component-wrapper.selected {
  border-color: #409eff;
}

.component-content {
  width: 100%;
  height: 100%;
}

.component-resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.component-resize-handles .handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid white;
  border-radius: 1px;
  pointer-events: all;
  cursor: nwse-resize;
}

/* nw-resize 表示“左上角方向的拉伸光标”（NorthWest resize），鼠标会变成一个斜向双箭头 */
.handle-tl {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.handle-tr {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.handle-bl {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.handle-br {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.handle-t {
  top: -4px;
  left: 50%;
  margin-left: -4px;
  cursor: n-resize;
}

.handle-r {
  right: -4px;
  top: 50%;
  margin-top: -4px;
  cursor: e-resize;
}

.handle-b {
  bottom: -4px;
  left: 50%;
  margin-left: -4px;
  cursor: s-resize;
}

.handle-l {
  left: -4px;
  top: 50%;
  margin-top: -4px;
  cursor: w-resize;
}

.guidelines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.guideline {
  position: absolute;
}

.guideline.vertical {
  width: 2px;
  top: 0;
  bottom: 0;
}

.guideline.horizontal {
  height: 2px;
  left: 0;
  right: 0;
}

.guideline.center {
  background: rgba(64, 158, 255, 0.3);
  box-shadow: 0 0 2px rgba(64, 158, 255, 0.5);
}
</style>
