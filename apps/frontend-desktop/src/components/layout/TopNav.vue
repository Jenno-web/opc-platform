<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { fetchConversations } from '@/api/messages'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'

// 替代移动端底部 tabBar 的顶部常驻导航。手机端 pages.json 的 tabBar 实际只有
// 发现/任务/信息/我的 4 个，"发布"是悬浮按钮 PublishFab.vue 不是平权的 tab——
// 这里延续同一个产品判断，"发布"做成强调色高亮按钮而不是第五个导航链接，
// "我的"通过头像下拉进入，不占用主导航位置
const router = useRouter()
const userStore = useUserStore()
const unreadCount = ref(0)
const menuOpen = ref(false)

async function loadUnread() {
  try {
    const conversations = await fetchConversations()
    unreadCount.value = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
  } catch {
    // 未读数加载失败不阻塞导航栏渲染，静默失败即可
  }
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function goSettings() {
  closeMenu()
  router.push('/profile')
}

function logout() {
  closeMenu()
  localStorage.removeItem('opc_token')
  window.location.reload()
}

onMounted(() => {
  userStore.loadCurrentUser()
  loadUnread()
  window.addEventListener('click', closeMenu)
})
onUnmounted(() => {
  window.removeEventListener('click', closeMenu)
})
</script>

<template>
  <header class="top-nav">
    <div class="top-nav__inner">
      <RouterLink to="/discover" class="top-nav__logo">培风社 OPC</RouterLink>

      <nav class="top-nav__links">
        <RouterLink to="/discover" class="top-nav__link" active-class="is-active">发现</RouterLink>
        <RouterLink to="/tasks" class="top-nav__link" active-class="is-active">任务</RouterLink>
        <RouterLink to="/messages" class="top-nav__link" active-class="is-active">
          信息
          <span v-if="unreadCount" class="top-nav__link-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </RouterLink>
      </nav>

      <div class="top-nav__actions">
        <RouterLink to="/publish" class="top-nav__publish-btn">
          <Icon name="plus" size="16px" />
          <span>发布</span>
        </RouterLink>

        <div class="top-nav__account" @click.stop="toggleMenu">
          <Avatar
            v-if="userStore.currentUser"
            :name="userStore.currentUser.nickname"
            :avatar-url="userStore.currentUser.avatarUrl"
            size="32px"
          />
          <span v-if="userStore.currentUser" class="top-nav__nickname">{{ userStore.currentUser.nickname }}</span>
          <Icon name="chevron-down" size="14px" color="#9a9a9a" />

          <div v-if="menuOpen" class="top-nav__dropdown" @click.stop>
            <RouterLink to="/profile" class="top-nav__dropdown-item" @click="closeMenu">
              <Icon name="user-round" size="16px" />
              <span>我的主页</span>
            </RouterLink>
            <div class="top-nav__dropdown-item" @click="goSettings">
              <Icon name="pencil" size="16px" />
              <span>设置</span>
            </div>
            <div class="top-nav__dropdown-item is-danger" @click="logout">
              <Icon name="log-out" size="16px" />
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: $opc-nav-height;
  background: $opc-bg-card;
  border-bottom: 1px solid $opc-border-color;

  &__inner {
    max-width: $opc-content-max-width;
    height: 100%;
    margin: 0 auto;
    padding: 0 $opc-spacing-xl;
    display: flex;
    align-items: center;
    gap: $opc-spacing-xl;
  }

  &__logo {
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-accent;
    white-space: nowrap;
  }

  &__links {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $opc-spacing-lg;
  }

  &__link {
    position: relative;
    font-size: $opc-font-base;
    font-weight: 500;
    color: $opc-color-text-secondary;
    padding: 8px 0;
    transition: color 0.15s ease;

    &:hover {
      color: $opc-color-text;
    }

    &.is-active {
      color: $opc-color-accent;
      font-weight: 700;
    }
  }

  &__link-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    margin-left: 4px;
    border-radius: $opc-radius-tag;
    background: $opc-color-danger;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    vertical-align: top;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $opc-spacing-md;
  }

  &__publish-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: $opc-color-accent;
    color: #fff;
    font-size: $opc-font-sm;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: $opc-radius-tag;
    transition: background 0.15s ease, transform 0.15s ease;

    &:hover {
      background: $opc-color-accent-dark;
    }
    &:active {
      transform: scale(0.96);
    }
  }

  &__account {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: $opc-radius-card-sm;
    cursor: pointer;

    &:hover {
      background: $opc-bg-subtle;
    }
  }

  &__nickname {
    font-size: $opc-font-sm;
    font-weight: 600;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 160px;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    box-shadow: $opc-shadow-lg;
    padding: 6px;
    z-index: 200;
  }

  &__dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: $opc-font-sm;
    color: $opc-color-text;

    &:hover {
      background: $opc-bg-subtle;
    }

    &.is-danger {
      color: $opc-color-danger;
    }
  }
}
</style>
