<template>
  <div class="component-panel">
    <el-tabs v-model="activeTab" class="panel-tabs">
      <el-tab-pane name="components">
        <template #label>
          <span class="tab-label"><el-icon><Grid /></el-icon> 组件库</span>
        </template>
        <div class="component-list">
          <div
            v-for="component in componentTypes"
            :key="component.type"
            class="component-item"
            draggable="true"
            @dragstart="handleDragStart(component.type, $event)"
            @dragend="handleDragEnd"
          >
            <div class="component-icon">
              <el-icon><component :is="component.icon" /></el-icon>
            </div>
            <div class="component-name">{{ component.name }}</div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="ai">
        <template #label>
          <span class="tab-label"><el-icon><MagicStick /></el-icon> AI 助手</span>
        </template>
        <AiChatPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Grid, MagicStick } from '@element-plus/icons-vue'
import { MATERIAL_LIST } from '@/materials'
import AiChatPanel from './AiChatPanel.vue'

const activeTab = ref('components')
const componentTypes = ref(MATERIAL_LIST)

const handleDragStart = (componentType: string, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('componentType', componentType)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDragEnd = () => {}
</script>

<style scoped>
.component-panel {
  width: 240px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 8px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  flex-shrink: 0;
}

.panel-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  height: 0;
}

.panel-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.component-list {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.component-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.component-item:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.component-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.component-icon .el-icon {
  font-size: 20px;
  color: #409eff;
}

.component-name {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
