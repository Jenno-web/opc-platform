<script setup lang="ts">
import { onMounted } from 'vue'
import PublishFab from '@/components/PublishFab.vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.loadCurrentUser()
})
</script>

<template>
  <view class="profile">
    <template v-if="userStore.currentUser">
      <view class="profile__header">
        <image
          v-if="userStore.currentUser.avatarUrl"
          class="profile__avatar"
          :src="userStore.currentUser.avatarUrl"
        />
        <view v-else class="profile__avatar profile__avatar--fallback">
          {{ userStore.currentUser.nickname.slice(0, 1) }}
        </view>
        <view class="profile__identity">
          <text class="profile__nickname">{{ userStore.currentUser.nickname }}</text>
          <text class="profile__role">{{ userStore.currentUser.professionalIdentity }}</text>
        </view>
      </view>

      <view class="profile__stats">
        <view class="profile__stat">
          <text class="profile__stat-num">{{ userStore.currentUser.completeness }}</text>
          <text class="profile__stat-label">完整度</text>
        </view>
        <view class="profile__stat">
          <text class="profile__stat-num">{{ userStore.currentUser.stats.collaborationCount }}</text>
          <text class="profile__stat-label">合作</text>
        </view>
        <view class="profile__stat">
          <text class="profile__stat-num">{{ userStore.currentUser.stats.responseCount }}</text>
          <text class="profile__stat-label">响应</text>
        </view>
      </view>

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

      <view v-if="userStore.currentUser.portfolio.length" class="profile__section">
        <view class="profile__section-title">近期案例</view>
        <view v-for="item in userStore.currentUser.portfolio" :key="item.id" class="profile__case">
          <text class="profile__case-title">{{ item.title }}</text>
          <text class="profile__case-desc">{{ item.description }}</text>
        </view>
      </view>

      <view class="profile__menu">
        <view class="profile__menu-item" @click="uni.navigateTo({ url: '/pages/profile/applications' })">
          <text>项目申请</text>
          <text class="profile__menu-arrow">›</text>
        </view>
        <view class="profile__menu-item" @click="uni.navigateTo({ url: '/pages/profile/knowledge' })">
          <text>知识库</text>
          <text class="profile__menu-arrow">›</text>
        </view>
        <view class="profile__menu-item" @click="uni.navigateTo({ url: '/pages/login/index' })">
          <text>切换账号（手机号登录）</text>
          <text class="profile__menu-arrow">›</text>
        </view>
      </view>
    </template>

    <view v-else-if="userStore.loading" class="profile__loading">加载中...</view>

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
    gap: 24rpx;
    margin-bottom: 32rpx;
  }

  &__avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;

    &--fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 44rpx;
      color: $opc-color-text;
      font-weight: 700;
    }
  }

  &__nickname {
    font-size: 32rpx;
    font-weight: 700;
    display: block;
  }

  &__role {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
  }

  &__stats {
    display: flex;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    padding: $opc-spacing 0;
    margin-bottom: 32rpx;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
  }

  &__stat-num {
    font-size: 32rpx;
    font-weight: 700;
    color: $opc-color-text;
  }

  &__stat-label {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
  }

  &__section {
    margin-bottom: 32rpx;
  }

  &__section-title {
    font-size: 26rpx;
    font-weight: 700;
    margin-bottom: 16rpx;
  }

  &__bio {
    font-size: 24rpx;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  &__tag {
    font-size: 22rpx;
    color: $opc-color-text;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    padding: 8rpx 20rpx;
    border-radius: $opc-radius-tag;
  }

  &__case {
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: 16rpx;
    padding: 18rpx 20rpx;
    margin-bottom: 12rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__case-title {
    font-size: 24rpx;
    font-weight: 600;
  }

  &__case-desc {
    font-size: 20rpx;
    color: $opc-color-text-secondary;
  }

  &__menu {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    overflow: hidden;
  }

  &__menu-item {
    display: flex;
    justify-content: space-between;
    padding: 28rpx $opc-spacing;
    font-size: 26rpx;
    border-bottom: 1px solid $opc-border-color;

    &:last-child {
      border-bottom: none;
    }
  }

  &__menu-arrow {
    color: $opc-color-text-placeholder;
  }

  &__loading {
    text-align: center;
    color: $opc-color-text-secondary;
    padding: 80rpx 0;
  }
}
</style>
