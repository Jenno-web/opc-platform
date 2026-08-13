<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchChannels } from '@/api/messages'
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

    <view v-for="[category, items] in grouped" :key="category" class="channels__group">
      <text class="channels__group-title">{{ category }}</text>
      <view v-for="c in items" :key="c.id" class="channels__item" @click="openChannel(c)">
        <text class="channels__item-icon">{{ c.isVoiceRoom ? '🎙' : '#' }}</text>
        <text class="channels__item-title">{{ c.title }}</text>
        <text v-if="c.unreadCount" class="channels__item-badge">{{ c.unreadCount }}</text>
      </view>
    </view>

    <view v-if="!loading && grouped.length === 0" class="channels__empty">没有找到相关频道</view>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.channels {
  padding: $opc-spacing;

  &__header {
    margin-bottom: 20rpx;
  }

  &__name {
    font-size: 32rpx;
    font-weight: 700;
    display: block;
  }

  &__meta {
    font-size: 20rpx;
    color: $opc-color-text-secondary;
  }

  &__search {
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-tag;
    padding: 14rpx 24rpx;
    font-size: 24rpx;
    margin-bottom: 28rpx;
  }

  &__section-title {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
    margin-bottom: 12rpx;
    display: block;
  }

  &__group {
    margin-bottom: 24rpx;
  }

  &__group-title {
    font-size: 20rpx;
    color: $opc-color-text-placeholder;
    text-transform: uppercase;
    margin-bottom: 8rpx;
    display: block;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 18rpx 12rpx;
    border-bottom: 1px solid $opc-border-color;
  }

  &__item-icon {
    width: 40rpx;
    text-align: center;
    color: $opc-color-text-secondary;
    font-size: 24rpx;
  }

  &__item-title {
    flex: 1;
    font-size: 26rpx;
  }

  &__item-badge {
    background: $opc-color-primary;
    color: #fff;
    font-size: 18rpx;
    min-width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    text-align: center;
    border-radius: 50%;
  }

  &__empty {
    text-align: center;
    color: $opc-color-text-secondary;
    font-size: 24rpx;
    padding: 60rpx 0;
  }
}
</style>
