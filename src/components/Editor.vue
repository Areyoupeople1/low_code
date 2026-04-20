<template>
  <div class="page-editor-container">
    <div class="editor-header">
      <div class="header-left">
        <h1>可视化页面编辑器</h1>
        <span v-if="!isRenaming" class="page-title" title="点击重命名" @click="startRename">
          {{ currentPage?.title || '未命名页面' }}
        </span>
        <el-input v-else v-model="tempTitle" size="small" class="page-title-input" placeholder="请输入页面名称"
          @keyup.enter="confirmRename" @blur="confirmRename" />
      </div>

      <div class="header-center">
        <el-button-group>
          <el-button @click="handleUndo" :disabled="!canUndo">
            <el-icon>
              <RefreshLeft />
            </el-icon>
            撤销
          </el-button>
          <el-button @click="handleRedo" :disabled="!canRedo">
            <el-icon>
              <RefreshRight />
            </el-icon>
            重做
          </el-button>
        </el-button-group>

        <el-button @click="handlePreview" type="primary">
          <el-icon>
            <View />
          </el-icon>
          预览
        </el-button>

        <el-button @click="handleExport" type="success">
          <el-icon>
            <Download />
          </el-icon>
          导出JSON
        </el-button>

        <el-button @click="handleShareLink" type="warning">
          <el-icon>
            <Share />
          </el-icon>
          生成分享链接
        </el-button>


        <el-select v-model="selectedDraftId" placeholder="打开草稿" style="width: 200px" @change="handleOpenDraft"
          clearable>
          <el-option v-for="item in savedPages" :key="item.id + '-' + item.savedAt" :label="item.title"
            :value="item.id" />
        </el-select>
      </div>

      <div class="header-right">
        <el-button-group>
          <el-button :type="currentDevice === 'pc' ? 'primary' : 'default'" @click="handleDeviceSwitch('pc')">
            PC
          </el-button>
          <el-button :type="currentDevice === 'mobile' ? 'primary' : 'default'" @click="handleDeviceSwitch('mobile')">
            移动端
          </el-button>
        </el-button-group>
        <el-button @click="templateDialogVisible = true">
          使用模板
        </el-button>
        <!-- 页面设置按钮：点击后打开弹窗，让用户修改画布宽高和背景色 -->
        <el-button @click="openPageSetting">
          <el-icon>
            <Setting />
          </el-icon>
          页面设置
        </el-button>
        <el-button @click="handleSave">
          <el-icon>
            <Document />
          </el-icon>
          保存
        </el-button>
        <el-button @click="handleNewPage">
          <el-icon>
            <Plus />
          </el-icon>
          新建页面
        </el-button>
      </div>
    </div>

    <div class="editor-body">
      <ComponentPanel />
      <EditorCanvas />
      <PropertyPanel />
    </div>

    <el-dialog v-model="previewVisible" :title="`页面预览（${currentDeviceLabel}）`" width="80%" top="5vh">
      <div class="preview-container">
        <div class="preview-content" :style="{
          width: `${currentPage?.style.width || 1200}px`,
          height: `${currentPage?.style.height || 800}px`,
          backgroundColor: currentPage?.style.backgroundColor || '#ffffff',
          margin: '0 auto'
        }">
          <div v-for="component in currentPage?.components" :key="component.id" class="preview-component" :style="{
            top: `${component.style.top}px`,
            left: `${component.style.left}px`,
            width: `${component.style.width}px`,
            height: `${component.style.height}px`,
            zIndex: component.style.zIndex,
            transform: `rotate(${component.style.rotate}deg)`
          }">
            <component :is="getComponentByType(component.type)" :component="component" />
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 页面设置弹窗：修改画布尺寸和背景色 -->
    <el-dialog v-model="pageSettingVisible" title="页面设置" width="400px">
      <el-form label-width="80px">
        <el-form-item label="画布宽度">
          <!-- v-model 双向绑定临时变量，用户改数字时实时同步 -->
          <el-input-number v-model="tempPageStyle.width" :min="375" :max="3840" :step="10" />
          <span style="margin-left: 8px; color: #999; font-size: 12px;">px</span>
        </el-form-item>
        <el-form-item label="画布高度">
          <el-input-number v-model="tempPageStyle.height" :min="600" :max="10000" :step="100" />
          <span style="margin-left: 8px; color: #999; font-size: 12px;">px</span>
        </el-form-item>
        <el-form-item label="背景颜色">
          <el-color-picker v-model="tempPageStyle.backgroundColor" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pageSettingVisible = false">取消</el-button>
        <!-- 点确认才真正写入 store，取消则不影响画布 -->
        <el-button type="primary" @click="confirmPageSetting">确认</el-button>
      </template>
    </el-dialog>


