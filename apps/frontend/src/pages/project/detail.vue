<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AiHint from '@/components/AiHint.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import { fetchProjectDetail } from '@/api/projects'
import { useUserStore } from '@/store/user'
import type { ProjectDetail } from '@/types'

const userStore = useUserStore()
const detail = ref<ProjectDetail | null>(null)
const loading = ref(true)

// 对自己发布的项目点"提问"/"我想响应"没有意义——后端也挡了这个情况，这里是前端提前把入口收起来
const isOwnProject = computed(() => detail.value?.publisher.id === userStore.currentUser?.id)

const kindLabel: Record<string, string> = { DEMAND: '需求', SUPPLY: '供给', MUTUAL: '互助' }
const statusLabel: Record<string, string> = {
  RECRUITING: '待响应',
  IN_PROGRESS: '进行中',
  PENDING_CONFIRM: '待确认',
  COMPLETED: '已完成',
  ARCHIVED: '已归档',
}

onLoad(async (query) => {
  if (!userStore.currentUser) await userStore.loadCurrentUser()
  const id = query?.id as string
  if (!id) return
  loading.value = true
  try {
    detail.value = await fetchProjectDetail(id)
  } finally {
    loading.value = false
  }
})

function goRespond(mode: 'question' | 'respond') {
  if (!detail.value) return
  uni.navigateTo({
    url: `/pages/project/respond?projectId=${detail.value.id}&publisherId=${detail.value.publisher.id}&mode=${mode}`,
  })
}
</script>

