<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { fetchConversations } from '@/api/messages'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'

// 参照 launchmesh.cn/platform/community 的产品内页结构：左侧常驻侧边栏（深色，
// 跟首页 landing 同一套暗色语言，在浅色应用内页里当一块"控制台面板"），按
// 发现/项目/协作分组——不是照搬参考站"社区/项目/协作"的字面命名，是按我们
// 自己真实的模块映射过去的：发现=浏览、项目=发布+我的任务、协作=消息。
// "我的"没有单独占一个导航项，跟参考站一样收进底部账户区（点头像展开）。
const router = useRouter()
const userStore = useUserStore()
const unreadCount = ref(0)
const menuOpen = ref(false)

async function loadUnread() {
  try {
    const conversations = await fetchConversations()
    unreadCount.value = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
  } catch {
    // 未读数加载失败不阻塞导航渲染，静默失败即可
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
  router.push('/profile/settings')
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
  <aside class="side-nav">
    <RouterLink to="/discover" class="side-nav__logo">
      <span class="side-nav__logo-mark">培</span>
      <span>培风社 OPC</span>
    </RouterLink>

    <nav class="side-nav__groups">
      <div class="side-nav__group">
        <div class="side-nav__group-label">发现</div>
        <RouterLink to="/discover" class="side-nav__link" active-class="is-active">
          <Icon name="compass" size="18px" />
          <span>发现</span>
        </RouterLink>
      </div>

      <div class="side-nav__group">
        <div class="side-nav__group-label">项目</div>
        <RouterLink to="/publish" class="side-nav__link side-nav__link--accent" active-class="is-active">
          <Icon name="plus" size="18px" />
          <span>发布项目</span>
        </RouterLink>
        <RouterLink to="/tasks" class="side-nav__link" active-class="is-active">
          <Icon name="list-checks" size="18px" />
          <span>我的任务</span>
        </RouterLink>
      </div>

      <div class="side-nav__group">
        <div class="side-nav__group-label">协作</div>
        <RouterLink to="/messages" class="side-nav__link" active-class="is-active">
          <Icon name="message-circle" size="18px" />
          <span>消息</span>
          <span v-if="unreadCount" class="side-nav__badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </RouterLink>
      </div>
    </nav>

    <div class="side-nav__account" @click.stop="toggleMenu">
      <Avatar
        v-if="userStore.currentUser"
        :name="userStore.currentUser.nickname"
        :avatar-url="userStore.currentUser.avatarUrl"
        size="32px"
      />
      <div v-if="userStore.currentUser" class="side-nav__account-info">
        <span class="side-nav__nickname">{{ userStore.currentUser.nickname }}</span>
        <span class="side-nav__role">{{ userStore.currentUser.professionalIdentity }}</span>
      </div>
      <Icon name="chevron-down" size="14px" />

      <div v-if="menuOpen" class="side-nav__dropdown" @click.stop>
        <RouterLink to="/profile" class="side-nav__dropdown-item" @click="closeMenu">
          <Icon name="user-round" size="16px" />
          <span>我的主页</span>
        </RouterLink>
        <div class="side-nav__dropdown-item" @click="goSettings">
          <Icon name="pencil" size="16px" />
          <span>设置</span>
        </div>
        <div class="side-nav__dropdown-item is-danger" @click="logout">
          <Icon name="log-out" size="16px" />
          <span>退出登录</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// 侧边栏是应用内页里的一块"深色控制台面板"，颜色对照首页 landing 的暗色语言单独
// 复写一份（跟 LandingPage.vue 同一个理由：应用内页本身已经是白色主题，侧边栏
// 想要参考站那种深色常驻导航的视觉重量，不能直接吃 tokens.scss 现在的白色 token）
$opc-color-accent: #6d5ef5;
$opc-color-accent-bright: #7c6cff;
$opc-color-text: #f2f2f7;
$opc-color-text-secondary: #9a9aad;
$opc-bg-card: #14141c;
$opc-bg-subtle: #1c1c28;
$opc-border-color: #2a2a3a;
$opc-gradient-primary: linear-gradient(135deg, #4f6ef7 0%, #9333ea 100%);

.side-nav {
  position: sticky;
  top: 0;
  align-self: flex-start;
  flex-shrink: 0;
  width: 232px;
  height: 100vh;
  background: $opc-bg-card;
  border-right: 1px solid $opc-border-color;
  display: flex;
  flex-direction: column;
  padding: $opc-spacing-md $opc-spacing-sm;
  box-sizing: border-box;

  &__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 $opc-spacing-xs;
    margin-bottom: $opc-spacing-lg;
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-text;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__logo-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: $opc-gradient-primary;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__groups {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-md;
  }

  &__group-label {
    padding: 0 $opc-spacing-xs;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $opc-color-text-secondary;
  }

  &__link {
    position: relative;
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    padding: 9px $opc-spacing-xs;
    margin-bottom: 2px;
    border-radius: $opc-radius-card-sm;
    font-size: $opc-font-sm;
    font-weight: 500;
    color: $opc-color-text-secondary;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: $opc-bg-subtle;
      color: $opc-color-text;
    }

    &.is-active {
      background: rgba($opc-color-accent, 0.16);
      color: $opc-color-accent-bright;
      font-weight: 700;
    }

    &--accent {
      color: #fff;
      background: $opc-gradient-primary;

      &:hover {
        filter: brightness(1.08);
      }

      &.is-active {
        background: $opc-gradient-primary;
        color: #fff;
      }
    }
  }

  &__badge {
    margin-left: auto;
    flex-shrink: 0;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: $opc-radius-tag;
    background: $opc-color-danger;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__account {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: $opc-spacing-xs;
    margin-top: $opc-spacing-sm;
    border-radius: $opc-radius-card-sm;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: $opc-bg-subtle;
    }
  }

  &__account-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__nickname {
    font-size: $opc-font-sm;
    font-weight: 600;
    color: $opc-color-text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__role {
    font-size: 11px;
    color: $opc-color-text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dropdown {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 6px);
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
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
      background: rgba(255, 255, 255, 0.06);
    }

    &.is-danger {
      color: $opc-color-danger;
    }
  }
}
</style>
