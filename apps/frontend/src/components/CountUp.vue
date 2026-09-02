<script setup lang="ts">
// 任务统计、完整度这类关键数字之前是直接渲染最终值，数字一出现就是定死的，没有任何动效。
// 这个组件从 0 滚动到目标值，纯 CSS/JS 实现，不引入动画库
import { ref, watch, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    suffix?: string
  }>(),
  { duration: 600, suffix: '' },
)

const displayValue = ref(0)

function animateTo(target: number) {
  const start = displayValue.value
  const delta = target - start
  if (delta === 0) return
  const startTime = Date.now()
  function tick() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    // ease-out：先快后慢，数字滚动到最后会"收住"而不是匀速停下
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = Math.round(start + delta * eased)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => animateTo(props.value))
watch(() => props.value, (next) => animateTo(next))
</script>

<template>
  <text>{{ displayValue }}{{ suffix }}</text>
</template>
