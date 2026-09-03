import { showToast } from '@/composables/useToast'

// 跟移动端 apps/frontend/src/utils/request.ts 是同一套逻辑（BASE_URL 环境变量、
// dev-login 自动登录、Bearer 头、并发登录请求去重），只是把 uni.request/
// uni.getStorageSync/setStorageSync/uni.showToast 换成浏览器原生的
// fetch/localStorage/自己写的 toast，桌面端没有 uni 运行时可用
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
const DEMO_PHONE = '13800000001'
const TOKEN_KEY = 'opc_token'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  // 用 object 而不是 Record<string, unknown>：后者要求源类型显式带字符串索引签名，
  // api/*.ts 里传进来的都是具名 interface（没有索引签名），在 TS5 下会报"缺索引签名"——
  // 这是从移动端（TS4）搬过来时才暴露的差异，object 类型结构上兼容任意对象，没有这个限制
  data?: object
  skipAuth?: boolean
}

async function rawRequest<T>(options: RequestOptions, token?: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${options.url}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.data !== undefined && (options.method ?? 'GET') !== 'GET' ? JSON.stringify(options.data) : undefined,
    })
  } catch (err) {
    showToast('网络异常，请检查后端服务是否已启动')
    throw err
  }

  const body = await res.json().catch(() => null)
  if (res.ok) return body as T

  const message = (body as { message?: string } | null)?.message ?? `请求失败(${res.status})`
  showToast(Array.isArray(message) ? message.join('；') : message)
  throw new Error(Array.isArray(message) ? message.join('；') : message)
}

let loginPromise: Promise<string> | null = null

function ensureToken(): Promise<string> {
  const cached = localStorage.getItem(TOKEN_KEY)
  if (cached) return Promise.resolve(cached)

  if (!loginPromise) {
    loginPromise = rawRequest<{ token: string }>({
      url: '/auth/dev-login',
      method: 'POST',
      data: { phone: DEMO_PHONE },
    }).then((res) => {
      localStorage.setItem(TOKEN_KEY, res.token)
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
