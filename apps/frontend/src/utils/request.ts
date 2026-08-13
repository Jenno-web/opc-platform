// 统一封装 uni.request，前端所有接口调用都走这里；
// 首次调用前会自动完成 MVP 阶段的 mock 登录（dev-login），拿到 token 后续复用。
//
// BASE_URL 走构建时环境变量：本地开发默认打 localhost，部署到 Vercel 等平台时
// 在项目环境变量里设置 VITE_API_BASE_URL 指向真实后端地址（比如 Railway 的域名），不用改代码。
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
const DEMO_PHONE = '13800000001'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: Record<string, unknown>
  skipAuth?: boolean
}

function rawRequest<T>(options: RequestOptions, token?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method ?? 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          const message = (res.data as { message?: string })?.message ?? `请求失败(${res.statusCode})`
          uni.showToast({ title: message, icon: 'none' })
          reject(new Error(message))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常，请检查后端服务是否已启动', icon: 'none' })
        reject(err)
      },
    })
  })
}

let loginPromise: Promise<string> | null = null

function ensureToken(): Promise<string> {
  const cached = uni.getStorageSync('opc_token') as string | undefined
  if (cached) return Promise.resolve(cached)

  if (!loginPromise) {
    loginPromise = rawRequest<{ token: string }>(
      { url: '/auth/dev-login', method: 'POST', data: { phone: DEMO_PHONE } },
    ).then((res) => {
      uni.setStorageSync('opc_token', res.token)
      return res.token
    })
  }
  return loginPromise
}

export async function request<T>(options: RequestOptions): Promise<T> {
  if (options.skipAuth) return rawRequest<T>(options)
  const token = await ensureToken()
  return rawRequest<T>(options, token)
}
