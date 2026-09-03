<script setup lang="ts">
import { useRoute } from 'vue-router'
import SideNav from '@/components/layout/SideNav.vue'
import Toast from '@/components/Toast.vue'

// landing 首页是给未进入应用的访客看的独立公开页，有自己的极简顶部导航和页脚，
// 不套应用内页的左侧侧边栏；应用内页（发现/任务/发布/信息/我的）参照
// launchmesh.cn/platform/community 的产品内页结构，换成左侧常驻侧边栏
const route = useRoute()
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--blank': route.meta.blank }">
    <SideNav v-if="!route.meta.blank" />
    <main class="app-shell__content">
      <RouterView />
    </main>
  </div>
  <Toast />
</template>

<style scoped>
.app-shell {
  display: flex;
  align-items: stretch;
  min-height: 100vh;
}

.app-shell--blank {
  display: block;
}

.app-shell__content {
  flex: 1;
  min-width: 0;
}
</style>
