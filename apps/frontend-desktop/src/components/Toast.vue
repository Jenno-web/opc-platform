<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <div class="opc-toast-host">
    <transition-group name="opc-toast">
      <div v-for="t in toasts" :key="t.id" class="opc-toast">{{ t.message }}</div>
    </transition-group>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.opc-toast-host {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.opc-toast {
  background: rgba(17, 17, 17, 0.88);
  color: #fff;
  font-size: $opc-font-sm;
  padding: 10px 18px;
  border-radius: $opc-radius-tag;
  box-shadow: $opc-shadow-md;
}

.opc-toast-enter-active,
.opc-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.opc-toast-enter-from,
.opc-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
