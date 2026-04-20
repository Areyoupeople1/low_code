# Text Style Fields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为现有 `Text` 组件补充 `fontWeight` 和 `textAlign` 两个样式字段，并在属性面板中可配置。

**Architecture:** 保持 `Text` 仍然是通用文本组件，通过样式配置区分标题、正文等营销场景用途。数据层扩展类型与物料默认值，渲染层读取新增样式字段，属性面板为 `Text` 暴露可视化控制项。

**Tech Stack:** Vue 3、TypeScript、Pinia、Element Plus

---

### Task 1: 扩展类型与默认值

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/materials/components/text.ts`

**Step 1: 检查类型定义**

确认 `ComponentStyle` 是否包含：

```ts
fontWeight?: 'normal' | 'bold'
textAlign?: 'left' | 'center' | 'right'
```

**Step 2: 检查 Text 物料默认值**

确认 `defaultStyle` 是否包含：

```ts
fontWeight: 'normal',
textAlign: 'left'
```

**Step 3: 保持可编辑字段一致**

在 `editableFields` 中加入：

```ts
'fontWeight',
'textAlign'
```

### Task 2: 让 Text 组件渲染新增样式

**Files:**
- Modify: `src/components/components/TextComponent.vue`

**Step 1: 绑定新增样式**

在模板样式对象中读取：

```ts
fontWeight: component.style.fontWeight || 'normal',
textAlign: component.style.textAlign || 'left'
```

**Step 2: 保留原有垂直居中**

使用列方向 flex 保持文本块在容器中垂直居中：

```css
display: flex;
flex-direction: column;
justify-content: center;
```

### Task 3: 在属性面板暴露控制项

**Files:**
- Modify: `src/components/PropertyPanel.vue`

**Step 1: 添加字体粗细控制**

仅在 `currentComponent.type === 'Text'` 时显示：

```vue
<el-radio-group v-model="currentComponent.style.fontWeight" @change="updateComponentStyle">
  <el-radio-button label="normal">常规</el-radio-button>
  <el-radio-button label="bold">加粗</el-radio-button>
</el-radio-group>
```

**Step 2: 添加文字对齐控制**

仅在 `currentComponent.type === 'Text'` 时显示：

```vue
<el-radio-group v-model="currentComponent.style.textAlign" @change="updateComponentStyle">
  <el-radio-button label="left">左对齐</el-radio-button>
  <el-radio-button label="center">居中</el-radio-button>
  <el-radio-button label="right">右对齐</el-radio-button>
</el-radio-group>
```

### Task 4: 验证

**Files:**
- Check: `src/components/PropertyPanel.vue`
- Check: `src/components/components/TextComponent.vue`
- Check: `src/materials/components/text.ts`
- Check: `src/types/index.ts`

**Step 1: 运行诊断**

检查 TypeScript / Vue 模板报错，确认没有因为新增字段产生类型错误。

**Step 2: 手动验证**

在编辑器中拖入 `Text` 组件，确认：

```text
1. 默认是 normal + left
2. 切换加粗后立即生效
3. 切换左/中/右对齐后立即生效
4. 将字号调大并加粗后可直接作为“标题”使用
```
