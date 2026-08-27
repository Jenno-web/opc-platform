<script setup lang="ts">
import { ref } from 'vue'
import { sendVerificationCode, verifyCodeAndLogin } from '@/api/auth'

const phone = ref('')
const code = ref('')
const devCode = ref('')
const sending = ref(false)
const verifying = ref(false)
const countdown = ref(0)

function isValidPhone(value: string) {
  return /^1\d{10}$/.test(value)
}

let timer: ReturnType<typeof setInterval> | null = null

async function handleSendCode() {
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确的 11 位手机号', icon: 'none' })
    return
  }
  sending.value = true
  try {
    const res = await sendVerificationCode(phone.value)
    devCode.value = res.devCode ?? ''
    uni.showToast({
      title: res.devCode ? `未接入真实短信，验证码：${res.devCode}` : '验证码已发送',
      icon: 'none',
      duration: 4000,
    })

    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  } finally {
    sending.value = false
  }
}

async function handleLogin() {
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确的 11 位手机号', icon: 'none' })
    return
  }
  if (code.value.length !== 6) {
    uni.showToast({ title: '请输入 6 位验证码', icon: 'none' })
    return
  }
  verifying.value = true
  try {
    const res = await verifyCodeAndLogin(phone.value, code.value)
    uni.setStorageSync('opc_token', res.token)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => uni.reLaunch({ url: '/pages/discover/index' }), 600)
  } finally {
    verifying.value = false
  }
}
</script>

<template>
  <view class="login">
    <view class="login__title">手机号登录</view>
    <view class="login__subtitle">
      未接入真实短信服务商前，验证码会在获取后直接以提示形式显示，方便联调
    </view>

    <view class="login__field">
      <input v-model="phone" class="login__input" type="number" maxlength="11" placeholder="请输入手机号" />
    </view>

    <view class="login__field login__field--code">
      <input v-model="code" class="login__input" type="number" maxlength="6" placeholder="请输入验证码" />
      <button
        class="login__code-btn"
        hover-class="opc-hover"
        :disabled="countdown > 0"
        :loading="sending"
        @click="handleSendCode"
      >
        {{ countdown > 0 ? `${countdown}s 后重试` : '获取验证码' }}
      </button>
    </view>

    <view v-if="devCode" class="login__dev-hint">开发态验证码：{{ devCode }}</view>

    <button class="login__submit-btn" hover-class="opc-hover" :loading="verifying" @click="handleLogin">登录</button>
  </view>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.login {
  padding: 60rpx $opc-spacing;

  &__title {
    font-size: 40rpx;
    font-weight: 700;
    margin-bottom: $opc-spacing-xxs;
  }

  &__subtitle {
    font-size: $opc-font-sm;
    color: $opc-color-text-secondary;
    margin-bottom: $opc-spacing-xl;
    line-height: 1.6;
  }

  &__field {
    background: $opc-bg-card;
    border: 1px solid $opc-border-color;
    border-radius: $opc-radius-card;
    padding: $opc-spacing-sm;
    margin-bottom: $opc-spacing-sm;
    display: flex;
    align-items: center;

    &--code {
      justify-content: space-between;
    }
  }

  &__input {
    flex: 1;
    font-size: $opc-font-base;
  }

  &__code-btn {
    flex-shrink: 0;
    font-size: $opc-font-sm;
    background: $opc-color-primary-soft;
    color: $opc-color-primary;
    border-radius: $opc-radius-tag;
    padding: 0 $opc-spacing-sm;
    line-height: 56rpx;
    height: 56rpx;
  }

  &__dev-hint {
    display: block;
    font-size: $opc-font-sm;
    color: $opc-color-ai;
    background: $opc-color-primary-soft;
    padding: $opc-spacing-xxs $opc-spacing-sm;
    border-radius: $opc-radius-card-sm;
    margin-bottom: $opc-spacing-sm;
  }

  &__submit-btn {
    background: $opc-color-primary;
    color: #fff;
    border-radius: $opc-radius-tag;
    font-size: $opc-font-base;
    margin-top: $opc-spacing-xxs;
  }
}
</style>
