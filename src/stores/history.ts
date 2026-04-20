import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Command } from '@/types'
// 专门管撤销/重做：
export const useHistoryStore = defineStore('history', () => {
  // Command[] 就是"Command 类型的数组"
  const undoStack = ref<Command[]>([]) // 已执行的命令列表
  const redoStack = ref<Command[]>([]) // 已撤销的命令列表
  const maxHistorySize = ref(50) //历史记录最多存50条

  const canUndo = () => undoStack.value.length > 0
  const canRedo = () => redoStack.value.length > 0

  const executeCommand = (command: Command) => {
    // 执行正向，push进页面数组
    command.execute()
    // 执行反向，push进撤销数组，让他可以撤销
    undoStack.value.push(command)

    if (undoStack.value.length > maxHistorySize.value) {
      undoStack.value.shift() //多了就把最老的删掉
    }
    //清空
    redoStack.value.length = 0
  }

  const undo = () => {
    if (!canUndo()) return

    const command = undoStack.value.pop() //弹出最后一步
    if (command) {
      command.undo()
      redoStack.value.push(command) // 存进重做栈
    }
  }

  const redo = () => {
    if (!canRedo()) return

    const command = redoStack.value.pop() // 取出最后一次撤销
    if (command) {
      command.execute()
      undoStack.value.push(command) // 存回撤销栈
    }
  }

  const clearHistory = () => {
    undoStack.value.length = 0
    redoStack.value.length = 0
  }

  return {
    undoStack: undoStack,
    redoStack: redoStack,
    maxHistorySize: maxHistorySize,
    canUndo,
    canRedo,
    executeCommand,
    undo,
    redo,
    clearHistory,
  }
})
