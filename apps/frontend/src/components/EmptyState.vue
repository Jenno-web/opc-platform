<script setup lang="ts">
withDefaults(
  defineProps<{
    text: string
    hint?: string
  }>(),
  {},
)
</script>

<template>
  <view class="empty-state">
    <view class="empty-state__icon">
      <view class="empty-state__icon-dash" />
    </view>
    <text class="empty-state__text">{{ text }}</text>
    <text v-if="hint" class="empty-state__hint">{{ hint }}</text>
    <slot />
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $opc-spacing-xs;
  padding: $opc-spacing-xl $opc-spacing;

  &__icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    border: 2px dashed $opc-border-color;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon-dash {
    width: 32rpx;
    height: 4rpx;
    background: $opc-color-text-placeholder;
    border-radius: $opc-radius-tag;
  }

  &__text {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__hint {
    font-size: $opc-font-xs;
    color: $opc-color-text-placeholder;
  }
}
</style>
