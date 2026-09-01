<script setup lang="ts">
import Icon from '@/components/Icon.vue'

// 对应 Figma 底部 Tab 组件里的悬浮"发布"按钮：不是常驻 Tab，是一个独立的入口，
// 点击后进入发布向导（pages/publish/index.vue）
function goPublish() {
  uni.navigateTo({ url: '/pages/publish/index' })
}
</script>

<template>
  <view class="publish-fab" hover-class="publish-fab--pressed" @click="goPublish">
    <Icon name="plus" size="44rpx" color="#ffffff" />
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.publish-fab {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 120rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: $opc-color-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $opc-shadow-lg;
  z-index: 999;
  transition: transform 0.15s ease;

  &--pressed {
    transform: translateX(-50%) scale(0.9);
  }
}
</style>
