<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    avatar?: boolean
  }>(),
  { rows: 3, avatar: false },
)
</script>

<template>
  <view class="skeleton">
    <view v-if="avatar" class="skeleton__avatar shimmer" />
    <view class="skeleton__lines">
      <view
        v-for="i in rows"
        :key="i"
        class="skeleton__line shimmer"
        :class="{ 'skeleton__line--short': i === rows }"
      />
    </view>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.skeleton {
  display: flex;
  gap: $opc-spacing-sm;
  padding: $opc-spacing-sm;

  &__avatar {
    flex-shrink: 0;
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
  }

  &__lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-xs;
    justify-content: center;
  }

  &__line {
    height: 24rpx;
    border-radius: $opc-radius-card-sm;

    &--short {
      width: 60%;
    }
  }
}

// 用背景位移做的 shimmer，不依赖任何外部资源
.shimmer {
  background: linear-gradient(90deg, $opc-bg-subtle 25%, $opc-border-color 37%, $opc-bg-subtle 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
