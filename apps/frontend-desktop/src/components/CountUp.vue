<script setup lang="ts">
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
  <span>{{ displayValue }}{{ suffix }}</span>
</template>
