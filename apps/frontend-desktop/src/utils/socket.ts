import { io, type Socket } from 'socket.io-client'

// 跟移动端 apps/frontend/src/utils/socket.ts 同一套逻辑，只是把 uni.getStorageSync 换成 localStorage
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  const token = localStorage.getItem('opc_token')
  if (!token) return null

  if (socket) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  })
  return socket
}
