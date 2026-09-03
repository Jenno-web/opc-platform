import type { Directive } from 'vue'

// 参考站下滑露出内容用的是 IntersectionObserver：元素刚渲染时是"隐藏态"（半透明+偏移），
// 真正滚动进视口的那一刻才补一个 class 触发过渡，露出来。之前只做了页面刚加载时的
// 一次性错峰淡入（opc-fade-up），那个在元素一开始就不在视口里时其实是"空过"的——
// 动画在你看不到的地方就播完了，滚下去看到的已经是终态，等于没有效果。
// 用一个全局共享的 observer 而不是每个元素各建一个，减少开销；元素露出一次之后就
// unobserve，不会每次滚上滚下重复触发（符合大多数滚动揭示效果给人的直觉）
const observer =
  typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in-view')
              observer?.unobserve(entry.target)
            }
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
