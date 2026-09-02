<script setup lang="ts">
import { onMounted } from 'vue'
import PublishFab from '@/components/PublishFab.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import { useUserStore } from '@/store/user'
import CountUp from '@/components/CountUp.vue'

const userStore = useUserStore()

onMounted(() => {
  userStore.loadCurrentUser()
})
</script>

<template>
  <view class="profile">
    <template v-if="userStore.currentUser">
      <view class="profile__header">
        <Avatar
          :name="userStore.currentUser.nickname"
          :avatar-url="userStore.currentUser.avatarUrl"
          size="120rpx"
        />
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
