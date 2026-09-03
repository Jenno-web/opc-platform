<script setup lang="ts">
import { computed } from 'vue'

// 跟移动端 apps/frontend/src/components/Avatar.vue 同一套逻辑（按名字哈希确定性取色，
// 不存在真实头像图片来源就不伪造假图片），标签换成标准 HTML（<img>/<div>/<span>
// 替代 uni-app 编译出来的 <image>/<view>/<text>），size 默认值换成 px
// 桌面这轮改成暗色主题后，移动端那套低饱和色在近黑背景上太闷，换成更亮的一组、
// 跟 tokens.scss 里新的强调色/状态色同一个饱和度量级
const AVATAR_PALETTE = ['#6D5EF5', '#2DD4BF', '#F87171', '#FBBF24', '#C084FC', '#34D399']

const props = withDefaults(
  defineProps<{
    name: string
    avatarUrl?: string | null
    size?: string
  }>(),
  { avatarUrl: null, size: '36px' },
)

const letterSize = computed(() => {
  const n = parseFloat(props.size)
  return Number.isFinite(n) ? `${n * 0.4}px` : '14px'
})

const fallbackColor = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
})
</script>

<template>
  <img v-if="avatarUrl" class="opc-avatar" :style="{ width: size, height: size }" :src="avatarUrl" alt="" />
  <div
    v-else
    class="opc-avatar opc-avatar--fallback"
    :style="{ width: size, height: size, background: fallbackColor }"
  >
    <span class="opc-avatar__letter" :style="{ fontSize: letterSize }">{{ name.slice(0, 1) }}</span>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.opc-avatar {
  flex-shrink: 0;
  border-radius: 50%;
  background: $opc-bg-subtle;
  object-fit: cover;

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 0 2px $opc-bg-page;
  }

  &__letter {
    color: #ffffff;
    font-weight: 700;
  }
}
</style>
