# Double11 Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为营销页面编辑器增加“双十一活动模板”入口，支持一键套用模板并继续编辑。

**Architecture:** 模板以 `PageData` 工厂函数形式存放在独立模块中；编辑器通过模板弹窗选择模板，调用 `editor store` 的模板套用方法，把模板数据注入 `currentPage`。模板最终仍然走现有画布、属性面板、预览和草稿保存链路。

**Tech Stack:** Vue 3、TypeScript、Pinia、Element Plus

---

### Task 1: 增加模板类型与模板数据

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/templates/marketing/double11.ts`
- Create: `src/templates/index.ts`

**Step 1: 扩展模板元数据类型**

在 `src/types/index.ts` 中补充模板元数据类型，包含：

```ts
export interface PageTemplateMeta {
  id: string
  name: string
  description: string
  cover: string
  createPageData: () => PageData
}
```

**Step 2: 实现双十一模板工厂**

在 `src/templates/marketing/double11.ts` 中导出模板元数据，并返回一份完整 `PageData`：

```ts
export const double11Template: PageTemplateMeta = {
  id: 'double11',
  name: '双十一活动模板',
  description: '适合活动落地页，含主标题、主视觉、卖点和 CTA 按钮',
  cover: 'https://via.placeholder.com/480x270?text=Double11+Template',
  createPageData: () => ({ ... })
}
```

**Step 3: 暴露模板列表**

在 `src/templates/index.ts` 中导出模板列表：

```ts
export const PAGE_TEMPLATES = [double11Template]
```

### Task 2: 给 editor store 增加模板套用能力

**Files:**
- Modify: `src/stores/editor.ts`
- Check: `src/stores/history.ts`

**Step 1: 抽出页面与组件 id 生成逻辑**

新增简单的 id 生成辅助函数：

```ts
const createPageId = () => `page_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
const createComponentId = () => `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
```

**Step 2: 更新 createNewPage**

让空白页面创建也复用 `createPageId()`，避免模板和新建页面逻辑分裂。

**Step 3: 新增模板套用方法**

增加：

```ts
const applyPageTemplate = (pageData: PageData) => {
  const cloned = deepClone(pageData)
  cloned.id = createPageId()
  cloned.components = cloned.components.map((component) => ({
    ...component,
    id: createComponentId(),
  }))
  currentPage.value = cloned
  currentComponent.value = null
}
```

**Step 4: 对外暴露方法**

把 `applyPageTemplate` 挂到 store return 中。

### Task 3: 在 Editor 中接入模板入口和弹窗

**Files:**
- Modify: `src/components/Editor.vue`

**Step 1: 接入模板列表**

从 `src/templates/index.ts` 引入 `PAGE_TEMPLATES`，准备模板弹窗状态和当前模板列表。

**Step 2: 增加模板入口按钮**

在顶部右侧按钮区新增 `使用模板` 按钮。

**Step 3: 增加模板弹窗**

弹窗展示模板卡片：

```vue
<div v-for="template in PAGE_TEMPLATES" :key="template.id" class="template-card">
  <img :src="template.cover" :alt="template.name" />
  <h4>{{ template.name }}</h4>
  <p>{{ template.description }}</p>
  <el-button type="primary" @click="handleApplyTemplate(template)">立即使用</el-button>
</div>
```

**Step 4: 增加覆盖确认**

如果当前页面已有组件，先调用 `ElMessageBox.confirm`，确认后再应用模板。

**Step 5: 套用模板后的收尾**

调用 `editorStore.applyPageTemplate(template.createPageData())` 后：

```ts
historyStore.clearHistory()
selectedDraftId.value = null
templateDialogVisible.value = false
ElMessage.success('已套用双十一模板')
```

### Task 4: 验证模板流程

**Files:**
- Check: `src/components/Editor.vue`
- Check: `src/stores/editor.ts`
- Check: `src/templates/index.ts`
- Check: `src/templates/marketing/double11.ts`
- Check: `src/types/index.ts`

**Step 1: 运行诊断**

检查 Vue 模板和 TypeScript 是否报错。

**Step 2: 运行构建**

Run: `npm run build`
Expected: 构建通过

**Step 3: 手动验证**

确认：

```text
1. 页面顶部出现“使用模板”按钮
2. 能打开模板弹窗并看到“双十一活动模板”
3. 套用模板后生成预置页面
4. 标题、主图、按钮都可继续编辑
5. 模板页面仍可保存、预览、导出 JSON
```
