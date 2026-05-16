import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { AuthContext } from './AuthContext'

export const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { token, user } = useContext(AuthContext)
  const socketRef = useRef(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const messageListeners = useRef([])

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('userOnline', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]))
    })

    socket.on('userOffline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    socket.on('newMessage', (data) => {
      messageListeners.current.forEach((fn) => fn(data))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, user])

  const addMessageListener = (fn) => {
    messageListeners.current.push(fn)
    return () => {
      messageListeners.current = messageListeners.current.filter((f) => f !== fn)
    }
  }

  const emitTyping = (conversationId) => {
    socketRef.current?.emit('typing', { conversationId })
  }

  const emitStopTyping = (conversationId) => {
    socketRef.current?.emit('stopTyping', { conversationId })
  }

  const joinConversation = (conversationId) => {
    socketRef.current?.emit('joinConversation', conversationId)
  }

  const leaveConversation = (conversationId) => {
    socketRef.current?.emit('leaveConversation', conversationId)
  }

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        addMessageListener,
        emitTyping,
        emitStopTyping,
        joinConversation,
        leaveConversation,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
