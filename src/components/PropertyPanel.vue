<template>
  <div class="property-panel">
    <div class="panel-header">
      <h3>属性配置</h3>
      <el-button v-if="currentComponent" type="danger" size="small" @click="deleteCurrentComponent">
        删除组件
      </el-button>
    </div>

    <div v-if="!currentComponent" class="empty-state">
      <el-icon>
        <InfoFilled />
      </el-icon>
      <p>请选择要配置的组件</p>
    </div>

    <div v-else class="property-content">
      <el-scrollbar>
        <div class="property-section">
          <h4>位置和大小</h4>
          <!-- <el-input-number/> -->

          <div class="property-grid">
            <div class="property-item">
              <label>X坐标</label>
              <!-- min 最小值为0，每次加减1像素 -->
              <el-input-number v-model="currentComponent.style.left" :min="0" :step="1"
                @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>Y坐标</label>
              <el-input-number v-model="currentComponent.style.top" :min="0" :step="1" @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>宽度</label>
              <el-input-number v-model="currentComponent.style.width" :min="20" :step="1"
                @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>高度</label>
              <el-input-number v-model="currentComponent.style.height" :min="20" :step="1"
                @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>旋转角度</label>
              <el-input-number v-model="currentComponent.style.rotate" :min="-180" :max="180" :step="1"
                @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>图层顺序</label>
              <el-input-number v-model="currentComponent.style.zIndex" :min="1" :step="1"
                @change="updateComponentStyle" />
            </div>
          </div>
        </div>

        <div class="property-section">
          <h4>图层操作</h4>
          <div class="property-buttons">
            <el-button-group>
              <el-button @click="moveLayer('up')" :disabled="!canMoveUp">
                <el-icon>
                  <Top />
                </el-icon>
                上移一层
              </el-button>
              <el-button @click="moveLayer('down')" :disabled="!canMoveDown">
                <el-icon>
                  <Bottom />
                </el-icon>
                下移一层
              </el-button>
              <el-button @click="moveLayer('top')" :disabled="!canMoveUp">
                <el-icon>
                  <SortUp />
                </el-icon>
                置顶
              </el-button>
              <el-button @click="moveLayer('bottom')" :disabled="!canMoveDown">
                <el-icon>
                  <SortDown />
                </el-icon>
                置底
              </el-button>
            </el-button-group>
          </div>
        </div>

        <div class="property-section">
          <h4>样式设置</h4>
          <div class="property-grid">
            <div class="property-item">
              <label>字体大小</label>
              <el-input-number v-model="currentComponent.style.fontSize" :min="8" :max="72" :step="1"
                @change="updateComponentStyle" />
            </div>
            <div v-if="currentComponent.type === 'Text'" class="property-item">
              <label>字体粗细</label>
              <el-radio-group v-model="currentComponent.style.fontWeight" @change="updateComponentStyle">
                <el-radio-button label="normal">常规</el-radio-button>
                <el-radio-button label="bold">加粗</el-radio-button>
              </el-radio-group>
            </div>
            <div v-if="currentComponent.type === 'Text'" class="property-item">
              <label>文字对齐</label>
              <el-radio-group v-model="currentComponent.style.textAlign" @change="updateComponentStyle">
                <el-radio-button label="left">左对齐</el-radio-button>
                <el-radio-button label="center">居中</el-radio-button>
                <el-radio-button label="right">右对齐</el-radio-button>
              </el-radio-group>
            </div>
            <div class="property-item">
              <label>字体颜色</label>
              <el-color-picker v-model="currentComponent.style.color" @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>背景颜色</label>
              <el-color-picker v-model="currentComponent.style.backgroundColor" @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>边框宽度</label>
              <el-input-number v-model="currentComponent.style.borderWidth" :min="0" :max="10" :step="1"
                @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>边框颜色</label>
              <el-color-picker v-model="currentComponent.style.borderColor" @change="updateComponentStyle" />
            </div>
            <div class="property-item">
              <label>圆角</label>
              <el-input-number v-model="currentComponent.style.borderRadius" :min="0" :max="50" :step="1"
                @change="updateComponentStyle" />
            </div>
          </div>
        </div>

        <div class="property-section">
          <h4>组件属性</h4>
          <div class="property-grid">
            <div v-if="currentComponent.type === 'Text'" class="property-item">
              <label>文本内容</label>
              <el-input v-model="currentComponent.props.content" type="textarea" :rows="3"
                @change="updateComponentProps" />
            </div>

            <!-- 有图片组件才显示图片地址属性 -->
            <div v-if="currentComponent.type === 'Image'" class="property-item">
              <label>图片地址</label>
              <el-input v-model="currentComponent.props.src" placeholder="请输入图片URL" @change="updateComponentProps" />
            </div>

            <div v-if="currentComponent.type === 'Button'" class="property-item">
              <label>按钮文本</label>
              <el-input v-model="currentComponent.props.content" @change="updateComponentProps" />
            </div>

            <!-- 跳转链接：只有按钮类型才显示 -->
            <div v-if="currentComponent.type === 'Button'" class="property-item">
              <label>跳转链接</label>
              <!-- placeholder 提示用户要填完整 URL，否则跳转会出错 -->
              <el-input
                v-model="currentComponent.props.href"
                placeholder="https://..."
                @change="updateComponentProps"
              />
            </div>

            <!-- 打开方式：控制是新标签页还是当前页 -->
            <div v-if="currentComponent.type === 'Button'" class="property-item">
              <label>打开方式</label>
              <!-- el-switch：true = 新标签页，false = 当前页
                   active-text / inactive-text 是开关两侧的文字说明 -->
              <el-switch
                v-model="currentComponent.props.openInNewTab"
                active-text="新标签页"
                inactive-text="当前页"
                @change="updateComponentProps"
              />
            </div>

            <div v-if="currentComponent.type === 'Input'" class="property-item">
              <label>占位文本</label>
              <el-input v-model="currentComponent.props.placeholder" @change="updateComponentProps" />
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import {
  InfoFilled,
  Top,
  Bottom,
  SortUp,
  SortDown
} from '@element-plus/icons-vue'

