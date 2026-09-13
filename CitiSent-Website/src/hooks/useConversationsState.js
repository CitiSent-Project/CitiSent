import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ADMIN_STORAGE_KEYS } from '../models/data'
import { getStorageSchemaRule } from '../models/storageSchemaModel'
import { notifyChatMessage } from '../components/ui/toastHelpers'
import {
  mapBackendConversationsResponse,
  mapBackendMessagesResponse,
  mapBackendMessageToUi,
} from '../services/api/admin/reportsApiMappers'
import { reportsApiService } from '../services/api/admin/reportsApiService'
import { loadFromStorageWithSchema } from '../services/storageService'
import {
  getSocket,
  joinReportRoom,
  markSocketConversationRead,
  sendSocketMessage,
  sendSocketStopTyping,
  sendSocketTyping,
} from '../services/socket/socketService'



function readAccessToken() {
  const rule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
  return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', rule)
}

function sortConversations(list) {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
  )
}

export function useConversationsState({ profile, onSyncConversations }) {
  const token = useMemo(readAccessToken, [])
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [conversationsError, setConversationsError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeConversation, setActiveConversation] = useState(null)
  const conversationsRef = useRef([])
  const processedMessagesRef = useRef(new Set())
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [sending, setSending] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const typingTimerRef = useRef(null)
  const activeConversationRef = useRef(activeConversation)

  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    if (typeof onSyncConversations === 'function') {
      onSyncConversations(conversations)
    }
  }, [conversations, onSyncConversations])

  const loadConversations = useCallback(async () => {
    if (!token) return

    setConversationsLoading(true)
    setConversationsError('')
    try {
      const response = await reportsApiService.listConversations(token)
      const sorted = sortConversations(mapBackendConversationsResponse(response))
      setConversations(sorted)

      sorted.forEach((conversation) => {
        if (conversation.reportId) {
          joinReportRoom(token, conversation.reportId)
        }
      })
    } catch (error) {
      console.error('Failed to load conversations:', error)
      setConversationsError(error.message || 'Failed to load conversations')
      setConversations([])
    } finally {
      setConversationsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const loadMessages = useCallback(async (reportId) => {
    if (!reportId || !token) return

    setChatLoading(true)
    setChatError('')
    try {
      const response = await reportsApiService.listReportMessages(token, reportId)
      setMessages(mapBackendMessagesResponse(response))
      await reportsApiService.markReportMessagesRead(token, reportId)
      markSocketConversationRead(token, { reportId })
      setConversations((current) =>
        current.map((conversation) =>
          conversation.reportId === reportId ? { ...conversation, unreadCount: 0 } : conversation
        )
      )
    } catch (error) {
      setChatError(error.message)
    } finally {
      setChatLoading(false)
    }
  }, [token])

  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation)
    setMessages([])
    setIsUserTyping(false)
    setMobileShowChat(true)

    if (conversation.reportId) {
      joinReportRoom(token, conversation.reportId)
      loadMessages(conversation.reportId)
    }
  }, [loadMessages, token])

  const handleSelectConversationRef = useRef(handleSelectConversation)
  useEffect(() => {
    handleSelectConversationRef.current = handleSelectConversation
  }, [handleSelectConversation])

  useEffect(() => {
    if (!token) return

    const socket = getSocket(token)
    const handleReceiveMessage = (data) => {
      if (!data?.reportId || !data?.message) return

      const rawMessage = data.message
      
      // Deduplicate: backend emits to both report room and feed room,
      // so we might receive the exact same message payload twice.
      if (rawMessage.id && processedMessagesRef.current.has(rawMessage.id)) {
        return
      }
      if (rawMessage.id) {
        processedMessagesRef.current.add(rawMessage.id)
      }

      const reportId = String(data.reportId)
      const isOwn = profile?.id && String(rawMessage.senderId || rawMessage.sender_id) === String(profile.id)
      const createdAt = rawMessage.createdAt || rawMessage.created_at || new Date().toISOString()
      const content = rawMessage.message || rawMessage.content || ''
      const message = mapBackendMessageToUi({
        id: rawMessage.id,
        senderId: rawMessage.senderId || rawMessage.sender_id,
        content,
        message: content,
        createdAt,
        isRead: false,
        senderRole: isOwn ? 'admin' : 'citizen',
      })
      const isCurrentActive = String(activeConversationRef.current?.reportId) === reportId

      if (isCurrentActive) {
        setMessages((current) => {
          if (current.some((entry) => String(entry.id) === String(message.id))) return current
          return [...current, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })
      }

      const targetConversation = conversationsRef.current.find((conv) => String(conv.reportId) === reportId)

      if (targetConversation && !isOwn && !isCurrentActive) {
        notifyChatMessage({
          senderName: targetConversation.userName || 'Citizen',
          messageText: content,
          reportNumber: targetConversation.reportNumber,
          onView: () => handleSelectConversationRef.current?.(targetConversation),
        })
      }

      setConversations((current) => {
        const index = current.findIndex((conversation) => String(conversation.reportId) === reportId)
        if (index === -1) return current

        const target = current[index]
        const updated = {
          ...target,
          lastMessage: content,
          lastMessageAt: createdAt,
          lastMessageSenderRole: isOwn ? 'admin' : 'citizen',
          unreadCount: isCurrentActive ? 0 : isOwn ? target.unreadCount : (target.unreadCount || 0) + 1,
        }
        const next = [...current]
        next[index] = updated

        return sortConversations(next)
      })
    }

    const handleMessagesRead = (data) => {
      if (!data?.reportId) return

      if (String(activeConversationRef.current?.reportId) === String(data?.reportId)) {
        setMessages((current) => current.map((message) => ({ ...message, isRead: true })))
      }
    }

    const handleTyping = (data) => {
      const reportId = String(data?.reportId || '')
      if (
        reportId &&
        String(activeConversationRef.current?.reportId) === reportId &&
        String(data?.userId) !== String(profile?.id)
      ) {
        setIsUserTyping(true)
      }
    }

    const handleStopTyping = (data) => {
      const reportId = String(data?.reportId || '')
      if (
        reportId &&
        String(activeConversationRef.current?.reportId) === reportId &&
        String(data?.userId) !== String(profile?.id)
      ) {
        setIsUserTyping(false)
      }
    }

    socket.on('receive_message', handleReceiveMessage)
    socket.on('messages_read', handleMessagesRead)
    socket.on('typing', handleTyping)
    socket.on('stop_typing', handleStopTyping)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
      socket.off('messages_read', handleMessagesRead)
      socket.off('typing', handleTyping)
      socket.off('stop_typing', handleStopTyping)
    }
  }, [profile?.id, token])

  const handleSend = useCallback(async (content) => {
    if (!content.trim() || !activeConversation?.reportId) return false

    const reportId = activeConversation.reportId
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendSocketStopTyping(token, reportId)
    setSending(true)

    try {
      const confirmedMessage = await sendSocketMessage(token, { reportId, message: content })
      const createdAt = new Date().toISOString()

      if (confirmedMessage) {
        const isOwn = profile?.id && String(confirmedMessage.senderId || confirmedMessage.sender_id) === String(profile.id)
        const message = mapBackendMessageToUi({
          id: confirmedMessage.id,
          senderId: confirmedMessage.senderId || confirmedMessage.sender_id,
          content: confirmedMessage.message || confirmedMessage.content,
          message: confirmedMessage.message || confirmedMessage.content,
          createdAt: confirmedMessage.createdAt || confirmedMessage.created_at || createdAt,
          isRead: false,
          senderRole: isOwn ? 'admin' : 'citizen',
        })

        setMessages((current) => {
          if (current.some((entry) => String(entry.id) === String(message.id))) return current
          return [...current, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })
      } else {
        await loadMessages(reportId)
      }

      setConversations((current) => updateSentConversation(current, reportId, content, createdAt))
      return true
    } catch (socketError) {
      console.warn('Socket send failed, falling back to HTTP:', socketError?.message)
      try {
        const response = await reportsApiService.sendReportMessage(token, reportId, content)
        const sentMessages = mapBackendMessagesResponse(response)

        if (sentMessages[0]) {
          setMessages((current) => {
            if (current.some((entry) => String(entry.id) === String(sentMessages[0].id))) return current
            return [...current, sentMessages[0]]
          })
        } else {
          await loadMessages(reportId)
        }

        setConversations((current) => updateSentConversation(current, reportId, content, new Date().toISOString()))
        return true
      } catch (error) {
        setChatError(error.message)
        return false
      }
    } finally {
      setSending(false)
    }
  }, [activeConversation?.reportId, loadMessages, profile?.id, token])

  const handleComposerTyping = useCallback(() => {
    if (!activeConversation?.reportId || !token) return

    sendSocketTyping(token, activeConversation.reportId)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      sendSocketStopTyping(token, activeConversation.reportId)
    }, 2000)
  }, [activeConversation?.reportId, token])

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
  }, [])

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter((conversation) =>
      conversation.userName.toLowerCase().includes(query) ||
      conversation.category.toLowerCase().includes(query) ||
      conversation.reportNumber.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
    [conversations]
  )

  return {
    activeConversation,
    chatError,
    chatLoading,
    conversationsError,
    conversationsLoading,
    filteredConversations,
    handleComposerTyping,
    handleSelectConversation,
    handleSend,
    isUserTyping,
    loadConversations,
    loadMessages,
    messages,
    mobileShowChat,
    searchQuery,
    sending,
    setMobileShowChat,
    setSearchQuery,
    totalUnread,
  }
}

function updateSentConversation(conversations, reportId, content, createdAt) {
  const index = conversations.findIndex((conversation) => String(conversation.reportId) === String(reportId))
  if (index === -1) return conversations

  const next = [...conversations]
  next[index] = {
    ...next[index],
    lastMessage: content,
    lastMessageAt: createdAt,
    lastMessageSenderRole: 'admin',
    unreadCount: 0,
  }

  return sortConversations(next)
}
