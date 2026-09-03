<script setup lang="ts">
import TopNav from '@/components/layout/TopNav.vue'
import Toast from '@/components/Toast.vue'
</script>

<template>
  <TopNav />
  <main class="app-main">
    <RouterView />
  </main>
  <Toast />
</template>

<style scoped>
.app-main {
  min-height: calc(100vh - 64px);
}
</style>
