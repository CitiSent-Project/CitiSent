import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiSearch,
  FiRefreshCw,
  FiArrowLeft,
  FiFileText,
} from 'react-icons/fi'

// ─── API / Mappers ────────────────────────────────────────────────────────────
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import {
  mapBackendConversationsResponse,
  mapBackendMessagesResponse,
  mapBackendMessageToUi,
  mapBackendSuggestionsToUi,
  mapBackendReportToUiRow,
} from '../../services/api/admin/reportsApiMappers'

// ─── Toast Notifications ──────────────────────────────────────────────────────
import { notifyChatMessage } from '../../components/ui/toastHelpers'

// ─── Socket services (reuses the same socket layer as ReportChatDrawer) ───────
import {
  getSocket,
  joinReportRoom,
  sendSocketMessage,
  markSocketConversationRead,
  sendSocketTyping,
  sendSocketStopTyping,
} from '../../services/socket/socketService'

// ─── Storage (to read access token, same approach as ReportDetailPage) ────────
import { loadFromStorageWithSchema } from '../../services/storageService'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'

// ─── Existing UI components reused for the chat thread / composer ─────────────
import { ReportChatThread } from '../../components/Reports-Ui/ReportChatThread'
import { ReportChatComposer } from '../../components/Reports-Ui/ReportChatComposer'

// ─── Conversations sub-components ─────────────────────────────────────────────
import { ConversationListItem } from './ConversationListItem'
import { ConversationEmptyState } from './ConversationEmptyState'

// ─── Framer Motion shorthand ──────────────────────────────────────────────────
const MotionDiv = motion.div

/**
 * Reads the admin access token from localStorage using schema validation.
 */
function readAccessToken() {
  const rule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
  return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', rule)
}

/**
 * Formats presence text (e.g. "Last seen 8 mins ago")
 */
