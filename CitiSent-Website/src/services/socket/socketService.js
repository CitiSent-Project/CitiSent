import { io } from 'socket.io-client'
import { resolveApiBaseUrl } from '../api/core/apiConfig'

let socketInstance = null

export function resolveSocketBaseUrl() {
  const apiUrl = resolveApiBaseUrl()
  return apiUrl.replace(/\/api\/v1\/?$/, '')
}

/**
 * Initialize or retrieve the singleton Socket.IO connection for Website Admin.
 */
export function getSocket(token) {
  if (socketInstance) {
    if (token && socketInstance.auth?.token !== token) {
      socketInstance.auth = { token }
      if (!socketInstance.connected) {
        socketInstance.connect()
      }
    }
    return socketInstance
  }

  const socketUrl = resolveSocketBaseUrl()

  socketInstance = io(socketUrl, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    // Cap reconnection attempts to avoid unbounded reconnect loops
    // during extended outages. At 10s max delay, 50 attempts ≈ 4–5 min.
    reconnectionAttempts: 50,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    // Randomize delay to prevent thundering-herd reconnect storms
    // when multiple admin tabs reconnect simultaneously.
    randomizationFactor: 0.4,
  })

  socketInstance.on('connect_error', (error) => {
    console.warn('[Socket.IO Admin Client Error]:', error?.message)
  })

  return socketInstance
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

export function joinReportRoom(token, reportId) {
  const socket = getSocket(token)
  if (socket && reportId) {
    socket.emit('join_report', { reportId })
  }
}

export function leaveReportRoom(token, reportId) {
  const socket = getSocket(token)
  if (socket && reportId) {
    socket.emit('leave_report', { reportId })
  }
}

export function sendSocketMessage(token, { reportId, message }) {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)
    if (!socket || !socket.connected) {
      return reject(new Error('Socket is disconnected'))
    }

    socket.emit('send_message', { reportId, message }, (response) => {
      if (response?.success) {
        resolve(response.data)
      } else {
        reject(new Error(response?.error || 'Failed to send message over socket'))
      }
    })
  })
}

export function markSocketConversationRead(token, { reportId, messageIds }) {
  const socket = getSocket(token)
  if (socket && reportId) {
    socket.emit('mark_as_read', { reportId, messageIds })
  }
}

export function sendSocketTyping(token, reportId) {
  const socket = getSocket(token)
  if (socket && reportId) {
    socket.emit('typing', { reportId })
  }
}

export function sendSocketStopTyping(token, reportId) {
  const socket = getSocket(token)
  if (socket && reportId) {
    socket.emit('stop_typing', { reportId })
  }
}
