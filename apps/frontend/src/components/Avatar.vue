<script setup lang="ts">
import { computed } from 'vue'

// 头像目前没有真实图片来源——avatarUrl 在种子数据里从来没被赋值过，后端也没有上传/图片处理
// 逻辑，接入第三方头像图库等于伪造"这是真用户头像"的假象。所以走的是"把首字母头像做精致"
// 这条路，不是找假图片替换。之前这段逻辑在 profile/detail/voice-room 三处各写一份、样式还不一致，
// 这里收成一个组件。
const props = withDefaults(
  defineProps<{
    name: string
    avatarUrl?: string | null
    size?: string
  }>(),
  { avatarUrl: null, size: '72rpx' },
)

// 字母大小跟着头像尺寸走，不能用 CSS 百分比字号（那是相对父级字号，不是相对头像自身宽高）
const letterSize = computed(() => {
  const n = parseFloat(props.size)
  return Number.isFinite(n) ? `${n * 0.4}rpx` : '28rpx'
})
</script>

<template>
  <image v-if="avatarUrl" class="opc-avatar" :style="{ width: size, height: size }" :src="avatarUrl" />
  <view v-else class="opc-avatar opc-avatar--fallback" :style="{ width: size, height: size }">
    <text class="opc-avatar__letter" :style="{ fontSize: letterSize }">{{ name.slice(0, 1) }}</text>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.opc-avatar {
  flex-shrink: 0;
  border-radius: 50%;
  background: $opc-bg-subtle;

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $opc-border-color;
    box-shadow: inset 0 0 0 3rpx $opc-bg-page, 0 0 0 1px $opc-border-color;
  }

  &__letter {
    color: $opc-color-text;
    font-weight: 700;
  }
}
</style>
