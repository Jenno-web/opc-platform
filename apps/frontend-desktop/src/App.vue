<script setup lang="ts">
import { useRoute } from 'vue-router'
import TopNav from '@/components/layout/TopNav.vue'
import Toast from '@/components/Toast.vue'

// landing 首页是给未进入应用的访客看的独立公开页，有自己的极简导航和页脚，
// 不套应用内页统一的 TopNav（头像/未读徽标/发布按钮在公开页语境下没有意义）
const route = useRoute()
</script>

<template>
  <TopNav v-if="!route.meta.blank" />
  <main class="app-main" :class="{ 'app-main--blank': route.meta.blank }">
    <RouterView />
  </main>
  <Toast />
</template>

<style scoped>
.app-main {
  min-height: calc(100vh - 64px);
}

.app-main--blank {
  min-height: 100vh;
}
</style>
