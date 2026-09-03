<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchChannels, fetchConversations } from '@/api/messages'
import type { ChannelItem, ConversationItem } from '@/types'
import ConversationList from '@/components/messages/ConversationList.vue'
import ChatPane from '@/components/messages/ChatPane.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const conversations = ref<ConversationItem[]>([])
const channels = ref<ChannelItem[]>([])
const loading = ref(true)

const activeId = computed(() => (route.query.id as string) || null)

async function load() {
  loading.value = true
  try {
    const [c, ch] = await Promise.all([fetchConversations(), fetchChannels()])
    conversations.value = c
    channels.value = ch
    if (!activeId.value && c.length) {
      router.replace({ query: { id: c[0].id } })
    }
  } finally {
    loading.value = false
  }
}

function selectConversation(id: string) {
  router.push({ query: { id } })
}

function handleSent() {
  load()
}

onMounted(load)
watch(() => route.query.id, () => {
  // 未读数在真实进入某个会话后应该清零，重新拉一次列表反映最新状态
  fetchConversations().then((c) => (conversations.value = c))
})
</script>

<template>
  <div class="messages-layout">
    <div class="messages-sidebar">
      <ConversationList
        :conversations="conversations"
        :channels="channels"
        :active-id="activeId"
        @select="selectConversation"
      />
    </div>
    <div class="messages-main">
      <ChatPane v-if="activeId" :conversation-id="activeId" @sent="handleSent" />
      <EmptyState v-else-if="!loading" text="选择一个会话开始聊天" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

// 应用内页现在是左侧侧边栏布局，没有横向顶部导航条占垂直空间了，
// 这里直接吃满 100vh
.messages-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  height: 100vh;
}

.messages-sidebar {
  border-right: 1px solid $opc-border-color;
  min-width: 0;
  overflow: hidden;
}

.messages-main {
  min-width: 0;
  display: flex;
}
</style>
