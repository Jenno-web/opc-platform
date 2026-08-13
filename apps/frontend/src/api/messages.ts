import { request } from '@/utils/request'
import type { ChannelItem, ChatMessageItem, ConversationItem, TodoItem } from '@/types'

export function fetchConversations() {
  return request<ConversationItem[]>({ url: '/conversations' })
}

export function fetchChannels() {
  return request<ChannelItem[]>({ url: '/conversations/channels' })
}

export function getOrCreatePrivateConversation(otherUserId: string) {
  return request<ConversationItem>({ url: `/conversations/private/${otherUserId}`, method: 'POST' })
}

export function joinVoiceRoom(conversationId: string) {
  return request<{ id: string; nickname: string; avatarUrl: string | null }[]>({
    url: `/conversations/${conversationId}/voice/join`,
    method: 'POST',
  })
}

export function leaveVoiceRoom(conversationId: string) {
  return request<{ id: string; nickname: string; avatarUrl: string | null }[]>({
    url: `/conversations/${conversationId}/voice/leave`,
    method: 'POST',
  })
}

export function fetchVoiceRoomParticipants(conversationId: string) {
  return request<{ id: string; nickname: string; avatarUrl: string | null }[]>({
    url: `/conversations/${conversationId}/voice/participants`,
  })
}

export function fetchConversationMessages(conversationId: string) {
  return request<ChatMessageItem[]>({ url: `/conversations/${conversationId}/messages` })
}

export function sendChatMessage(conversationId: string, content: string) {
  return request<ChatMessageItem>({
    url: `/conversations/${conversationId}/messages`,
    method: 'POST',
    data: { content },
  })
}

export function summarizeConversation(conversationId: string) {
  return request<{ summary: string }>({ url: `/ai/conversations/${conversationId}/summarize`, method: 'POST' })
}

export function suggestReply(conversationId: string) {
  return request<{ reply: string }>({ url: `/ai/conversations/${conversationId}/suggest-reply`, method: 'POST' })
}

export function extractTodosFromConversation(conversationId: string) {
  return request<TodoItem[]>({ url: `/ai/conversations/${conversationId}/extract-todos`, method: 'POST' })
}

export function fetchTodos() {
  return request<TodoItem[]>({ url: '/todos' })
}

export function confirmTodo(todoId: string, content?: string) {
  return request<TodoItem>({
    url: `/todos/${todoId}`,
    method: 'PATCH',
    data: { confirmedByUser: true, ...(content ? { content } : {}) },
  })
}
