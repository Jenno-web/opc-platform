<script setup lang="ts">
defineProps<{
  text: string
  emphasis?: string
  label?: string
}>()
</script>

<template>
  <view class="ai-hint">
    <text class="ai-hint__label">{{ label ?? 'AI' }}</text>
    <text class="ai-hint__text">{{ text }}</text>
    <text v-if="emphasis" class="ai-hint__emphasis">{{ emphasis }}</text>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// 真实 Figma 设计没有单独的"AI 强调色"，AI 相关内容靠加粗标签 + 边框区分，不靠色彩
.ai-hint {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  background: $opc-bg-subtle;
  border: 1px solid $opc-border-color;
  border-radius: 16rpx;

  &__label {
    flex-shrink: 0;
    color: $opc-color-text;
    font-size: 20rpx;
    font-weight: 700;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: 2rpx 12rpx;
  }

  &__text {
    flex: 1;
    color: $opc-color-text;
    font-size: 24rpx;
  }

  &__emphasis {
    color: $opc-color-text;
    font-weight: 700;
    font-size: 24rpx;
  }
}
</style>
