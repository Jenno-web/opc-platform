<script setup lang="ts">
// 低保真源文件里图标都是占位文字/emoji，Figma 组件命名（"Lucide / compass" 这类）说明
// 设计意图是用 Lucide 那种描边风格的图标库。这里没有引入 Lucide 包，而是手工画基础图形
// （line/circle/polyline，不是照抄贝塞尔路径数据），视觉上贴近同一种风格：24×24 网格、
// 统一 2px 描边、圆头圆角。颜色默认跟着父级文字颜色走，延续"无强调色"的既定原则。
withDefaults(
  defineProps<{
    name:
      | 'search'
      | 'alert-triangle'
      | 'mic'
      | 'hash'
      | 'plus'
      | 'chevron-right'
      | 'chevron-down'
      | 'star'
      | 'inbox'
      | 'sparkle'
      | 'compass'
      | 'list-checks'
      | 'message-circle'
      | 'user-round'
      | 'sliders'
      | 'x'
      | 'send'
      | 'bell'
      | 'log-out'
      | 'pencil'
      | 'check'
      | 'target'
      | 'package'
      | 'users'
    size?: string
    color?: string
    filled?: boolean
  }>(),
  { size: '20px', color: 'currentColor', filled: false },
)
</script>

<template>
  <svg
    class="opc-icon"
    :style="{ width: size, height: size, color }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </template>

    <template v-else-if="name === 'alert-triangle'">
      <polygon points="12,3 22,20 2,20" />
      <line x1="12" y1="9" x2="12" y2="13.5" />
      <line x1="12" y1="16.5" x2="12" y2="16.7" />
    </template>

    <template v-else-if="name === 'mic'">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </template>

    <template v-else-if="name === 'hash'">
      <line x1="5" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="19" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </template>

    <template v-else-if="name === 'plus'">
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </template>

    <template v-else-if="name === 'chevron-right'">
      <polyline points="9,5 16,12 9,19" />
    </template>

    <template v-else-if="name === 'star'">
      <polygon
        :fill="filled ? 'currentColor' : 'none'"
        points="12,3 14.9,9.4 22,10.1 16.7,14.9 18.2,21.9 12,18.3 5.8,21.9 7.3,14.9 2,10.1 9.1,9.4"
      />
    </template>

    <template v-else-if="name === 'inbox'">
      <polyline points="3,9 8,9 9.5,13 14.5,13 16,9 21,9" />
      <rect x="3" y="9" width="18" height="12" rx="2" />
    </template>

    <!-- AI 相关内容的标记图标——常见的四角星"闪光"符号，填充而不是描边，
         主星在中心、右上角配一颗小星，做出"AI 生成/智能"的视觉联想 -->
    <template v-else-if="name === 'sparkle'">
      <polygon
        fill="currentColor"
        stroke="none"
        points="11,2 13.2,9.3 20.5,11.5 13.2,13.7 11,21 8.8,13.7 1.5,11.5 8.8,9.3"
      />
      <polygon fill="currentColor" stroke="none" points="19,2 19.9,5 22.5,6 19.9,7 19,10 18.1,7 15.5,6 18.1,5" />
    </template>

    <!-- 以下是桌面顶部导航/交互补的新图标，跟上面同一套风格：24×24 网格、line/circle/
         polyline/polygon 手画基础图形，不引入图标库、不照抄现成图标的贝塞尔路径数据 -->
    <template v-else-if="name === 'chevron-down'">
      <polyline points="5,9 12,16 19,9" />
    </template>

    <template v-else-if="name === 'compass'">
      <circle cx="12" cy="12" r="9" />
      <polygon fill="currentColor" stroke="none" points="15,9 13,13 9,15 11,11" />
    </template>

    <template v-else-if="name === 'list-checks'">
      <polyline points="3,6 5,8 9,4" />
      <line x1="13" y1="6" x2="21" y2="6" />
      <polyline points="3,14 5,16 9,12" />
      <line x1="13" y1="14" x2="21" y2="14" />
    </template>

    <template v-else-if="name === 'message-circle'">
      <rect x="3" y="4" width="18" height="13" rx="4" />
      <polyline points="8,17 8,21 12,17" />
    </template>

    <template v-else-if="name === 'user-round'">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </template>

    <template v-else-if="name === 'sliders'">
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" fill="currentColor" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" fill="currentColor" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="11" cy="18" r="2" fill="currentColor" />
    </template>

    <template v-else-if="name === 'x'">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </template>

    <template v-else-if="name === 'send'">
      <polygon points="3,11 21,3 13,21 11,13 3,11" />
    </template>

    <template v-else-if="name === 'bell'">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </template>

    <template v-else-if="name === 'log-out'">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </template>

    <template v-else-if="name === 'pencil'">
      <polyline points="3,21 3,17 15,5 19,9 7,21 3,21" />
      <line x1="13" y1="7" x2="17" y2="11" />
    </template>

    <template v-else-if="name === 'check'">
      <polyline points="4,12 9,17 20,6" />
    </template>

    <!-- 首页三种协作类型卡片用的图标：目标靶心(需求)/交付箱子(供给)/两人并肩(互助)，
         同样是 line/circle 手画基础图形，不引入图标库 -->
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </template>

    <template v-else-if="name === 'package'">
      <path d="M3 8 12 4l9 4-9 4-9-4Z" />
      <path d="M3 8v9l9 4 9-4V8" />
      <line x1="12" y1="12" x2="12" y2="21" />
    </template>

    <template v-else-if="name === 'users'">
      <circle cx="8.5" cy="8" r="3.5" />
      <path d="M2 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="3" />
      <path d="M15.5 12.3A6 6 0 0 1 22 20" />
    </template>
  </svg>
</template>

<style scoped>
.opc-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
