import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PageData, ComponentData, ComponentStyle, Command, DeviceType, PageStyle } from '@/types'
import { ComponentType } from '@/types'
import { MATERIALS } from '@/materials'
import { useHistoryStore } from './history'
//如果这个数据只有一个组件关心，放组件里；超过一个组件关心，放 store 里。
// 核心数据层，存整个编辑器的状态：
//得有export，在其他组件里用
export const useEditorStore = defineStore('editor', () => {
  const currentPage = ref<PageData | null>(null)
  const currentComponent = ref<ComponentData | null>(null)
  const currentDevice = ref<DeviceType>('pc')
  const canvasScale = ref(1)
  const snapToGrid = ref(true)
  const showGuidelines = ref(true)
  const localPagesVersion = ref(0)
  const MOBILE_WIDTH = 375
  const MOBILE_MIN_HEIGHT = 812
  const createPageId = () => `page_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const createComponentId = () => `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const deepClone = <T>(v: T): T => JSON.parse(JSON.stringify(v))
  const cloneStyle = <T extends object>(style: T): T => deepClone(style)

  const createDefaultPageStyle = (device: DeviceType = 'pc'): PageStyle => ({
    width: device === 'mobile' ? MOBILE_WIDTH : 1200,
    height: device === 'mobile' ? MOBILE_MIN_HEIGHT : 800,
    backgroundColor: '#ffffff',
  })

  const scaleComponentStyle = (style: ComponentStyle, scale: number): ComponentStyle => ({
    ...style,
    top: Math.max(0, Math.round(style.top * scale)),
    left: Math.max(0, Math.round(style.left * scale)),
    width: Math.max(20, Math.round(style.width * scale)),
    height: Math.max(20, Math.round(style.height * scale)),
    fontSize: style.fontSize ? Math.max(8, Math.round(style.fontSize * scale)) : style.fontSize,
    borderWidth:
      style.borderWidth !== undefined ? Math.max(0, Math.round(style.borderWidth * scale)) : style.borderWidth,
    borderRadius:
      style.borderRadius !== undefined ? Math.max(0, Math.round(style.borderRadius * scale)) : style.borderRadius,
  })

  const normalizePageData = (page: PageData) => {
    const initialDevice = page.currentDevice || 'pc'
    page.currentDevice = initialDevice
    page.deviceStyles = page.deviceStyles || {}
    page.deviceStyles.pc = page.deviceStyles.pc || cloneStyle(page.style)
    page.deviceStyles[initialDevice] = page.deviceStyles[initialDevice] || cloneStyle(page.style)//cloneStyle() 就是在做“拷贝一份独立对象”。

    page.components.forEach((component) => {
      component.layouts = component.layouts || {}
      component.layouts.pc = component.layouts.pc || cloneStyle(component.style)
      component.layouts[initialDevice] = component.layouts[initialDevice] || cloneStyle(component.style)
    })
  }

  //把页面切到某个设备视图，并把对应的样式灌回当前渲染态
  const hydratePageForDevice = (page: PageData, device: DeviceType) => {
    normalizePageData(page)//先补齐页面数据，避免后面取值时报空。
    page.currentDevice = device

    const targetPageStyle = page.deviceStyles?.[device] || page.deviceStyles?.pc || createDefaultPageStyle(device)
    page.style = cloneStyle(targetPageStyle)

    page.components.forEach((component) => {
      const targetStyle = component.layouts?.[device] || component.layouts?.pc || component.style
      component.style = cloneStyle(targetStyle)
    })
  }

  const syncCurrentComponentSelection = () => {
    if (!currentPage.value || !currentComponent.value) return
    currentComponent.value =
      currentPage.value.components.find((component) => component.id === currentComponent.value?.id) || null
  }

  const createNewPage = (title: string = '新页面') => {
    currentPage.value = {
      id: createPageId(),
      title,
      components: [],
      style: createDefaultPageStyle('pc'),
      deviceStyles: {
        pc: createDefaultPageStyle('pc'),
      },
      currentDevice: 'pc',
    }
    currentDevice.value = 'pc'
    currentComponent.value = null
  }

  const addComponent = (type: ComponentType, initialProps: Record<string, unknown> = {}) => {
    if (!currentPage.value) return

    const material = MATERIALS[type]
    if (!material) return

    const historyStore = useHistoryStore()

    // 从initialProps中提取style相关的属性
    const { left, top, width, height, zIndex, rotate, ...otherProps } = initialProps as Record<
      string,
      unknown
    >

    // 合并style，优先使用传入的位置参数
    const finalStyle: ComponentStyle = {
      top: typeof top === 'number' ? top : (material.defaultStyle.top as number),
      left: typeof left === 'number' ? left : (material.defaultStyle.left as number),
      width: typeof width === 'number' ? width : (material.defaultStyle.width as number),
      height: typeof height === 'number' ? height : (material.defaultStyle.height as number),
      zIndex: typeof zIndex === 'number' ? zIndex : (material.defaultStyle.zIndex as number),
      rotate: typeof rotate === 'number' ? rotate : (material.defaultStyle.rotate as number),
      fontSize: material.defaultStyle.fontSize as number | undefined,
      color: material.defaultStyle.color as string | undefined,
      backgroundColor: material.defaultStyle.backgroundColor as string | undefined,
      borderWidth: material.defaultStyle.borderWidth as number | undefined,
      borderColor: material.defaultStyle.borderColor as string | undefined,
      borderRadius: material.defaultStyle.borderRadius as number | undefined,
    }

    const sourcePageStyle = currentPage.value.deviceStyles?.[currentDevice.value] || currentPage.value.style
    const componentLayouts: ComponentData['layouts'] = {
      [currentDevice.value]: cloneStyle(finalStyle),
    }

    ;(['pc', 'mobile'] as DeviceType[]).forEach((device) => {
      const targetPageStyle = currentPage.value?.deviceStyles?.[device]
      if (!targetPageStyle || device === currentDevice.value) return

      const scale = targetPageStyle.width / Math.max(sourcePageStyle.width, 1)
      componentLayouts[device] = scaleComponentStyle(finalStyle, scale)
    })

    const component: ComponentData = {
      id: createComponentId(),
      type,
      style: cloneStyle(finalStyle),
      layouts: componentLayouts,
      props: { ...material.defaultProps, ...otherProps },
    }

    // 创建命令对象
    const command: Command = {
      // execute：push 到页面组件数组，并选中它
      execute: () => {
        // currentPage是响应式所以.value,如果存在就继续往下找
        currentPage.value?.components.push(component)
        // console.log('currentPage.value?.components', currentPage.value?.components)
        currentComponent.value = component
      },
      // undo：把它从数组里删掉
      undo: () => {
        if (!currentPage.value) return
        // findIndex 是数组的方法，谁调用它就遍历谁。
        // 找到组件在数组中的索引
        const index = currentPage.value.components.findIndex((comp) => comp.id === component.id)
        if (index !== -1) {
          // 从数组中删除组件
          currentPage.value.components.splice(index, 1)
        }
        if (currentComponent.value?.id === component.id) {
          // 如果当前选中的组件是被删除的组件，清空选中状态
          currentComponent.value = null
        }
      },
    }
    // 真正加组件，并记录
    historyStore.executeCommand(command)
  }

  const selectComponent = (component: ComponentData | null) => {
    currentComponent.value = component
  }

  const updateComponentStyle = (
    componentId: string,
    // styleUpdates想改的样式，partial是部分，也就是说可以改部分样式，冒号后面的是ts的类型定义
    styleUpdates: Partial<ComponentData['style']>,
  ) => {
    if (!currentPage.value) return
    const component = currentPage.value.components.find((comp) => comp.id === componentId)
    if (!component) return
    const historyStore = useHistoryStore()
    //拷贝旧样式
    const oldStyle = cloneStyle(component.style)

    // 创建命令对象
    const command: Command = {
      execute: () => {
        Object.assign(component.style, styleUpdates)
        component.layouts = component.layouts || {}
        component.layouts[currentDevice.value] = cloneStyle(component.style)
      },
      undo: () => {
        Object.assign(component.style, oldStyle)
        component.layouts = component.layouts || {}
        component.layouts[currentDevice.value] = cloneStyle(oldStyle)
      },
    }
    historyStore.executeCommand(command)
  }

  const updateComponentProps = (
    componentId: string,
    propUpdates: Partial<ComponentData['props']>,
  ) => {
    if (!currentPage.value) return

    const component = currentPage.value.components.find((comp) => comp.id === componentId)
    if (!component) return

    const historyStore = useHistoryStore()
    const oldProps = { ...component.props }

    // 创建命令对象
    const command: Command = {
      execute: () => {
        // 这是把更新的参数放进去
        Object.assign(component.props, propUpdates)
      },
      undo: () => {
        // 这是把之前的参数放进去
        Object.assign(component.props, oldProps)
      },
    }

    historyStore.executeCommand(command)
  }
  //删除要改两个地方，一个是数组components，一个是选中状态currentComponent
  const deleteComponent = (componentId: string) => {
    if (!currentPage.value) return

    //如果这个操作希望支持撤销/重做，就需要 history
    const historyStore = useHistoryStore()
    //find()是找对象本体，findIndex()是找索引
    const index = currentPage.value.components.findIndex((comp) => comp.id === componentId)
    if (index === -1) return
    //取出对象本体
    const component = currentPage.value.components[index]
    if (!component) return
    // 要删的这个组件，删之前是不是处于选中状态？
    const wasSelected = currentComponent.value?.id === componentId

    // 创建命令对象
    const command: Command = {
      execute: () => {
        currentPage.value?.components.splice(index, 1)
        if (wasSelected) {
          currentComponent.value = null
        }
      },
      undo: () => {
        //在原位置插入组件
        currentPage.value?.components.splice(index, 0, component)
        if (wasSelected) {
          currentComponent.value = component
        }
      },
    }

    historyStore.executeCommand(command)
  }

    const moveComponentLayer = (componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
        if (!currentPage.value) return

        const components = currentPage.value.components
        const index = components.findIndex(comp => comp.id === componentId)
        if (index === -1) return

        if (direction === 'up' && index < components.length - 1) {
          const temp = components[index]
          if (temp) {
            components.splice(index, 1)
            components.splice(index + 1, 0, temp)
          }
        } else if (direction === 'down' && index > 0) {
          const temp = components[index]
          if (temp) {
            components.splice(index, 1)
            components.splice(index - 1, 0, temp)
          }
        } else if (direction === 'top') {
          const component = components.splice(index, 1)[0]
          if (component) {
            components.push(component)
          }
        } else if (direction === 'bottom') {
          const comp = components.splice(index, 1)[0]
          if (comp) {
            components.unshift(comp)
          }
        }
      }

  const exportPageData = () => {
    return currentPage.value ? JSON.stringify(currentPage.value, null, 2) : null
  }

  const renameCurrentPage = (title: string) => {
    if (!currentPage.value) return
    currentPage.value.title = title
    saveCurrentPageToLocal(title)
  }

  const LOCAL_KEY = 'yuanLowCode:pages'
  const getLocalPages = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      return raw
        ? (JSON.parse(raw) as Array<{ id: string; title: string; data: PageData; savedAt: number }>)
        : []
    } catch {
      return []
    }
  }
  const setLocalPages = (
    pages: Array<{ id: string; title: string; data: PageData; savedAt: number }>,
  ) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(pages))
    localPagesVersion.value++
  }
  const saveCurrentPageToLocal = (title?: string) => {
    if (!currentPage.value) return
    const pages = getLocalPages()
    const existingIndex = pages.findIndex((p) => p.id === currentPage.value?.id)
    const payload = {
      id: currentPage.value.id,
      title: title || currentPage.value.title,
      data: deepClone(currentPage.value),
      savedAt: Date.now(),
    }
    if (existingIndex >= 0) {
      pages[existingIndex] = payload
    } else {
      pages.push(payload)
    }
    setLocalPages(pages)
  }
  const listLocalPages = () => {
    return getLocalPages().map((p) => ({ id: p.id, title: p.title, savedAt: p.savedAt }))
  }
  const loadPageFromLocal = (id: string) => {
    const pages = getLocalPages()
    const found = pages.find((p) => p.id === id)
    if (found) {
      const loadedPage = deepClone(found.data)
      normalizePageData(loadedPage)
      currentDevice.value = loadedPage.currentDevice || 'pc'
      hydratePageForDevice(loadedPage, currentDevice.value)
      currentPage.value = loadedPage
      currentComponent.value = null
    }
  }
  const applyPageTemplate = (pageData: PageData) => {
    const clonedPage = deepClone(pageData)
    clonedPage.id = createPageId()
    clonedPage.components = clonedPage.components.map((component) => ({
      ...component,
      id: createComponentId(),
    }))
    normalizePageData(clonedPage)
    currentDevice.value = clonedPage.currentDevice || 'pc'
    hydratePageForDevice(clonedPage, currentDevice.value)
    currentPage.value = clonedPage
    currentComponent.value = null
  }
  const deleteLocalPage = (id: string) => {
    const pages = getLocalPages().filter((p) => p.id !== id)
    setLocalPages(pages)
  }

  // 更新页面级别的样式（宽度、高度、背景色）
  // 和 updateComponentStyle 的区别：这个改的是整个画布，不是某个组件
  // Partial<PageData['style']> 表示可以只传部分字段，比如只改宽度不改高度
  const updatePageStyle = (styleUpdates: Partial<PageData['style']>) => {
    if (!currentPage.value) return
    // Object.assign：把 styleUpdates 里的字段逐个合并进 currentPage.style
    // 因为 currentPage 是响应式的，这里一改，画布会自动重新渲染
    Object.assign(currentPage.value.style, styleUpdates)
    currentPage.value.deviceStyles = currentPage.value.deviceStyles || {}
    currentPage.value.deviceStyles[currentDevice.value] = cloneStyle(currentPage.value.style)
  }

  const hasDeviceLayout = (device: DeviceType) => {
    if (!currentPage.value) return false
    if (device === 'pc') return true

    return Boolean(
      currentPage.value.deviceStyles?.[device] &&
        currentPage.value.components.every((component) => Boolean(component.layouts?.[device])),
    )
  }

  const generateMobileLayout = () => {
    if (!currentPage.value) return

    normalizePageData(currentPage.value)
    const pcPageStyle = currentPage.value.deviceStyles?.pc || createDefaultPageStyle('pc')
    const scale = MOBILE_WIDTH / Math.max(pcPageStyle.width, 1)

    let maxBottom = 0
    currentPage.value.components.forEach((component) => {
      const pcStyle = component.layouts?.pc || component.style
      const mobileStyle = scaleComponentStyle(pcStyle, scale)
      component.layouts = component.layouts || {}
      component.layouts.mobile = mobileStyle
      maxBottom = Math.max(maxBottom, mobileStyle.top + mobileStyle.height)
    })

    currentPage.value.deviceStyles = currentPage.value.deviceStyles || {}
    currentPage.value.deviceStyles.mobile = {
      width: MOBILE_WIDTH,
      height: Math.max(MOBILE_MIN_HEIGHT, maxBottom + 80),
      backgroundColor: pcPageStyle.backgroundColor,
    }
  }

  const setCurrentDevice = (device: DeviceType) => {
    if (!currentPage.value) return
    currentDevice.value = device
    hydratePageForDevice(currentPage.value, device)
    syncCurrentComponentSelection()
  }

  //决定外部可以拿到什么
  return {
    currentPage: computed(() => currentPage.value),
    currentComponent: computed(() => currentComponent.value),
    currentDevice: computed(() => currentDevice.value),
    canvasScale: computed(() => canvasScale.value),
    snapToGrid: computed(() => snapToGrid.value),
    showGuidelines: computed(() => showGuidelines.value),
    localPagesVersion: computed(() => localPagesVersion.value),

    createNewPage,
    addComponent,
    selectComponent,
    updateComponentStyle,
    updateComponentProps,
    deleteComponent,
    moveComponentLayer,
    exportPageData,
    renameCurrentPage,
    saveCurrentPageToLocal,
    listLocalPages,
    loadPageFromLocal,
    applyPageTemplate,
    hasDeviceLayout,
    generateMobileLayout,
    setCurrentDevice,
    deleteLocalPage,
    updatePageStyle,

    setCanvasScale: (scale: number) => (canvasScale.value = scale),
    setSnapToGrid: (enabled: boolean) => (snapToGrid.value = enabled),
    setShowGuidelines: (enabled: boolean) => (showGuidelines.value = enabled),
  }
})
