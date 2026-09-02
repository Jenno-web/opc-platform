<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PublishFab from '@/components/PublishFab.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import { useUserStore } from '@/store/user'
import CountUp from '@/components/CountUp.vue'

const userStore = useUserStore()
const uploadingAvatar = ref(false)

onMounted(() => {
  userStore.loadCurrentUser()
})

// 选完的图片先压到一个很小的正方形尺寸再转 base64，不然随手拍的照片动辄几 MB，
// 直接存数据库字段既浪费又可能撞 body 大小上限。压缩在浏览器本地做，不需要后端处理
function resizeToDataUrl(src: string, maxSize = 240, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法处理图片'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

function changeAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const path = (res.tempFilePaths as string[])[0]
      uploadingAvatar.value = true
      try {
        const dataUrl = await resizeToDataUrl(path)
        await userStore.updateAvatar(dataUrl)
        uni.showToast({ title: '头像已更新', icon: 'success' })
      } catch {
        uni.showToast({ title: '头像更新失败，换一张试试', icon: 'none' })
      } finally {
        uploadingAvatar.value = false
      }
    },
  })
}
</script>

<template>
  <view class="profile">
    <template v-if="userStore.currentUser">
      <view class="profile__header">
        <view class="profile__avatar-wrap" hover-class="opc-hover" @click="changeAvatar">
          <Avatar
            :name="userStore.currentUser.nickname"
            :avatar-url="userStore.currentUser.avatarUrl"
            size="120rpx"
          />
          <view class="profile__avatar-edit" :class="{ 'is-busy': uploadingAvatar }">
            <Icon name="plus" size="20rpx" color="#ffffff" />
          </view>
        </view>
        <view class="profile__identity">
          <text class="profile__nickname">{{ userStore.currentUser.nickname }}</text>
          <text class="profile__role">{{ userStore.currentUser.professionalIdentity }}</text>
        </view>
      </view>

      <view class="profile__stats">
        <view class="profile__stat">
          <text class="profile__stat-num"><CountUp :value="userStore.currentUser.completeness" suffix="%" /></text>
          <text class="profile__stat-label">完整度</text>
        </view>
        <view class="profile__stat">
          <text class="profile__stat-num"><CountUp :value="userStore.currentUser.stats.collaborationCount" /></text>
          <text class="profile__stat-label">合作</text>
        </view>
        <view class="profile__stat">
          <text class="profile__stat-num"><CountUp :value="userStore.currentUser.stats.responseCount" /></text>
          <text class="profile__stat-label">响应</text>
        </view>
      </view>

      <!-- "我能提供"和"能力标签"是同一类资料信息，合并进一个卡片；之前是两个悬空小节 -->
      <view v-if="userStore.currentUser.bio || userStore.currentUser.skillTags.length" class="profile__content-card">
        <view v-if="userStore.currentUser.bio" class="profile__section">
          <view class="profile__section-title">我能提供</view>
          <text class="profile__bio">{{ userStore.currentUser.bio }}</text>
        </view>
        <view class="profile__section">
          <view class="profile__section-title">能力标签</view>
          <view class="profile__tags">
            <text v-for="tag in userStore.currentUser.skillTags" :key="tag.id" class="profile__tag">
              {{ tag.name }}
            </text>
          </view>
        </view>
      </view>

      <view v-if="userStore.currentUser.portfolio.length" class="profile__section profile__section--loose">
        <view class="profile__section-title">近期案例</view>
        <view
          v-for="(item, index) in userStore.currentUser.portfolio"
          :key="item.id"
          class="profile__case opc-fade-in"
          :style="{ '--opc-stagger': index }"
        >
          <text class="profile__case-title">{{ item.title }}</text>
          <text class="profile__case-desc">{{ item.description }}</text>
        </view>
      </view>

      <view class="profile__menu">
        <view
          class="profile__menu-item"
          hover-class="opc-hover"
          @click="uni.navigateTo({ url: '/pages/profile/applications' })"
        >
          <text>项目申请</text>
          <Icon name="chevron-right" size="28rpx" color="#9a9a9a" />
        </view>
        <view
          class="profile__menu-item"
          hover-class="opc-hover"
          @click="uni.navigateTo({ url: '/pages/profile/knowledge' })"
        >
          <text>知识库</text>
          <Icon name="chevron-right" size="28rpx" color="#9a9a9a" />
        </view>
        <view
          class="profile__menu-item"
          hover-class="opc-hover"
          @click="uni.navigateTo({ url: '/pages/login/index' })"
        >
          <text>切换账号（手机号登录）</text>
          <Icon name="chevron-right" size="28rpx" color="#9a9a9a" />
        </view>
      </view>
    </template>

    <view v-else-if="userStore.loading" class="profile__loading">
      <SkeletonBlock :rows="2" avatar />
      <SkeletonBlock :rows="3" />
    </view>

    <PublishFab />
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.profile {
  padding: $opc-spacing;
  padding-bottom: 160rpx;

  &__header {
    display: flex;
    align-items: center;
    gap: $opc-spacing-sm;
    margin-bottom: $opc-spacing-lg;
  }

  // 头像本体交给 Avatar.vue，这里只负责右下角那个可点击的"+"编辑徽标，跟 voice-room
  // 的 in-场徽标是同一个定位思路（相对定位容器 + 绝对定位小圆点）
  &__avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  &__avatar-edit {
    position: absolute;
    right: -4rpx;
    bottom: -4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: $opc-color-accent;
    border: 3rpx solid $opc-bg-page;
    display: flex;
    align-items: center;
    justify-content: center;

    &.is-busy {
      opacity: 0.5;
    }
  }

  &__nickname {
    font-size: $opc-font-lg;
    font-weight: 700;
    display: block;
  }

  &__role {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__stats {
    display: flex;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing 0;
    margin-bottom: $opc-spacing-lg;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
  }

  &__stat-num {
    font-size: $opc-font-lg;
    font-weight: 700;
    color: $opc-color-accent;
  }

  &__stat-label {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  // 资料相关的小节合并进的卡片，跟 project/detail.vue 是同一套模式：卡片 + 内部分隔线
  &__content-card {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: 0 $opc-spacing;
    margin-bottom: $opc-spacing-lg;
  }

  &__content-card &__section {
    margin-bottom: 0;
    padding: $opc-spacing-sm 0;

    &:not(:first-child) {
      border-top: 1px solid $opc-border-color;
    }
  }

  &__section {
    margin-bottom: $opc-spacing-lg;

    &--loose {
      margin-bottom: $opc-spacing-lg;
    }
  }

  &__section-title {
    position: relative;
    padding-left: $opc-spacing-xxs;
    font-size: $opc-font-base;
    font-weight: 700;
    margin-bottom: $opc-spacing-xs;

    &::before {
      content: '';
      position: absolute;
      left: -#{$opc-spacing-xxs};
      top: 4rpx;
      bottom: 4rpx;
      width: 6rpx;
      border-radius: $opc-radius-tag;
      background: $opc-color-accent;
    }
  }

  &__bio {
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-xxs;
  }

  &__tag {
    font-size: $opc-font-sm;
    color: $opc-color-text;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    padding: 8rpx $opc-spacing-sm;
    border-radius: $opc-radius-tag;
  }

  &__case {
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    box-shadow: $opc-shadow-sm;
    padding: $opc-spacing-xs $opc-spacing-sm;
    margin-bottom: $opc-spacing-xxs;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__case-title {
    font-size: $opc-font-base;
    font-weight: 600;
  }

  &__case-desc {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__menu {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    overflow: hidden;
  }

  &__menu-item {
    display: flex;
    justify-content: space-between;
    padding: $opc-spacing-lg $opc-spacing;
    font-size: $opc-font-base;
    border-bottom: 1px solid $opc-border-color;

    &:last-child {
      border-bottom: none;
    }
  }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-sm;
  }
}
</style>
