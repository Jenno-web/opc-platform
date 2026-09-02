<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { onMounted, onUnmounted } from "vue";

onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});

// 下滑收起顶部导航栏、上滑/回到顶部再展开——现在滚动是 body/window 在管（上面那次
// pull-down-refresh 的修复把它改回来了），所以在 App.vue 挂一个全局 scroll 监听就能
// 覆盖所有页面，不用每个页面自己写一份。
// HIDE_THRESHOLD：离顶部很近的时候不收起，不然轻微上下晃动就收起/展开很闹心
const HIDE_THRESHOLD = 80;
let lastScrollY = 0;
let headObserver: MutationObserver | null = null;

function handleScroll() {
  const currentY = window.scrollY;
  if (currentY <= HIDE_THRESHOLD || currentY < lastScrollY) {
    document.body.classList.remove("opc-navbar-hidden");
  } else if (currentY > lastScrollY) {
    document.body.classList.add("opc-navbar-hidden");
  }
  lastScrollY = currentY;
}

function resetNavbar() {
  lastScrollY = window.scrollY;
  document.body.classList.remove("opc-navbar-hidden");
}

// 切换页面时要把"已收起"的状态重置掉，不然从长列表滑到底部再点进详情页，
// 新页面会顶着一个已经藏起来的顶栏出现（uni-app H5 页面切换不是整页刷新，
// document.body 是同一个节点，class 会一直留着）。
// uni-app 没有暴露一个干净的"路由变化"全局钩子，退而求其次：监听顶部导航栏
// 自己的 DOM 变化（标题文字/返回按钮这些每次切页都会变）间接感知"页面换了"——
// 观察范围放在 #app 这一层（挂载时机早，保证一开始就能订阅上），回调里再过滤只处理
// 落在 uni-page-head 内部的变化，避免页面内容本身的正常刷新也触发重置
function handleAppMutation(mutations: MutationRecord[]) {
  for (const m of mutations) {
    const node = (m.target.nodeType === 1 ? m.target : m.target.parentElement) as Element | null;
    if (node?.closest?.("uni-page-head")) {
      resetNavbar();
      return;
    }
  }
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
  const appRoot = document.querySelector("#app") ?? document.body;
  headObserver = new MutationObserver(handleAppMutation);
  headObserver.observe(appRoot, { childList: true, subtree: true, characterData: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  headObserver?.disconnect();
});
</script>
<style>
page {
  background-color: #ffffff;
  color: #111111;
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', sans-serif;
}

/* 之前为了修"桌面浏览器滚动条穿过底部导航栏"的问题，把实际滚动的容器从 body 换成了
   uni-page-wrapper（body/html 设 overflow-y:hidden，uni-page-wrapper 设 overflow-y:auto）。
   这个改法引入了一个更严重的问题：uni-app 框架自带的下拉刷新逻辑，判断"是否已经滑到
   顶部、可以触发刷新"用的是 document.documentElement.scrollTop || document.body.scrollTop——
   写死认定 body/html 才是真正在滚动的那个元素。body 不再滚动之后这个值永远是 0，框架
   永远以为"在最顶部"，导致列表随便滑到哪儿、只要往上一带手势就会被误判成下拉刷新触发。
   （发现页就是 enablePullDownRefresh: true，之前改的这条直接导致这个 bug）
   改回让 body 自己滚动（回到框架原生假设），滚动条穿过导航栏那个问题换一种方式解决——
   不移动滚动容器，只是把滚动条本身隐藏掉（移动端浏览器本来就是覆盖式滚动条，不占布局
   空间，这里只是让桌面预览也保持一致的视觉观感，不影响真机上的实际行为） */
html,
body {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* 旧版 Edge/IE */
}
html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* uni-page-body（页面内容实际渲染的地方）框架自己没给它设高度，只有 width:100%，
   高度是 auto、跟着内容走的。像聊天页那种想用 height:100% 撑满整屏、自己内部再滚动的页面，
   百分比高度得有一个"真的有高度"的祖先才能生效，不然就是 100% of auto = 没意义，直接
   塌缩成内容自身高度——这就是聊天页输入框之前显示在很靠上位置、够不到底部的原因 */
uni-page-body {
  height: 100%;
}

/* 顶部原生导航栏改成强调色底 + 白字（pages.json 的 globalStyle 里配的），跟下面白色
   页面内容天然就有色差分界，之前那条灰色 border-bottom 是白底白字年代补的，现在留着
   反而在靛蓝底上显得多余，去掉 */

/* 下滑收起顶部导航栏：真正做位移的是 uni-page-head 内部那个 .uni-page-head（框架自己
   fixed 定位、真实可见的那一层），不是 <uni-page-head> 这个自定义元素外壳本身。
   opc-navbar-hidden 这个 class 由 App.vue 的 scroll 监听挂在 body 上，见 <script setup> */
.uni-page-head {
  transition: transform 0.25s ease;
}
body.opc-navbar-hidden .uni-page-head {
  transform: translateY(-100%);
}

/* uni-input 自己有一条基于 line-height 算出来的默认固定高度，业务代码只要给它加 padding
   （而且 box-sizing 是 border-box），这条固定高度就会被 padding 反过来压缩——内部真正
   装文字的那层最后只剩几 px 高、overflow 又是裁切的，文字整行只露出顶上一条缝，看起来
   像是"字消失了"。实测（Chrome DevTools 量出来）：外层 <uni-input> 26px 高，中间
   .uni-input-wrapper、最内层 .uni-input-input 都被这个固定高度带着一起塌缩到 4px。
   uni-input-wrapper / uni-input-input 是框架内部渲染出来的两层 div，不是业务代码写的
   标签，所以在全局样式里直接按类名改，不用管是哪个页面在用 <input> */
uni-input,
uni-input .uni-input-wrapper,
uni-input .uni-input-input {
  height: auto;
  line-height: normal;
}

/* 全局交互工具类：Figma 低保真稿没有定义动效，这几个是按通用移动端交互习惯补的，
   放在全局是因为要被十几个页面复用，写进每个组件的 scoped style 里会重复十几份。
   #3B4BC4 是强调色的硬编码值——这个 <style> 块是纯 CSS 没走 SCSS，没法引用 tokens.scss
   里的 $opc-color-accent，改强调色的时候要记得这里也跟着改 */

/* 配合 uni-app 原生 hover-class 使用：view/button/navigator 等组件点下去自动切这个 class，
   松开自动去掉，比 CSS :active 在 iOS Safari 上更可靠（:active 需要额外绑 touchstart 才会触发）。
   之前只有透明度变化，这次加了轻微缩放，按下去有"真的按下去了"的反馈，不只是变暗 */
.opc-hover {
  opacity: 0.6;
  transform: scale(0.97);
}

/* 注意：uni-app 编译到 H5 之后 <view>/<button> 变成的是 <uni-view>/<uni-button> 这类自定义
   元素，不是字面意义上的 view/button 标签，选择器必须写编译后的标签名才会真的生效
   （前面 uni-page-wrapper 那几条也是同样道理，已经验证过这个规律） */
uni-view,
uni-button,
uni-navigator {
  transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.2s ease, color 0.2s ease,
    border-color 0.2s ease;
}

/* 底部 tabBar 和顶部导航栏返回箭头是框架原生渲染的（由 pages.json 配置生成，不是业务代码
   写的 <view>/<button>），套不上 hover-class，点下去之前完全没有反馈，感觉像点了没反应。
   iOS Safari 默认不触发 :active，除非页面里绑了至少一个 touch 事件监听——已经在
   index.html 的 <body> 上加了个空的 ontouchstart 属性来解锁这个行为（经典 trick）。
   跟 .opc-hover 用同一套"变暗+轻微缩小"手感，交互反馈保持统一 */
.uni-tabbar__item:active {
  opacity: 0.6;
}

.uni-tabbar__icon,
.uni-page-head-btn {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.uni-tabbar__item:active .uni-tabbar__icon {
  transform: scale(0.9);
}

.uni-page-head-btn:active {
  opacity: 0.6;
  transform: scale(0.9);
}

/* 卡片/列表项首次渲染时的淡入上滑，减少"数据突然出现"的生硬感。
   配合 --opc-stagger 这个 CSS 变量可以做"依次错开"的入场——在 v-for 里给每一项绑
   :style="{ '--opc-stagger': index }"，不用改动画本身，只是让入场有先后节奏，
   不设这个变量时默认是 0，行为跟以前完全一样 */
/* fill-mode 之前是 both（= backwards + forwards）。forwards 那一半的问题：只要动画
   还"挂"在元素上（class 从没摘掉过，永久挂着），它对 opacity/transform 这两个属性的优先级
   就一直高于普通规则——包括后来想加的 :active、hover-class 反馈，全部被动画的结束帧
   （opacity:1/transform:none）盖住，点下去什么变化都看不出来。这也是这一整轮"卡片/会话
   点击没反应"问题的根：所有带 opc-fade-in 的列表项全部中招，不只是某一两个页面的孤立问题。
   只留 backwards（负责错开延迟期间保持隐藏，不产生"没轮到就先闪一下"的效果），动画播完就
   彻底放手，opacity/transform 交还给正常的 CSS 层级 */
.opc-fade-in {
  --opc-stagger: 0;
  animation: opc-fade-in-up 0.4s ease backwards;
  animation-delay: calc(var(--opc-stagger) * 60ms);
}
@keyframes opc-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 语音输入中的呼吸脉冲，用在发布向导第 2 步 */
.opc-pulse {
  animation: opc-pulse 1.6s ease-in-out infinite;
}
@keyframes opc-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.65;
  }
}

/* AI 在工作时用的流光效果——呼应"AI 在处理"这件事，比纯文字 loading/转圈更有"设计感"，
   用在生成草稿、对话总结、匹配分析这类 AI 请求进行中的容器上 */
.opc-ai-working {
  position: relative;
  overflow: hidden;
}
.opc-ai-working::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 20%, rgba(59, 75, 196, 0.16) 50%, transparent 80%);
  background-size: 200% 100%;
  animation: opc-ai-shimmer 1.4s linear infinite;
  pointer-events: none;
}
@keyframes opc-ai-shimmer {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -50% 0;
  }
}
</style>
