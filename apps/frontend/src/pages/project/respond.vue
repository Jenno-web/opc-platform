<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchProjectDetail } from '@/api/projects'
import { createApplication } from '@/api/applications'
import { getOrCreatePrivateConversation, sendChatMessage } from '@/api/messages'
import type { ProjectDetail } from '@/types'

// 对应"04 响应/联系"画板：快速响应模板 + 自定义文本
const RESPOND_TEMPLATES = ['我能接这个需求', '我有档期，想约 15 分钟聊', '我需要先确认几个问题']
const QUESTION_TEMPLATES = ['预算是否可以调整？', '交付周期能否延长？', '是否需要长期维护？']

const mode = ref<'question' | 'respond'>('respond')
const projectId = ref('')
const publisherId = ref('')
const project = ref<ProjectDetail | null>(null)
const draft = ref('')
const submitting = ref(false)

const templates = computed(() => (mode.value === 'question' ? QUESTION_TEMPLATES : RESPOND_TEMPLATES))
const title = computed(() => (mode.value === 'question' ? '快速提问' : '快速响应'))

function applyTemplate(text: string) {
  draft.value = draft.value ? `${draft.value}\n${text}` : text
}

onLoad(async (query) => {
  projectId.value = (query?.projectId as string) ?? ''
  publisherId.value = (query?.publisherId as string) ?? ''
  mode.value = (query?.mode as 'question' | 'respond') ?? 'respond'
  if (projectId.value) project.value = await fetchProjectDetail(projectId.value)
})

async function handleSubmit() {
  if (!draft.value.trim()) {
    uni.showToast({ title: '请先输入内容', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    if (mode.value === 'respond') {
      await createApplication({ projectId: projectId.value, content: draft.value.trim() })
      uni.showToast({ title: '响应已发送', icon: 'success' })
    } else {
      const conversation = await getOrCreatePrivateConversation(publisherId.value)
      await sendChatMessage(conversation.id, draft.value.trim())
      uni.showToast({ title: '已发送', icon: 'success' })
    }
    setTimeout(() => uni.navigateBack(), 600)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="respond">
    <view class="respond__header">
      <text class="respond__title">{{ title }}</text>
      <text v-if="project" class="respond__project">给{{ project.publisher.nickname }} · {{ project.title }}</text>
    </view>

    <view class="respond__templates">
      <text v-for="t in templates" :key="t" class="respond__template" @click="applyTemplate(t)">{{ t }}</text>
    </view>

    <view class="respond__field">
      <text class="respond__field-label">你的补充</text>
      <textarea v-model="draft" class="respond__textarea" placeholder="可以直接点上面的快捷语，也可以自己写" />
    </view>

    <button class="respond__submit-btn" :loading="submitting" @click="handleSubmit">
      {{ mode === 'respond' ? '发送响应' : '发送提问' }}
    </button>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.respond {
  padding: $opc-spacing;
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  &__title {
    font-size: 32rpx;
    font-weight: 700;
    display: block;
  }

  &__project {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
    margin-top: 6rpx;
    display: block;
  }

  &__templates {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &__template {
    font-size: 24rpx;
    padding: 18rpx 20rpx;
    background: $opc-bg-subtle;
    border: 1px solid $opc-border-color;
    border-radius: 16rpx;
  }

  &__field-label {
    font-size: 22rpx;
    color: $opc-color-text-secondary;
    margin-bottom: 10rpx;
    display: block;
  }

  &__textarea {
    width: 100%;
    min-height: 200rpx;
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: 16rpx;
    padding: 16rpx;
    font-size: 26rpx;
    box-sizing: border-box;
  }

  &__submit-btn {
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: 28rpx;
  }
}
</style>