<el-dialog v-model="templateDialogVisible" title="选择营销模板" width="860px">
      <div class="template-grid">
        <div v-for="template in pageTemplates" :key="template.id" class="template-card">
          <img :src="template.cover" :alt="template.name" class="template-cover" />
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
          </div>
          <el-button type="primary" @click="handleApplyTemplate(template)">
            立即使用
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { PAGE_TEMPLATES } from '@/templates'
import type { DeviceType, PageTemplateMeta } from '@/types'
import ComponentPanel from './ComponentPanel.vue'
import EditorCanvas from './EditorCanvas.vue'
import PropertyPanel from './PropertyPanel.vue'
import TextComponent from './components/TextComponent.vue'
import ImageComponent from './components/ImageComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import InputComponent from './components/InputComponent.vue'
import {
  RefreshLeft,
  RefreshRight,
  View,
  Download,
  Document,
  Plus,
  Setting,
  Share,
} from '@element-plus/icons-vue'

defineOptions({ name: 'PageEditor' })

const editorStore = useEditorStore()
const historyStore = useHistoryStore()

const previewVisible = ref(false)
const selectedDraftId = ref<string | null>(null)
const isRenaming = ref(false)
const tempTitle = ref('')
const templateDialogVisible = ref(false)

// 页面设置弹窗的显示状态
const pageSettingVisible = ref(false)

// 用一个临时对象存用户正在编辑的值
// 为什么用临时变量？—— 用户点"取消"时不应影响画布，只有点"确认"才写入 store
const tempPageStyle = ref({
  width: 1200,
  height: 800,
  backgroundColor: '#ffffff',
})

const currentPage = computed(() => editorStore.currentPage)
const currentDevice = computed(() => editorStore.currentDevice)
const canUndo = computed(() => historyStore.canUndo())
const canRedo = computed(() => historyStore.canRedo())
const savedPages = computed(() => {
  void editorStore.localPagesVersion
  const list = editorStore.listLocalPages()
  return [...list].sort((a, b) => b.savedAt - a.savedAt)
})
const pageTemplates = PAGE_TEMPLATES
const hasCanvasContent = computed(() => (currentPage.value?.components.length || 0) > 0)
const currentDeviceLabel = computed(() => (currentDevice.value === 'mobile' ? '移动端' : 'PC'))

const componentMap = {
  Text: TextComponent,
  Image: ImageComponent,
  Button: ButtonComponent,
  Input: InputComponent
}

const getComponentByType = (type: string) => {
  return componentMap[type as keyof typeof componentMap] || TextComponent
}

const handleUndo = () => {
  historyStore.undo()
}

const handleRedo = () => {
  historyStore.redo()
}

const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+Z 或 Cmd+Z (Mac)
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
  }
  // Ctrl+Y 或 Ctrl+Shift+Z 重做
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    handleRedo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const handlePreview = () => {
  previewVisible.value = true
}

