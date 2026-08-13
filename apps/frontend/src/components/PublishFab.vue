<script setup lang="ts">
// 对应 Figma 底部 Tab 组件里的悬浮"发布"按钮：不是常驻 Tab，是一个独立的入口，
// 点击后进入发布向导（pages/publish/index.vue）
function goPublish() {
  uni.navigateTo({ url: '/pages/publish/index' })
}
</script>

<template>
  <view class="publish-fab" @click="goPublish">
    <text class="publish-fab__icon">+</text>
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
  box-shadow: 0 8rpx 24rpx rgba(17, 17, 17, 0.25);
  z-index: 999;

  &__icon {
    color: #ffffff;
    font-size: 56rpx;
    line-height: 56rpx;
    font-weight: 300;
  }
}
</style>
