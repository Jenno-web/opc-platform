<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchVoiceRoomParticipants, joinVoiceRoom, leaveVoiceRoom } from '@/api/messages'
import { getSocket } from '@/utils/socket'
import { useUserStore } from '@/store/user'
import EmptyState from '@/components/EmptyState.vue'
import Avatar from '@/components/Avatar.vue'

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
      <view
        v-for="(p, index) in participants"
        :key="p.id"
        class="voice-room__member opc-fade-in"
        :style="{ '--opc-stagger': Math.min(index, 6) }"
      >
        <view class="voice-room__avatar-ring">
          <Avatar :name="p.nickname" :avatar-url="p.avatarUrl" size="88rpx" />
          <view class="voice-room__live-dot opc-pulse" />
        </view>
        <text class="voice-room__name">{{ p.nickname }}</text>
      </view>
      <EmptyState v-if="!loading && participants.length === 0" text="还没有人在这里" />
    </view>

    <button
      class="voice-room__join-btn"
      hover-class="opc-hover"
      :class="{ 'is-joined': joined }"
      @click="toggleJoin"
    >
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
  gap: $opc-spacing-sm;

  &__notice {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card-sm;
    padding: $opc-spacing-xs;
  }

  &__title {
    font-size: $opc-font-lg;
    font-weight: 700;
    display: block;
  }

  &__subtitle {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-sm;
    padding: $opc-spacing-sm 0;
  }

  &__member {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    width: 120rpx;
  }

  // 头像本体交给 Avatar.vue 统一处理，这里只负责外面这圈"在场"绿色描边 + 徽标定位
  &__avatar-ring {
    position: relative;
    border-radius: 50%;
    border: 2px solid $opc-color-success;
    padding: 3rpx;
  }

  // 在场提示：房间是实时状态展示，不是真实语音通话，靠这个绿点强调"人在线"而不是"正在说话"
  &__live-dot {
    position: absolute;
    right: -2rpx;
    bottom: -2rpx;
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    background: $opc-color-success;
    border: 3rpx solid $opc-bg-page;
  }

  &__name {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    text-align: center;
  }

  &__join-btn {
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-base;
    margin-top: auto;

    &.is-joined {
      background: $opc-bg-card;
      border: 1px solid $opc-color-danger;
      color: $opc-color-danger;
    }
  }
}
</style>
