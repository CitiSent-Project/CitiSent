import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiMessageCircle,
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

// ─── Socket services (reuses the same socket layer as ReportChatDrawer) ───────
import {
  getSocket,
  joinReportRoom,
  leaveReportRoom,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Reads the admin access token from localStorage using the same
 * schema-backed approach that ReportDetailPage uses.
 */
function readAccessToken() {
  const rule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
  return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', rule)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ConversationsPage
// ═══════════════════════════════════════════════════════════════════════════════
//
// Full-page split-panel messaging interface for admins.
//
// Left panel  → scrollable conversation list with search
// Right panel → active chat thread with composer & AI suggestions
//
// Props:
//   profile      — Admin profile object (id, fullName, etc.)
//   onViewReport — Callback to navigate to the ReportDetailPage for a report.
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

  // ── Chat Thread State (for the selected conversation) ─────────────────────
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [sending, setSending] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)
  const typingTimerRef = useRef(null)

  // ── AI Suggestions State ──────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // ── Mobile: toggle between list and chat views ────────────────────────────
  const [mobileShowChat, setMobileShowChat] = useState(false)

  // ── Ref to the previously joined socket room ──────────────────────────────
  const prevRoomRef = useRef(null)

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Load Conversations List
  // ─────────────────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token) return
    setConversationsLoading(true)
    setConversationsError('')
    try {
      const response = await reportsApiService.listConversations(token)
      setConversations(mapBackendConversationsResponse(response))
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setConversationsError(err.message || 'Failed to load conversations')
      setConversations([])
    } finally {
      setConversationsLoading(false)
    }
  }, [token])

  // Initial fetch
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Load Messages for the active conversation
  // ─────────────────────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (reportId) => {
    if (!reportId || !token) return
    setChatLoading(true)
    setChatError('')
    try {
      const response = await reportsApiService.listReportMessages(token, reportId)
      setMessages(mapBackendMessagesResponse(response))
      // Mark messages as read
      await reportsApiService.markReportMessagesRead(token, reportId)
      markSocketConversationRead(token, { reportId })
      // Clear the unread count in the conversation list for this report
      setConversations((prev) =>
        prev.map((c) => (c.reportId === reportId ? { ...c, unreadCount: 0 } : c))
      )
    } catch (err) {
      setChatError(err.message)
    } finally {
      setChatLoading(false)
    }
  }, [token])

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Fetch AI Reply Suggestions
  // ─────────────────────────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (reportId, force = false) => {
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
  }, [token])

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Select a conversation
  // ─────────────────────────────────────────────────────────────────────────
  function handleSelectConversation(conversation) {
    // Leave the previous socket room (if any)
    if (prevRoomRef.current && token) {
      leaveReportRoom(token, prevRoomRef.current)
    }

    setActiveConversation(conversation)
    setMessages([])
    setSuggestions([])
    setIsUserTyping(false)
    setMobileShowChat(true)

    loadMessages(conversation.reportId)
    fetchSuggestions(conversation.reportId)
    prevRoomRef.current = conversation.reportId
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Socket.IO Real-Time Subscriptions
  //    (mirrors the approach in ReportChatDrawer)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeConversation?.reportId || !token) return

    const reportId = activeConversation.reportId
    const socket = getSocket(token)
    joinReportRoom(token, reportId)

    const handleReceiveMessage = (data) => {
      if (String(data?.reportId) !== String(reportId) || !data?.message) return

      const raw = data.message
      const isOwn = profile?.id && String(raw.senderId || raw.sender_id) === String(profile.id)

      if (!isOwn) {
        fetchSuggestions(reportId, false)
      }

      const newMsg = mapBackendMessageToUi({
        id: raw.id,
        senderId: raw.senderId || raw.sender_id,
        content: raw.message || raw.content,
        message: raw.message || raw.content,
        createdAt: raw.createdAt || raw.created_at,
        isRead: false,
        senderRole: isOwn ? 'admin' : 'citizen',
      })

      setMessages((current) => {
        if (current.some((m) => String(m.id) === String(newMsg.id))) return current
        return [...current, newMsg].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      })

      // Update the last message preview in the conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.reportId === reportId
            ? {
                ...c,
                lastMessage: newMsg.content,
                lastMessageAt: newMsg.createdAt,
                lastMessageSenderRole: newMsg.senderRole,
              }
            : c
        )
      )
    }

    const handleMessagesRead = (data) => {
      if (String(data?.reportId) !== String(reportId)) return
      setMessages((current) => current.map((msg) => ({ ...msg, isRead: true })))
    }

    const handleTyping = (data) => {
      if (String(data?.reportId) === String(reportId) && String(data?.userId) !== String(profile?.id)) {
        setIsUserTyping(true)
      }
    }

    const handleStopTyping = (data) => {
      if (String(data?.reportId) === String(reportId) && String(data?.userId) !== String(profile?.id)) {
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
      leaveReportRoom(token, reportId)
    }
  }, [activeConversation?.reportId, token, profile?.id, fetchSuggestions])

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Send a message (socket-first with HTTP fallback)
  // ─────────────────────────────────────────────────────────────────────────
  async function handleSend(content) {
    if (!content.trim() || !activeConversation?.reportId) return false
    const reportId = activeConversation.reportId

    // Stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendSocketStopTyping(token, reportId)

    setSending(true)
    try {
      const confirmedMessage = await sendSocketMessage(token, {
        reportId,
        message: content,
      })

      if (confirmedMessage) {
        const isOwn = profile?.id && String(confirmedMessage.senderId || confirmedMessage.sender_id) === String(profile.id)
        const newMsg = mapBackendMessageToUi({
          id: confirmedMessage.id,
          senderId: confirmedMessage.senderId || confirmedMessage.sender_id,
          content: confirmedMessage.message || confirmedMessage.content,
          message: confirmedMessage.message || confirmedMessage.content,
          createdAt: confirmedMessage.createdAt || confirmedMessage.created_at,
          isRead: false,
          senderRole: isOwn ? 'admin' : 'citizen',
        })

        setMessages((current) => {
          if (current.some((m) => String(m.id) === String(newMsg.id))) return current
          return [...current, newMsg].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })

        // Update the conversation list preview
        setConversations((prev) =>
          prev.map((c) =>
            c.reportId === reportId
              ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString(), lastMessageSenderRole: 'admin' }
              : c
          )
        )
      } else {
        await loadMessages(reportId)
      }
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
        return true
      } catch (err) {
        setChatError(err.message)
        return false
      }
    } finally {
      setSending(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Typing Indicator
  // ─────────────────────────────────────────────────────────────────────────
  function handleComposerTyping() {
    if (activeConversation?.reportId && token) {
      sendSocketTyping(token, activeConversation.reportId)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        sendSocketStopTyping(token, activeConversation.reportId)
      }, 2000)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Filtered conversations list
  // ─────────────────────────────────────────────────────────────────────────
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

  // Count total unread across all conversations
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  )

  // Should AI suggestions be shown? (only if last message is NOT from admin)
  const lastMessage = messages[messages.length - 1]
  const showSuggestions = activeConversation && (!lastMessage || lastMessage.senderRole !== 'admin')

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-[1600px] flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8" id="conversations-page">
      <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT PANEL — Conversations List
            ═══════════════════════════════════════════════════════════════════ */}
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
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white font-numeric">
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

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {conversationsLoading ? (
              // Loading skeleton
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

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT PANEL — Active Chat
            ═══════════════════════════════════════════════════════════════════ */}
        <div
          className={`flex flex-1 flex-col ${
            mobileShowChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-[#183b68] px-5 py-3.5 text-white">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/10 md:hidden"
                    aria-label="Back to conversations list"
                  >
                    <FiArrowLeft />
                  </button>

                  {/* User info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{activeConversation.userName}</h2>
                      {activeConversation.isOnline && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400" title="Online" />
                      )}
                    </div>
                    <p className="text-xs text-blue-100">
                      Report {activeConversation.reportNumber || activeConversation.reportId}
                      {activeConversation.category ? ` · ${activeConversation.category}` : ''}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
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

              {/* Chat Thread (reuses the existing component) */}
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

              {/* AI-Assisted Reply Suggestions (same pattern as ReportChatDrawer) */}
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
                        <div className="py-4 text-center text-xs text-slate-400">Generating suggestions...</div>
                      ) : suggestions.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => !sending && handleSend(suggestion.text)}
                              disabled={sending}
                              className={`text-left text-xs p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition text-slate-700 font-normal ${
                                idx === 0 ? 'border-l-4 border-l-blue-600 font-medium text-slate-900 bg-blue-50/5' : ''
                              }`}
                            >
                              {idx === 0 && (
                                <span className="text-[9px] text-blue-600 font-bold block mb-0.5 uppercase tracking-wide">
                                  Recommended
                                </span>
                              )}
                              {suggestion.text}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-slate-400">No suggestions available.</div>
                      )}
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>

              {/* Chat Composer (reuses the existing component) */}
              <ReportChatComposer
                onSend={handleSend}
                onTyping={handleComposerTyping}
                disabled={sending || chatLoading}
                suggestionText=""
                onSuggestionUsed={() => {}}
              />
            </>
          ) : (
            /* No conversation selected — show the "select" empty state */
            <ConversationEmptyState variant="select" />
          )}
        </div>
      </div>
    </main>
  )
}
