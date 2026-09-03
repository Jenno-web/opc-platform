<template>
  <div class="page-container">
    <slot />
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.page-container {
  max-width: $opc-content-max-width;
  margin: 0 auto;
  padding: $opc-spacing-lg $opc-spacing-xl;
}
</style>
