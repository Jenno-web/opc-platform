<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchVoiceRoomParticipants, joinVoiceRoom, leaveVoiceRoom } from '@/api/messages'
import { getSocket } from '@/utils/socket'
import { useUserStore } from '@/store/user'

// 对应"14 消息&休息室语音房"画板。
// 重要边界：这里只做"谁在场"的实时状态广播（复用已有 WebSocket 网关），不做真实语音通话——
// 真实语音需要 WebRTC/媒体服务器（如 Agora、LiveKit）这类专门的实时音视频基础设施，这个环境搭不了，详见 README。
interface RoomUser {
  id: string
  nickname: string
  avatarUrl: string | null
}

const userStore = useUserStore()
const roomId = ref('')
const participants = ref<RoomUser[]>([])
const joined = ref(false)
const loading = ref(true)

function handleParticipantsUpdate(list: RoomUser[]) {
  participants.value = list
  joined.value = list.some((p) => p.id === userStore.currentUser?.id)
}

async function loadParticipants() {
  participants.value = await fetchVoiceRoomParticipants(roomId.value)
  joined.value = participants.value.some((p) => p.id === userStore.currentUser?.id)
}

async function toggleJoin() {
  if (joined.value) {
    participants.value = await leaveVoiceRoom(roomId.value)
  } else {
    participants.value = await joinVoiceRoom(roomId.value)
  }
  joined.value = !joined.value
}

onLoad((query) => {
  roomId.value = (query?.id as string) ?? ''
  if (query?.title) uni.setNavigationBarTitle({ title: decodeURIComponent(query.title as string) })
})

onMounted(async () => {
  if (!userStore.currentUser) await userStore.loadCurrentUser()
  loading.value = true
  try {
    await loadParticipants()
  } finally {
    loading.value = false
  }

  const socket = getSocket()
  socket?.emit('joinConversation', roomId.value)
  socket?.on('voice:participants', handleParticipantsUpdate)
})

onUnmounted(() => {
  const socket = getSocket()
  socket?.emit('leaveConversation', roomId.value)
  socket?.off('voice:participants', handleParticipantsUpdate)
})
</script>

<template>
  <view class="voice-room">
    <view class="voice-room__notice">
      仅展示实时在场状态，不提供真实语音通话（需要额外的音视频基础设施）
    </view>

    <text class="voice-room__title">休息室</text>
    <text class="voice-room__subtitle">让小组知道你来了</text>

    <view class="voice-room__grid">
      <view v-for="p in participants" :key="p.id" class="voice-room__member">
        <view class="voice-room__avatar">{{ p.nickname.slice(0, 1) }}</view>
        <text class="voice-room__name">{{ p.nickname }}</text>
      </view>
      <view v-if="!loading && participants.length === 0" class="voice-room__empty">还没有人在这里</view>
    </view>

    <button class="voice-room__join-btn" :class="{ 'is-joined': joined }" @click="toggleJoin">
      {{ joined ? '离开语音' : '添加成员到语音聊天' }}
    </button>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.voice-room {
  padding: $opc-spacing;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  &__notice {
    font-size: 20rpx;
    color: $opc-color-text-secondary;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: 12rpx;
    padding: 14rpx 18rpx;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 700;
    display: block;
  }

  &__subtitle {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
    padding: 24rpx 0;
  }

  &__member {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    width: 120rpx;
  }

  &__avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    background: $opc-bg-subtle;
    border: 2px solid $opc-color-success;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  &__name {
    font-size: 20rpx;
    color: $opc-color-text-secondary;
    text-align: center;
  }

  &__empty {
    font-size: 24rpx;
    color: $opc-color-text-secondary;
  }

  &__join-btn {
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: 28rpx;
    margin-top: auto;

    &.is-joined {
      background: $opc-bg-card;
      border: 1px solid $opc-color-danger;
      color: $opc-color-danger;
    }
  }
}
</style>
