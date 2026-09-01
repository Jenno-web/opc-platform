<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
page {
  background-color: #ffffff;
  color: #111111;
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', sans-serif;
}

/* 修复"桌面浏览器滚动条穿过底部导航栏/工具栏"的问题：uni-app 框架自己把 uni-page-wrapper
   的高度算得很准（已经扣掉了底部 tabBar、顶部导航栏的高度），但从来没让它自己滚动——
   页面内容一旦超高，就会一路溢出到最外层的浏览器窗口，变成整个浏览器窗口在滚动。
   窗口级别的滚动条是操作系统/浏览器渲染的，会盖在所有页面元素（包括 fixed 定位的
   底部导航栏）上面，这是没法用页面自己的 CSS 层级去控制的。
   解决办法：不让浏览器窗口本身滚动，让 uni-page-wrapper 自己滚动——它的高度本来就已经
   排除了顶部/底部栏的空间，滚动条自然会老老实实停在栏的上边缘，不会再穿过去。
   用 !important 是因为不确定这条规则相对于 uni-app 框架自带样式的加载顺序，稳妥起见强制生效。 */
html,
body {
  overflow-y: hidden !important;
}

uni-page-wrapper {
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
}

/* uni-page-body（页面内容实际渲染的地方）框架自己没给它设高度，只有 width:100%，
   高度是 auto、跟着内容走的。像聊天页那种想用 height:100% 撑满整屏、自己内部再滚动的页面，
   百分比高度得有一个"真的有高度"的祖先才能生效，不然就是 100% of auto = 没意义，直接
   塌缩成内容自身高度——这就是聊天页输入框之前显示在很靠上位置、够不到底部的原因 */
uni-page-body {
  height: 100%;
}

/* 全局交互工具类：Figma 低保真稿没有定义动效，这几个是按通用移动端交互习惯补的，
   放在全局是因为要被十几个页面复用，写进每个组件的 scoped style 里会重复十几份 */

/* 配合 uni-app 原生 hover-class 使用：view/button/navigator 等组件点下去自动切这个 class，
   松开自动去掉，比 CSS :active 在 iOS Safari 上更可靠（:active 需要额外绑 touchstart 才会触发） */
.opc-hover {
  opacity: 0.6;
}

/* 卡片/列表项首次渲染时的淡入上滑，减少"数据突然出现"的生硬感 */
.opc-fade-in {
  animation: opc-fade-in-up 0.3s ease both;
}
@keyframes opc-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12rpx);
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
</style>
