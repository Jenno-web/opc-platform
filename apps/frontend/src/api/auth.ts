import { request } from '@/utils/request'

export function sendVerificationCode(phone: string) {
  return request<{ sent: boolean; expiresInSeconds: number; devCode?: string }>({
    url: '/auth/send-code',
    method: 'POST',
    data: { phone },
    skipAuth: true,
  })
}

export function verifyCodeAndLogin(phone: string, code: string) {
  return request<{ token: string; userId: string }>({
    url: '/auth/verify-code',
    method: 'POST',
    data: { phone, code },
    skipAuth: true,
  })
}
