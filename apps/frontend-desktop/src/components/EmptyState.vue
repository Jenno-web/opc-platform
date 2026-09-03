<script setup lang="ts">
import Icon from '@/components/Icon.vue'

withDefaults(
  defineProps<{
    text: string
    hint?: string
  }>(),
  {},
)
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <Icon name="inbox" size="22px" color="#9a9a9a" />
    </div>
    <span class="empty-state__text">{{ text }}</span>
    <span v-if="hint" class="empty-state__hint">{{ hint }}</span>
    <slot />
  </div>
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
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $opc-bg-subtle;
    display: flex;
    align-items: center;
    justify-content: center;
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