const handleExport = () => {
  const pageData = editorStore.exportPageData()
  if (pageData) {
    const blob = new Blob([pageData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentPage.value?.title || 'page'}.json`
    a.click()
    URL.revokeObjectURL(url)
  } else {
    ElMessage.warning('没有页面数据可导出')
  }
}

const handleSave = () => {
  editorStore.saveCurrentPageToLocal()
  ElMessage.success('已保存为草稿')
}

const handleNewPage = () => {
  if (currentPage.value) {
    editorStore.saveCurrentPageToLocal()
  }
  const ts = new Date()
  const hh = String(ts.getHours()).padStart(2, '0')
  const mm = String(ts.getMinutes()).padStart(2, '0')
  const ss = String(ts.getSeconds()).padStart(2, '0')
  editorStore.createNewPage(`新页面 ${hh}:${mm}:${ss}`)
  historyStore.clearHistory()
  ElMessage.success('已创建新页面')
}

const handleOpenDraft = (id?: string) => {
  const targetId = id || selectedDraftId.value || ''
  if (!targetId) return
  editorStore.loadPageFromLocal(targetId)
  historyStore.clearHistory()
  ElMessage.success('已打开草稿')
}

// 打开弹窗时，把当前画布的值同步到临时变量，避免显示旧数据
const handleShareLink = () => {
  const pageData = editorStore.currentPage
  if (!pageData) {
    ElMessage.warning('没有页面数据')
    return
  }

  // 编码步骤：
  // 1. JSON.stringify：JS对象 → JSON字符串
  // 2. encodeURIComponent：中文 → %E5%8F%8C...（确保 btoa 不报错）
  // 3. btoa：转成 base64，放进 URL 不会有特殊字符问题
  const encoded = btoa(encodeURIComponent(JSON.stringify(pageData)))

  // 拼出完整 URL，# 后面是数据，不会触发页面跳转
  const url = `${window.location.origin}/preview#${encoded}`

  // 写入剪贴板，提示用户
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('分享链接已复制到剪贴板')
  })
}

const openPageSetting = () => {
  if (currentPage.value) {
    tempPageStyle.value = { ...currentPage.value.style }
  }
  pageSettingVisible.value = true//弹窗是否显示
}

// 用户点"确认"后，把临时变量的值写入 store
// store 数据一变，EditorCanvas 里的画布宽高自动更新（Vue 响应式）
const confirmPageSetting = () => {
  editorStore.updatePageStyle(tempPageStyle.value)
  pageSettingVisible.value = false
  ElMessage.success('页面设置已更新')
}

const handleDeviceSwitch = async (device: DeviceType) => {
  if (device === currentDevice.value) return

  if (device === 'mobile' && !editorStore.hasDeviceLayout('mobile')) {
    try {
      await ElMessageBox.confirm(
        '首次进入移动端会基于当前 PC 布局生成一版移动端初稿，后续你可以单独微调移动端布局。',
        '生成移动端布局',
        {
          confirmButtonText: '生成并切换',
          cancelButtonText: '取消',
          type: 'info',
        },
      )
    } catch {
      return
    }

    editorStore.generateMobileLayout()
    ElMessage.success('已生成移动端布局初稿')
  }

  editorStore.setCurrentDevice(device)
}

const applyTemplate = (template: PageTemplateMeta) => {
  editorStore.applyPageTemplate(template.createPageData())
  historyStore.clearHistory()
  selectedDraftId.value = null
  isRenaming.value = false
  templateDialogVisible.value = false
  ElMessage.success(`已套用${template.name}`)
}

const handleApplyTemplate = async (template: PageTemplateMeta) => {
  if (hasCanvasContent.value) {
    try {
      await ElMessageBox.confirm('套用模板会覆盖当前页面内容，是否继续？', '确认套用模板', {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }
  }

  applyTemplate(template)
}

const startRename = () => {
  if (!currentPage.value) return
  tempTitle.value = currentPage.value.title
  isRenaming.value = true
}


const confirmRename = () => {
  if (!isRenaming.value) return
  isRenaming.value = false
  const title = (tempTitle.value || '').trim() || '未命名页面'
  editorStore.renameCurrentPage(title)
  ElMessage.success('页面名称已更新')
}
</script>

<style scoped>
.page-editor-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.editor-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.page-title {
  color: #666;
  font-size: 14px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.preview-container {
  max-height: 70vh;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.preview-content {
  position: relative;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-component {
  position: absolute;
  /* pointer-events: none 已移除
     预览模式需要真实的点击交互（如按钮跳转），不应屏蔽鼠标事件 */
}

.preview-component>* {
  width: 100%;
  height: 100%;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.template-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.template-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  background: #f5f7fa;
}

.template-info {
  padding: 16px 16px 8px;
}

.template-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
}

.template-info p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.template-card .el-button {
  margin: 0 16px 16px;
  width: calc(100% - 32px);
}
</style>
