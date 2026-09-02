<script setup lang="ts">
import { computed } from 'vue'

// 头像目前没有真实图片来源——avatarUrl 在种子数据里从来没被赋值过，后端也没有上传/图片处理
// 逻辑，接入第三方头像图库等于伪造"这是真用户头像"的假象。所以走的是"把首字母头像做精致"
// 这条路，不是找假图片替换。之前这段逻辑在 profile/detail/voice-room 三处各写一份、样式还不一致，
// 这里收成一个组件。
//
// 之前所有人的首字母头像都是同一个灰底黑字，列表页一排头像看着全一样、没有区分度。
// 改成按名字哈希确定性取色——同一个人任何地方看到的都是同一个颜色，不是每次刷新随机跳变，
// 但不同人之间会自然分散到不同色相，页面里出现真实的颜色变化。取色跟 tokens.scss 里
// $opc-color-kind-* 是同一套克制色相，保持整站视觉语言一致（这里没法直接 import scss 变量，
// 手动同步的十六进制值）
const AVATAR_PALETTE = ['#3B4BC4', '#2F8A7F', '#C15B3A', '#A9793A', '#7D5AA6', '#4F8F5B']

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

const fallbackColor = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
})
</script>

<template>
  <image v-if="avatarUrl" class="opc-avatar" :style="{ width: size, height: size }" :src="avatarUrl" />
  <view
    v-else
    class="opc-avatar opc-avatar--fallback"
    :style="{ width: size, height: size, background: fallbackColor }"
  >
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
    box-shadow: inset 0 0 0 3rpx $opc-bg-page;
  }

  &__letter {
    color: #ffffff;
    font-weight: 700;
  }
}
</style>
