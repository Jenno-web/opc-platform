import { io, type Socket } from 'socket.io-client'

// 实时消息连接：H5 环境下用 socket.io-client 连后端网关，
// 小程序/App 端没有走这条路（同语音输入一样，先只保证 H5 体验，非 H5 环境优雅降级为"没有实时推送，仍可用 REST 轮询"）。
// 同 request.ts：本地默认 localhost，部署时用 VITE_SOCKET_URL 环境变量指向真实后端地址。
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null

  const token = uni.getStorageSync('opc_token') as string | undefined
  if (!token) return null

  if (socket) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  })
  return socket
}