const editorStore = useEditorStore()

const currentComponent = computed(() => editorStore.currentComponent)

//当前选中组件不是最后一个组件才允许上移
const canMoveUp = computed(() => {
  if (!currentComponent.value || !editorStore.currentPage) return false
  const components = editorStore.currentPage.components
  const index = components.findIndex(comp => comp.id === currentComponent.value?.id)
  return index < components.length - 1
})

//当前选中组件不是第一个组件才允许下移
const canMoveDown = computed(() => {
  if (!currentComponent.value || !editorStore.currentPage) return false
  const components = editorStore.currentPage.components
  const index = components.findIndex(comp => comp.id === currentComponent.value?.id)
  return index > 0
})

const updateComponentStyle = () => {
  if (!currentComponent.value) return
  editorStore.updateComponentStyle(currentComponent.value.id, currentComponent.value.style)
}

const updateComponentProps = () => {
  if (!currentComponent.value) return
  editorStore.updateComponentProps(currentComponent.value.id, currentComponent.value.props)
}

const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
  if (!currentComponent.value) return
  editorStore.moveComponentLayer(currentComponent.value.id, direction)
}

const deleteCurrentComponent = () => {
  if (!currentComponent.value) return
  editorStore.deleteComponent(currentComponent.value.id)
}
</script>

<style scoped>
.property-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 40px 20px;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.property-content {
  flex: 1;
  height: 0;
}

.property-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.property-section:last-child {
  border-bottom: none;
}

.property-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.property-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.property-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-buttons .el-button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.property-buttons .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 8px 4px;
}

.el-scrollbar {
  height: 100%;
}
</style>
