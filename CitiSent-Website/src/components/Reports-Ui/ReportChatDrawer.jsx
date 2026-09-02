import { useCallback, useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiRefreshCw, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import { mapBackendMessagesResponse, mapBackendMessageToUi, mapBackendSuggestionsToUi } from '../../services/api/admin/reportsApiMappers'
import { ReportChatThread } from './ReportChatThread'
import { ReportChatComposer } from './ReportChatComposer'
import {
  getSocket,
  joinReportRoom,
  leaveReportRoom,
  sendSocketMessage,
  markSocketConversationRead,
  sendSocketTyping,
  sendSocketStopTyping,
} from '../../services/socket/socketService'

export function ReportChatDrawer({ report, profile, token, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [isUserTyping, setIsUserTyping] = useState(false)
  const typingTimerRef = useRef(null)

  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionText, setSuggestionText] = useState('')
  const [isSuggestionsMinimized, setIsSuggestionsMinimized] = useState(false)

  const fetchSuggestions = useCallback(async (force = false) => {
    if (!report?.id || !token) return
    setSuggestionsLoading(true)
    try {
      const res = await reportsApiService.getReportChatSuggestions(token, report.id, force)
      const mapped = mapBackendSuggestionsToUi(res)
      setSuggestions(mapped.suggestedReplies || [])
    } catch (err) {
      console.error('Failed to load chat suggestions:', err)
      setSuggestions([
        { text: "Thank you for reaching out. We have received your message and are looking into it.", rank: 1 },
        { text: "Could you please provide more details or clarify your request?", rank: 2 },
        { text: "We are currently reviewing this issue and will update you as soon as possible.", rank: 3 },
        { text: "If this is an immediate emergency, please contact our direct hotline or emergency services.", rank: 4 }
      ])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [report?.id, token])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reportsApiService.listReportMessages(token, report.id)
      setMessages(mapBackendMessagesResponse(response))
      await reportsApiService.markReportMessagesRead(token, report.id)
      markSocketConversationRead(token, { reportId: report.id })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [report?.id, token])

  // Initial load
  useEffect(() => {
    load()
    fetchSuggestions()
  }, [load, fetchSuggestions])

  // Socket.IO Real-time Subscriptions
  useEffect(() => {
    if (!report?.id || !token) return

    const socket = getSocket(token)
    joinReportRoom(token, report.id)

    const handleReceiveMessage = (data) => {
      if (String(data?.reportId) !== String(report.id) || !data?.message) return

      const raw = data.message
      const isOwn = profile?.id && String(raw.senderId || raw.sender_id) === String(profile.id)
      
      if (!isOwn) {
        fetchSuggestions(false)
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
    }

    const handleMessagesRead = (data) => {
      if (String(data?.reportId) !== String(report.id)) return
      setMessages((current) =>
        current.map((msg) => ({
          ...msg,
          isRead: true,
        }))
      )
    }

    const handleTyping = (data) => {
      if (String(data?.reportId) === String(report.id) && String(data?.userId) !== String(profile?.id)) {
        setIsUserTyping(true)
      }
    }

    const handleStopTyping = (data) => {
      if (String(data?.reportId) === String(report.id) && String(data?.userId) !== String(profile?.id)) {
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
      leaveReportRoom(token, report.id)
    }
  }, [report.id, token, profile?.id, fetchSuggestions])

  async function send(content) {
    if (!content.trim() || !report?.id) return false

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendSocketStopTyping(token, report.id)

    setSending(true)
    try {
      const confirmedMessage = await sendSocketMessage(token, {
        reportId: report.id,
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
      } else {
        await load()
      }
      return true
    } catch (socketErr) {
      console.warn('Socket send failed, falling back to HTTP API:', socketErr?.message)
      try {
        const response = await reportsApiService.sendReportMessage(token, report.id, content)
        const sent = mapBackendMessagesResponse(response)
        if (sent[0]) {
          setMessages((current) => {
            if (current.some((m) => String(m.id) === String(sent[0].id))) return current
            return [...current, sent[0]]
          })
        } else {
          await load()
        }
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    } finally {
      setSending(false)
    }
  }

  function handleComposerTyping() {
    if (report?.id && token) {
      sendSocketTyping(token, report.id)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        sendSocketStopTyping(token, report.id)
      }, 2000)
    }
  }

  const lastMessage = messages[messages.length - 1]
  const showSuggestions = !lastMessage || lastMessage.senderRole !== 'admin'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/20 dark:bg-slate-900/60" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full sm:max-w-md min-w-0 flex-col bg-white dark:bg-slate-900 shadow-2xl dark:shadow-slate-900/50" role="dialog" aria-modal="true" aria-label="Report chat">
        <header className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 bg-[#183b68] dark:bg-slate-950 p-4 text-white">
          <div>
            <div className="flex items-center gap-2">
              <FiMessageCircle />
              <h2 className="font-semibold">{report.name || 'Talk to User'}</h2>
              {report.isOnline ?? report.is_online ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="text-[11px] font-medium text-blue-200">
                  Offline
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-blue-100">
              Report {report.reportNum || report.id} · {report.category}
            </p>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={load} className="rounded-lg p-2 hover:bg-white/10" aria-label="Refresh conversation">
              <FiRefreshCw />
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close chat">
              <FiX />
            </button>
          </div>
        </header>

        <ReportChatThread messages={messages} loading={loading} error={error} profileId={profile?.id} />

        {isUserTyping && (
          <div className="px-4 py-1.5 bg-slate-100 text-xs italic text-slate-500 font-medium">
            User is typing...
          </div>
        )}

        {/* AI-Assisted Reply Suggestions */}
        {showSuggestions && (
          <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider">
              <button 
                type="button" 
                onClick={() => setIsSuggestionsMinimized(prev => !prev)}
                className="flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition"
                aria-label={isSuggestionsMinimized ? "Expand suggestions" : "Minimize suggestions"}
              >
                {isSuggestionsMinimized ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}
                <span>AI-ASSISTED REPLY SUGGESTIONS</span>
              </button>
              
              {!isSuggestionsMinimized && (
                <button
                  type="button"
                  onClick={() => fetchSuggestions(true)}
                  disabled={suggestionsLoading}
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition disabled:opacity-50 text-[10px] text-slate-500 dark:text-slate-400 font-bold"
                >
                  <FiRefreshCw className={suggestionsLoading ? 'animate-spin' : ''} /> REGENERATE
                </button>
              )}
            </div>

            {!isSuggestionsMinimized && (
              suggestionsLoading ? (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Generating suggestions...</div>
              ) : suggestions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !sending && send(suggestion.text)}
                      disabled={sending}
                      className={`flex flex-col justify-between text-left text-xs p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-all text-slate-700 dark:text-slate-300 font-normal wrap-break-word shadow-2xs ${
                        idx === 0 ? 'border-l-4 border-l-blue-600 dark:border-l-blue-500 font-medium text-slate-900 dark:text-white bg-blue-50/10 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      {idx === 0 && <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block mb-1 uppercase tracking-wide">Recommended</span>}
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">No suggestions available.</div>
              )
            )}
          </div>
        )}

        <ReportChatComposer
          onSend={send}
          onTyping={handleComposerTyping}
          disabled={sending || loading}
          suggestionText={suggestionText}
          onSuggestionUsed={() => setSuggestionText('')}
        />
      </aside>
    </>
  )
}
