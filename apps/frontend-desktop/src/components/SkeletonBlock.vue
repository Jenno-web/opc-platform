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
  <div class="skeleton">
    <div v-if="avatar" class="skeleton__avatar shimmer" />
    <div class="skeleton__lines">
      <div
        v-for="i in rows"
        :key="i"
        class="skeleton__line shimmer"
        :class="{ 'skeleton__line--short': i === rows }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.skeleton {
  display: flex;
  gap: $opc-spacing-sm;
  padding: $opc-spacing-sm;

  &__avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
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
    height: 12px;
    border-radius: $opc-radius-card-sm;

    &--short {
      width: 60%;
    }
  }
}

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
