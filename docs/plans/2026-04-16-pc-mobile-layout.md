# PC Mobile Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为营销页面编辑器增加 PC/mobile 双端布局能力，支持一键生成移动端初稿并分别微调两端布局。

**Architecture:** 页面内容仍然共用一份 `props`，布局层按设备拆成 `pc/mobile` 两套。编辑器中的 `style` 继续作为当前设备的工作样式，真实的双端布局则持久化在 `layouts` 与 `deviceStyles` 中，切端时由 store 负责同步到当前工作态。

**Tech Stack:** Vue 3、TypeScript、Pinia、Element Plus

---

### Task 1: 扩展多端布局数据结构

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/editor.ts`

**Step 1: 定义设备类型**

新增：

```ts
export type DeviceType = 'pc' | 'mobile'
```

**Step 2: 定义组件布局映射**

为组件补充：

```ts
layouts?: Partial<Record<DeviceType, ComponentStyle>>
```

**Step 3: 定义页面设备样式映射**

为页面补充：

```ts
deviceStyles?: Partial<Record<DeviceType, PageStyle>>
currentDevice?: DeviceType
```

### Task 2: 让 store 接管双端布局

**Files:**
- Modify: `src/stores/editor.ts`

**Step 1: 维护当前设备**

新增 `currentDevice` 状态，并向外暴露。

**Step 2: 归一化历史页面数据**

对旧页面做兼容：

- 没有 `layouts` 时，把当前 `style` 视为 `pc`
- 没有 `deviceStyles` 时，把当前页面尺寸视为 `pc`

**Step 3: 增加切端方法**

新增：

```ts
setCurrentDevice(device: DeviceType)
```

切端时把对应设备的布局同步回当前工作样式。

**Step 4: 增加移动端初稿生成**

新增：

```ts
generateMobileLayout()
```

按 PC 画布宽度比例生成 mobile 组件布局和 mobile 页面尺寸。

### Task 3: 在编辑器接入设备切换

**Files:**
- Modify: `src/components/Editor.vue`
- Modify: `src/components/EditorCanvas.vue`

**Step 1: 增加 PC / 移动端按钮**

在顶部右侧新增切换入口。

**Step 2: 首次切 mobile 时生成初稿**

如果当前页面还没有 mobile 布局：

- 弹确认框
- 生成移动端布局
- 切换到 mobile

**Step 3: 去掉画布固定最小宽度**

让移动端画布宽度可以真实显示为手机尺寸。

### Task 4: 验证

**Files:**
- Check: `src/types/index.ts`
- Check: `src/stores/editor.ts`
- Check: `src/components/Editor.vue`
- Check: `src/components/EditorCanvas.vue`

**Step 1: 运行诊断**

检查 Vue 和 TypeScript 报错。

**Step 2: 运行构建**

Run: `npm run build`
Expected: 构建通过

**Step 3: 手动验证**

确认：

```text
1. 顶部出现 PC / 移动端 切换按钮
2. 首次切移动端会提示生成初稿
3. 生成后画布宽度切换为手机尺寸
4. 在 mobile 下调位置和尺寸不影响 PC
5. 切回 PC 时原布局仍保持不变
```
