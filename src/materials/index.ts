import type { MaterialLibrary } from './types'
import { textMaterial } from './components/text'
import { imageMaterial } from './components/image'
import { buttonMaterial } from './components/button'
import { inputMaterial } from './components/input'
// 物料库入口（导出所有物料）
export const MATERIALS: MaterialLibrary = {
  [textMaterial.meta.type]: textMaterial,
  [imageMaterial.meta.type]: imageMaterial,
  [buttonMaterial.meta.type]: buttonMaterial,
  [inputMaterial.meta.type]: inputMaterial
}
//Object.values 把对象的所有值取出来变成数组：
//.map(m => m.meta) 只取每个物料的 meta 信息,{ type: 'Button', name: '按钮', icon: CircleCheck }
export const MATERIAL_LIST = Object.values(MATERIALS).map(m => m.meta)

export * from './types'
