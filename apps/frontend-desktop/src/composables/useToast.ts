import { ref } from 'vue'

// 移动端用 uni.showToast，桌面这边没有这个运行时 API，自己实现一个最简单的
// 单例 toast 队列：request.ts 出错时调用 showToast，Toast.vue 挂在 App.vue 里读这个队列渲染
export interface ToastItem {
  id: number
  message: string
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

export function showToast(message: string, duration = 2400) {
  const id = nextId++
  toasts.value.push({ id, message })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, duration)
}

export function useToast() {
  return { toasts }
}