function formatLastSeen(dateString) {
  if (!dateString) return 'Offline'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Offline'

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMins < 1) return 'Active just now'
  if (diffMins < 60) return `Last seen ${diffMins}m ago`
  if (diffHours < 24) return `Last seen ${diffHours}h ago`
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// ConversationsPage
// ═══════════════════════════════════════════════════════════════════════════════
export function ConversationsPage({ profile, onViewReport }) {
  // ── Access Token ──────────────────────────────────────────────────────────
  const token = useMemo(readAccessToken, [])

  // ── Conversations List State ──────────────────────────────────────────────
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [conversationsError, setConversationsError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeConversation, setActiveConversation] = useState(null)

  // ── Chat Thread State ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [sending, setSending] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)
  const typingTimerRef = useRef(null)

  // ── AI Suggestions State ──────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // ── Mobile Toggle ─────────────────────────────────────────────────────────
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const activeConversationRef = useRef(activeConversation)
  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  // Sort helper: keep conversations ordered by recent activity timestamp
  const sortConversations = (list) => {
    return [...list].sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Load Conversations List & Join Socket Rooms
  // ─────────────────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token) return
    setConversationsLoading(true)
    setConversationsError('')
    try {
      const response = await reportsApiService.listConversations(token)
      const mapped = mapBackendConversationsResponse(response)
      const sorted = sortConversations(mapped)
      setConversations(sorted)

      // Join socket rooms for all loaded conversations so real-time updates arrive
      sorted.forEach((c) => {
        if (c.reportId) joinReportRoom(token, c.reportId)
      })
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setConversationsError(err.message || 'Failed to load conversations')
      setConversations([])
    } finally {
      setConversationsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Load Messages for the active conversation
  // ─────────────────────────────────────────────────────────────────────────
  const loadMessages = useCallback(
    async (reportId) => {
      if (!reportId || !token) return
      setChatLoading(true)
      setChatError('')
      try {
        const response = await reportsApiService.listReportMessages(token, reportId)
        setMessages(mapBackendMessagesResponse(response))
        // Mark as read
        await reportsApiService.markReportMessagesRead(token, reportId)
        markSocketConversationRead(token, { reportId })
        // Clear unread count for this active conversation
        setConversations((prev) =>
          prev.map((c) => (c.reportId === reportId ? { ...c, unreadCount: 0 } : c))
        )
      } catch (err) {
        setChatError(err.message)
      } finally {
        setChatLoading(false)
      }
    },
    [token]
  )

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Fetch AI Reply Suggestions
  // ─────────────────────────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(
    async (reportId, force = false) => {
      if (!reportId || !token) return
      setSuggestionsLoading(true)
      try {
        const res = await reportsApiService.getReportChatSuggestions(token, reportId, force)
        const mapped = mapBackendSuggestionsToUi(res)
        setSuggestions(mapped.suggestedReplies || [])
      } catch {
        setSuggestions([
          { text: 'Thank you for reaching out. We have received your message and are looking into it.', rank: 1 },
          { text: 'Could you please provide more details or clarify your request?', rank: 2 },
          { text: 'We are currently reviewing this issue and will update you as soon as possible.', rank: 3 },
          { text: 'If this is an immediate emergency, please contact our direct hotline or emergency services.', rank: 4 },
        ])
      } finally {
        setSuggestionsLoading(false)
      }
    },
    [token]
  )

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Select Conversation
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation)
    setMessages([])
    setSuggestions([])
    setIsUserTyping(false)
    setMobileShowChat(true)

    if (conversation.reportId) {
      joinReportRoom(token, conversation.reportId)
      loadMessages(conversation.reportId)
      fetchSuggestions(conversation.reportId)
    }
  }, [token, loadMessages, fetchSuggestions])

  const handleSelectConversationRef = useRef(handleSelectConversation)
  useEffect(() => {
    handleSelectConversationRef.current = handleSelectConversation
  }, [handleSelectConversation])

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Global Socket Listener for All Joined Report Rooms
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return

    const socket = getSocket(token)

    const handleReceiveMessage = (data) => {
      if (!data?.reportId || !data?.message) return

      const reportId = String(data.reportId)
      const raw = data.message
      const isOwn = profile?.id && String(raw.senderId || raw.sender_id) === String(profile.id)
      const nowIso = raw.createdAt || raw.created_at || new Date().toISOString()
      const contentText = raw.message || raw.content || ''

      const newMsg = mapBackendMessageToUi({
        id: raw.id,
        senderId: raw.senderId || raw.sender_id,
        content: contentText,
        message: contentText,
        createdAt: nowIso,
        isRead: false,
        senderRole: isOwn ? 'admin' : 'citizen',
      })

      const isCurrentActive = String(activeConversationRef.current?.reportId) === reportId

      // If viewing this thread, append to message thread
      if (isCurrentActive) {
        setMessages((current) => {
          if (current.some((m) => String(m.id) === String(newMsg.id))) return current
          return [...current, newMsg].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })

        if (!isOwn) {
          fetchSuggestions(reportId, false)
        }
      }

      // Update conversation list item & dynamically re-order list to top
      setConversations((prev) => {
        const index = prev.findIndex((c) => String(c.reportId) === reportId)
        if (index === -1) return prev

        const target = prev[index]
        const updatedTarget = {
          ...target,
          lastMessage: contentText,
          lastMessageAt: nowIso,
          lastMessageSenderRole: isOwn ? 'admin' : 'citizen',
          unreadCount: isCurrentActive ? 0 : isOwn ? target.unreadCount : (target.unreadCount || 0) + 1,
        }

        const nextList = [...prev]
        nextList[index] = updatedTarget

        // Show toast notification if message is from citizen and admin is not actively viewing that thread
        if (!isOwn && !isCurrentActive) {
          notifyChatMessage({
            senderName: target.userName || 'Citizen',
            messageText: contentText,
            reportNumber: target.reportNumber,
            onView: () => handleSelectConversationRef.current?.(updatedTarget),
          })
        }

        return sortConversations(nextList)
      })
    }

    const handleMessagesRead = (data) => {
      if (!data?.reportId) return
      const reportId = String(data.reportId)
      if (String(activeConversationRef.current?.reportId) === reportId) {
        setMessages((current) => current.map((msg) => ({ ...msg, isRead: true })))
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
  }, [token, profile?.id, fetchSuggestions])

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Send Message
  // ─────────────────────────────────────────────────────────────────────────
  async function handleSend(content) {
    if (!content.trim() || !activeConversation?.reportId) return false
    const reportId = activeConversation.reportId

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendSocketStopTyping(token, reportId)

    setSending(true)
    try {
      const confirmedMessage = await sendSocketMessage(token, {
        reportId,
        message: content,
      })

      const nowIso = new Date().toISOString()

      if (confirmedMessage) {
        const isOwn =
          profile?.id && String(confirmedMessage.senderId || confirmedMessage.sender_id) === String(profile.id)
        const newMsg = mapBackendMessageToUi({
          id: confirmedMessage.id,
          senderId: confirmedMessage.senderId || confirmedMessage.sender_id,
          content: confirmedMessage.message || confirmedMessage.content,
          message: confirmedMessage.message || confirmedMessage.content,
          createdAt: confirmedMessage.createdAt || confirmedMessage.created_at || nowIso,
          isRead: false,
          senderRole: isOwn ? 'admin' : 'citizen',
        })

        setMessages((current) => {
          if (current.some((m) => String(m.id) === String(newMsg.id))) return current
          return [...current, newMsg].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })
      } else {
        await loadMessages(reportId)
      }

      // Update preview & re-sort list to top
      setConversations((prev) => {
        const index = prev.findIndex((c) => String(c.reportId) === String(reportId))
        if (index === -1) return prev

        const updated = {
          ...prev[index],
          lastMessage: content,
          lastMessageAt: nowIso,
          lastMessageSenderRole: 'admin',
          unreadCount: 0,
        }

        const nextList = [...prev]
        nextList[index] = updated
        return sortConversations(nextList)
      })

      return true
    } catch (socketErr) {
      console.warn('Socket send failed, falling back to HTTP:', socketErr?.message)
      try {
        const response = await reportsApiService.sendReportMessage(token, reportId, content)
        const sent = mapBackendMessagesResponse(response)
        if (sent[0]) {
          setMessages((current) => {
            if (current.some((m) => String(m.id) === String(sent[0].id))) return current
            return [...current, sent[0]]
          })
        } else {
          await loadMessages(reportId)
        }

        setConversations((prev) => {
          const index = prev.findIndex((c) => String(c.reportId) === String(reportId))
          if (index === -1) return prev

          const updated = {
            ...prev[index],
            lastMessage: content,
            lastMessageAt: new Date().toISOString(),
            lastMessageSenderRole: 'admin',
            unreadCount: 0,
          }

          const nextList = [...prev]
          nextList[index] = updated
          return sortConversations(nextList)
        })

        return true
      } catch (err) {
        setChatError(err.message)
        return false
      }
    } finally {
      setSending(false)
    }
  }

  // Typing indicator trigger
  function handleComposerTyping() {
    if (activeConversation?.reportId && token) {
      sendSocketTyping(token, activeConversation.reportId)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        sendSocketStopTyping(token, activeConversation.reportId)
      }, 2000)
    }
  }

  // Filtered list
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.userName.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        c.reportNumber.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  // Unread total badge count
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  )

  const lastMessage = messages[messages.length - 1]
  const showSuggestions = activeConversation && (!lastMessage || lastMessage.senderRole !== 'admin')

  return (
    <main className="mx-auto max-w-[1600px] flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8" id="conversations-page">
      <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* LEFT PANEL — Conversations List */}
        <div
          className={`flex w-full flex-col border-r border-slate-200 md:w-[360px] md:shrink-0 lg:w-[380px] ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List Header */}
          <header className="shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900">Conversations</h1>
                {totalUnread > 0 && (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white font-numeric">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={loadConversations}
                disabled={conversationsLoading}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="Refresh conversations"
              >
                <FiRefreshCw className={conversationsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mt-3">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                aria-label="Search conversations"
                id="conversations-search"
              />
            </div>
          </header>

          {/* Conversation List Container */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {conversationsLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                    <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                      <div className="h-2.5 w-40 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationsError ? (
              <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-sm font-medium text-red-700">{conversationsError}</p>
                <button
                  type="button"
                  onClick={loadConversations}
                  className="mt-2 text-xs font-semibold text-red-600 underline hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              searchQuery ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No conversations matching "{searchQuery}"
                </div>
              ) : (
                <ConversationEmptyState variant="no-conversations" />
              )
            ) : (
              <div className="space-y-0.5">
                {filteredConversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation.reportId}
                    conversation={conversation}
                    isActive={activeConversation?.reportId === conversation.reportId}
                    onClick={() => handleSelectConversation(conversation)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Active Chat */}
        <div className={`flex flex-1 min-w-0 flex-col ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header with Presence */}
              <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-[#183b68] px-5 py-3.5 text-white">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/10 md:hidden"
                    aria-label="Back to conversations list"
                  >
                    <FiArrowLeft />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{activeConversation.userName}</h2>
                      {activeConversation.isOnline ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-blue-200">
                          {formatLastSeen(activeConversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-100">
                      Report {activeConversation.reportNumber || activeConversation.reportId}
                      {activeConversation.category ? ` · ${activeConversation.category}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onViewReport && (
                    <button
                      type="button"
                      onClick={() =>
                        onViewReport(mapBackendReportToUiRow(activeConversation.rawReport))
                      }
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
                      aria-label="View full report"
                    >
                      <FiFileText /> View Report
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      loadMessages(activeConversation.reportId)
                      fetchSuggestions(activeConversation.reportId)
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/10"
                    aria-label="Refresh chat"
                  >
                    <FiRefreshCw />
                  </button>
                </div>
              </header>

              {/* Chat Thread */}
              <ReportChatThread
                messages={messages}
                loading={chatLoading}
                error={chatError}
                profileId={profile?.id}
              />

              {/* Typing Indicator */}
              {isUserTyping && (
                <div className="px-4 py-1.5 bg-slate-100 text-xs italic text-slate-500 font-medium">
                  {activeConversation.userName} is typing...
                </div>
              )}

              {/* AI-Assisted Reply Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 border-t border-slate-200">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold tracking-wider">
                        <span>AI-ASSISTED REPLY SUGGESTIONS</span>
                        <button
                          type="button"
                          onClick={() => fetchSuggestions(activeConversation.reportId, true)}
                          disabled={suggestionsLoading}
                          className="flex items-center gap-1 hover:text-blue-600 transition disabled:opacity-50 text-[10px] text-slate-500 font-bold"
                        >
                          <FiRefreshCw className={suggestionsLoading ? 'animate-spin' : ''} /> REGENERATE
                        </button>
                      </div>
                      {suggestionsLoading ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          Generating suggestions...
                        </div>
                      ) : suggestions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => !sending && handleSend(suggestion.text)}
                              disabled={sending}
                              className={`flex flex-col justify-between text-left text-xs p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all text-slate-700 font-normal break-words [overflow-wrap:anywhere] shadow-2xs ${
                                idx === 0
                                  ? 'border-l-4 border-l-blue-600 font-medium text-slate-900 bg-blue-50/10'
                                  : ''
                              }`}
                            >
                              {idx === 0 && (
                                <span className="text-[9px] text-blue-600 font-bold block mb-1 uppercase tracking-wide">
                                  Recommended
                                </span>
                              )}
                              <span>{suggestion.text}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-slate-400">
                          No suggestions available.
                        </div>
                      )}
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>

              {/* Chat Composer */}
              <ReportChatComposer
                onSend={handleSend}
                onTyping={handleComposerTyping}
                disabled={sending || chatLoading}
                suggestionText=""
                onSuggestionUsed={() => {}}
              />
            </>
          ) : (
            <ConversationEmptyState variant="select" />
          )}
        </div>
      </div>
    </main>
  )
}
