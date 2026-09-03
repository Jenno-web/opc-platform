<script setup lang="ts">
import { computed } from 'vue'

// 跟移动端 apps/frontend/src/components/Avatar.vue 同一套逻辑（按名字哈希确定性取色，
// 不存在真实头像图片来源就不伪造假图片），标签换成标准 HTML（<img>/<div>/<span>
// 替代 uni-app 编译出来的 <image>/<view>/<text>），size 默认值换成 px
const AVATAR_PALETTE = ['#3B4BC4', '#2F8A7F', '#C15B3A', '#A9793A', '#7D5AA6', '#4F8F5B']

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