<template>
  <view class="detail">
    <view v-if="loading" class="detail__loading">
      <SkeletonBlock :rows="2" avatar />
      <SkeletonBlock :rows="4" />
      <SkeletonBlock :rows="3" />
    </view>

    <template v-else-if="detail">
      <view class="detail__badges">
        <text class="detail__kind" :class="`is-${detail.kind.toLowerCase()}`">{{ kindLabel[detail.kind] }}</text>
        <text v-if="detail.publishTier === 'BOUNTY'" class="detail__bounty">悬赏</text>
        <text class="detail__status" :class="`is-${detail.status.toLowerCase()}`">{{ statusLabel[detail.status] }}</text>
      </view>

      <view class="detail__title">{{ detail.title }}</view>
      <text class="detail__background">{{ detail.background }}</text>

      <view class="detail__tags">
        <text v-for="tag in detail.skillTags" :key="tag.id" class="detail__tag">{{ tag.name }}</text>
      </view>

      <view class="detail__meta">
        <text>预算 {{ detail.budgetMin }}-{{ detail.budgetMax }} 元</text>
        <text>截止 {{ detail.cycleWeeks }} 周内</text>
        <text>{{ detail.kind === 'SUPPLY' ? '供给' : '合作' }}方式：远程</text>
      </view>

      <AiHint v-if="detail.aiSummary" label="AI 摘要" :text="detail.aiSummary" />

      <AiHint
        v-if="detail.aiMatch"
        label="AI 匹配"
        :text="detail.aiMatch.reason"
        :emphasis="`匹配度 ${detail.aiMatch.score}%`"
      />

      <!-- 之前这四块是各自悬空的小节，只靠 margin 隔开，容易连成一片；现在合并进一个卡片，
           内部用分隔线区隔，小节标题前加强调色竖条做视觉锚点 -->
      <view class="detail__content-card">
        <view class="detail__section">
          <view class="detail__section-title">项目目标</view>
          <text class="detail__section-body">{{ detail.goal }}</text>
        </view>
        <view class="detail__section">
          <view class="detail__section-title">核心功能</view>
          <text class="detail__section-body">{{ detail.coreFeatures }}</text>
        </view>
        <view class="detail__section">
          <view class="detail__section-title">交付内容</view>
          <text class="detail__section-body">{{ detail.deliverables }}</text>
        </view>
        <view class="detail__section">
          <view class="detail__section-title">验收标准</view>
          <text class="detail__section-body">{{ detail.acceptanceCriteria }}</text>
        </view>
      </view>

      <view v-if="detail.roles.length" class="detail__content-card">
        <view class="detail__section">
          <view class="detail__section-title">正在招募</view>
          <view v-for="role in detail.roles" :key="role.id" class="detail__role">
            <text class="detail__role-name">{{ role.roleName }}</text>
            <text class="detail__role-count">{{ role.filledCount }}/{{ role.headcount }} 人</text>
          </view>
        </view>
      </view>

      <view class="detail__publisher">
        <Avatar :name="detail.publisher.nickname" :avatar-url="detail.publisher.avatarUrl" size="72rpx" />
        <view class="detail__publisher-info">
          <text class="detail__publisher-name">{{ detail.publisher.nickname }}</text>
          <text class="detail__publisher-meta">
            {{ detail.publisher.professionalIdentity }} · 入驻 {{ detail.publisher.daysSinceJoin }} 天 ·
            {{ detail.publisher.collaborationCount }} 次合作
          </text>
        </view>
        <view class="detail__publisher-rating">
          <Icon name="star" filled size="24rpx" />
          <text>{{ detail.publisher.ratingAvg.toFixed(1) }}</text>
        </view>
      </view>

      <view v-if="!isOwnProject" class="detail__actions">
        <button class="detail__question-btn" hover-class="opc-hover" @click="goRespond('question')">提问</button>
        <button class="detail__respond-btn" hover-class="opc-hover" @click="goRespond('respond')">我想响应</button>
      </view>
      <view v-else class="detail__own-hint">这是你发布的项目，去"任务"页查看收到的响应</view>
    </template>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.detail {
  padding: $opc-spacing;
  padding-bottom: 160rpx;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-sm;

  &__loading {
    display: flex;
    flex-direction: column;
    gap: $opc-spacing-sm;
  }

  &__badges {
    display: flex;
    gap: $opc-spacing-xxs;
  }

  &__kind {
    font-size: $opc-font-xs;
    font-weight: 600;
    padding: $opc-spacing-micro 14rpx;
    border-radius: $opc-radius-tag;

    &.is-demand {
      color: $opc-color-kind-demand;
      background: rgba($opc-color-kind-demand, 0.1);
    }
    &.is-supply {
      color: $opc-color-kind-supply;
      background: rgba($opc-color-kind-supply, 0.1);
    }
    &.is-mutual {
      color: $opc-color-kind-mutual;
      background: rgba($opc-color-kind-mutual, 0.1);
    }
  }

  &__bounty {
    font-size: $opc-font-xs;
    font-weight: 700;
    color: #fff;
    background: $opc-color-primary;
    padding: $opc-spacing-micro 14rpx;
    border-radius: $opc-radius-tag;
  }

  &__status {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
    padding: $opc-spacing-micro 14rpx;
    border-radius: $opc-radius-tag;
    background: $opc-bg-subtle;

    &.is-recruiting {
      color: $opc-color-accent;
      background: rgba($opc-color-accent, 0.1);
    }
    &.is-in_progress {
      color: $opc-color-kind-supply;
      background: rgba($opc-color-kind-supply, 0.1);
    }
    &.is-pending_confirm {
      color: $opc-color-warning;
      background: rgba($opc-color-warning, 0.1);
    }
    &.is-completed {
      color: $opc-color-success;
      background: rgba($opc-color-success, 0.1);
    }
  }

  &__title {
    font-size: $opc-font-xl;
    font-weight: 700;
  }

  &__background {
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
    color: $opc-color-text-secondary;
    background: $opc-bg-subtle;
    padding: 6rpx 16rpx;
    border-radius: $opc-radius-tag;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $opc-spacing-xxs $opc-spacing-sm;
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
  }

  // 内容合并进的大卡片：边框+阴影跟其他卡片一个规格，内部小节靠 border-top 分隔线区隔，
  // 不再是纯文字紧挨着纯文字
  &__content-card {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
    padding: 0 $opc-spacing;
  }

  &__section {
    padding: $opc-spacing-sm 0;

    &:not(:first-child) {
      border-top: 1px solid $opc-border-color;
    }
  }

  // 小节标题前加一条强调色竖条，做出明确的视觉锚点，不再是纯靠字重区分
  &__section-title {
    position: relative;
    padding-left: $opc-spacing-xxs;
    font-size: $opc-font-base;
    font-weight: 600;
    margin-bottom: $opc-spacing-xxs;

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

  &__section-body {
    font-size: $opc-font-base;
    color: $opc-color-text-secondary;
    line-height: 1.6;
  }

  &__role {
    display: flex;
    justify-content: space-between;
    padding: $opc-spacing-xs $opc-spacing-sm;
    background: $opc-bg-subtle;
    border-radius: $opc-radius-card-sm;
    margin-bottom: $opc-spacing-xxs;
    font-size: $opc-font-base;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__publisher {
    display: flex;
    align-items: center;
    gap: $opc-spacing-xs;
    padding: $opc-spacing-sm;
    background: $opc-bg-subtle;
    border-radius: $opc-radius-card;
    box-shadow: $opc-shadow-sm;
  }

  &__publisher-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__publisher-name {
    font-size: $opc-font-base;
    font-weight: 600;
  }

  &__publisher-meta {
    font-size: $opc-font-xs;
    color: $opc-color-text-secondary;
  }

  &__publisher-rating {
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-size: $opc-font-sm;
    font-weight: 600;
  }

  &__actions {
    position: fixed;
    left: $opc-spacing;
    right: $opc-spacing;
    bottom: 32rpx;
    display: flex;
    gap: $opc-spacing-xs;
  }

  &__own-hint {
    text-align: center;
    font-size: $opc-font-sm;
    color: $opc-color-text-placeholder;
    padding: $opc-spacing-sm 0 100rpx;
  }

  &__question-btn {
    flex: 1;
    background: $opc-bg-card;
    border: 1px solid $opc-color-text;
    color: $opc-color-text;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-base;
  }

  &__respond-btn {
    flex: 2;
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-base;
  }
}
</style>
