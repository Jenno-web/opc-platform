<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchChannels } from '@/api/messages'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'
import type { ChannelItem } from '@/types'

// 对应"11 消息&服务器频道浏览"画板。全平台目前只有"培风社官方"一个社区，
// 顶部"私/官/会/战"那几个服务器切换图标在 Figma 里也只有一个有真实内容，这里不做多服务器数据模型（见 README 边界声明）。
const channels = ref<ChannelItem[]>([])
const keyword = ref('')
const loading = ref(true)

const filtered = computed(() =>
  keyword.value.trim()
    ? channels.value.filter((c) => c.title.toLowerCase().includes(keyword.value.trim().toLowerCase()))
    : channels.value,
)

const grouped = computed(() => {
  const groups = new Map<string, ChannelItem[]>()
  for (const c of filtered.value) {
    const key = c.category ?? '其他'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }
  return Array.from(groups.entries())
})

function openChannel(channel: ChannelItem) {
  if (channel.isVoiceRoom) {
    uni.navigateTo({ url: `/pages/message/voice-room?id=${channel.id}&title=${encodeURIComponent(channel.title)}` })
  } else {
    uni.navigateTo({ url: `/pages/message/chat?id=${channel.id}&title=${encodeURIComponent(channel.title)}` })
  }
}

onMounted(async () => {
  loading.value = true
  try {
    channels.value = await fetchChannels()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <view class="channels">
    <view class="channels__header">
      <text class="channels__name">培风社官方</text>
      <text class="channels__meta">2,406 位成员 · 社区</text>
    </view>

    <input v-model="keyword" class="channels__search" placeholder="搜索频道、成员、文件" />

    <text class="channels__section-title">浏览频道</text>

    <template v-if="loading">
      <SkeletonBlock v-for="i in 4" :key="i" :rows="1" />
    </template>
    <template v-else>
      <view v-for="[category, items] in grouped" :key="category" class="channels__group">
        <text class="channels__group-title">{{ category }}</text>
        <view
          v-for="(c, index) in items"
          :key="c.id"
          class="channels__item opc-fade-in"
          :style="{ '--opc-stagger': Math.min(index, 6) }"
          hover-class="opc-hover"
          @click="openChannel(c)"
        >
          <view class="channels__item-icon">
            <Icon :name="c.isVoiceRoom ? 'mic' : 'hash'" size="24rpx" color="#3B4BC4" />
          </view>
          <text class="channels__item-title">{{ c.title }}</text>
          <text v-if="c.unreadCount" class="channels__item-badge">{{ c.unreadCount }}</text>
        </view>
      </view>

      <EmptyState v-if="grouped.length === 0" text="没有找到相关频道" />
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.channels {
  padding: $opc-spacing;

  &__header {
    margin-bottom: $opc-spacing-sm;
  }

  &__name {
    font-size: $opc-font-lg;
    font-weight: 700;
    display: block;
  }

  &__meta {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__search {
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: $opc-spacing-xs $opc-spacing-sm;
    font-size: $opc-font-base;
    margin-bottom: $opc-spacing-lg;
  }

  &__section-title {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    margin-bottom: $opc-spacing-xxs;
    display: block;
  }

  &__group {
    margin-bottom: $opc-spacing-sm;
  }

  &__group-title {
    font-size: $opc-font-xs;
    color: $opc-color-text-placeholder;
    text-transform: uppercase;
    margin-bottom: 8rpx;
    display: block;
  }

  // hover-class 在长列表里手指按住时只要有一点移动就会被 uni-app 自己的 JS 判定成
  // "在滚动"而取消反馈，这里叠一层浏览器原生 :active 做保底
  &__item {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-xs $opc-spacing-xxs;
    border-bottom: 1px solid $opc-border-color;

    &:active {
      opacity: 0.6;
    }
  }

  &__item-icon {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: $opc-color-primary-soft;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__item-title {
    flex: 1;
    font-size: $opc-font-base;
  }

  &__item-badge {
    background: $opc-color-primary;
    color: #fff;
    font-size: $opc-font-micro;
    min-width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    text-align: center;
    border-radius: 50%;
  }
}
</style>
