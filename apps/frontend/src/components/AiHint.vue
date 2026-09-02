<script setup lang="ts">
import Icon from '@/components/Icon.vue'

defineProps<{
  text: string
  emphasis?: string
  label?: string
}>()
</script>

<template>
  <view class="ai-hint">
    <view class="ai-hint__label">
      <Icon name="sparkle" size="20rpx" color="#ffffff" />
      <text>{{ label ?? 'AI' }}</text>
    </view>
    <text class="ai-hint__text">{{ text }}</text>
    <text v-if="emphasis" class="ai-hint__emphasis">{{ emphasis }}</text>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// 导师反馈"AI 能力是卖点但视觉上完全看不出来"——之前这里只靠加粗+边框区分，现在
// 用强调色系统：浅底 + 左边一条实色竖条，一眼就能认出"这是 AI 生成的内容"
.ai-hint {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: $opc-spacing-xxs;
  padding: $opc-spacing-xs $opc-spacing-sm;
  padding-left: calc(#{$opc-spacing-sm} + 6rpx);
  background: $opc-color-accent-soft;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card-sm;
  box-shadow: $opc-shadow-sm;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: $opc-color-accent;
  }

  &__label {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4rpx;
    color: #ffffff;
    font-size: $opc-font-xs;
    font-weight: 700;
    background: $opc-color-accent;
    border-radius: $opc-radius-tag;
    padding: 2rpx 14rpx;
  }

  &__text {
    flex: 1;
    color: $opc-color-text;
    font-size: $opc-font-sm;
  }

  &__emphasis {
    color: $opc-color-accent;
    font-weight: 700;
    font-size: $opc-font-sm;
  }
}
</style>
