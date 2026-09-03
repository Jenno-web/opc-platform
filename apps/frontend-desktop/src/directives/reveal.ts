import type { Directive } from 'vue'

// 参考站下滑露出内容用的是 IntersectionObserver：元素刚渲染时是"隐藏态"（半透明+偏移+
// 模糊），真正滚动进视口的那一刻才补一个 class 触发过渡，露出来。
// 进视口补 class、出视口去掉 class（不 unobserve）——上滑下滑都会触发，同一个元素滚出去
// 再滚回来会重新播一遍，不是只在第一次看到时播一次就锁死。
// 用一个全局共享的 observer 而不是每个元素各建一个，减少开销
const observer =
  typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            entry.target.classList.toggle('is-in-view', entry.isIntersecting)
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
      )
    : null

export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('opc-reveal')
    if (observer) {
      observer.observe(el)
    } else {
      // 没有 IntersectionObserver 的极端情况下直接显示，不阻塞内容
      el.classList.add('is-in-view')
    }
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
