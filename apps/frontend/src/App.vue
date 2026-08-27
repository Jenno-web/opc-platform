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
