import { useCallback, useEffect, useRef, useState } from 'react'
import { FiLock, FiMessageCircle, FiRefreshCw, FiX } from 'react-icons/fi'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import { mapBackendMessagesResponse, mapBackendMessageToUi } from '../../services/api/admin/reportsApiMappers'
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

  const normalizedStatus = String(report?.status || '').toLowerCase()
  const isLocked = normalizedStatus === 'resolved' || normalizedStatus === 'rejected'



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
  }, [load])

  // Socket.IO Real-time Subscriptions
  useEffect(() => {
    if (!report?.id || !token) return

    const socket = getSocket(token)
    joinReportRoom(token, report.id)

    const handleReceiveMessage = (data) => {
      if (String(data?.reportId) !== String(report.id) || !data?.message) return

      const raw = data.message
      const isOwn = profile?.id && String(raw.senderId || raw.sender_id) === String(profile.id)
      


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
  }, [report.id, token, profile?.id])

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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full sm:max-w-md min-w-0 flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800" role="dialog" aria-modal="true" aria-label="Report chat">
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#0c1322] px-4 py-2.5 text-white gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <FiMessageCircle className="shrink-0 text-blue-400 text-xs" />
              <h2 className="font-semibold text-xs sm:text-sm truncate text-white">{report.email || report.name || 'User'}</h2>
              {report.isOnline ?? report.is_online ? (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="shrink-0 text-[10px] font-medium text-slate-400">
                  Offline
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400 font-mono flex items-center gap-1.5 min-w-0">
              <span className="truncate">Report {report.reportNum || (report.id ? `${String(report.id).slice(0, 8)}…` : '')}{report.category ? ` · ${report.category}` : ''}</span>
              {isLocked ? (
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${normalizedStatus === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {report.status || 'Locked'}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={load} className="rounded-lg p-2 sm:p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer" aria-label="Refresh conversation">
              <FiRefreshCw className="text-xs" />
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 sm:p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer" aria-label="Close chat">
              <FiX className="text-sm" />
            </button>
          </div>
        </header>

        <ReportChatThread messages={messages} loading={loading} error={error} profileId={profile?.id} />

        {!isLocked && isUserTyping && (
          <div className="px-4 py-1.5 bg-slate-100 text-xs italic text-slate-500 font-medium dark:bg-slate-800 dark:text-slate-400">
            User is typing...
          </div>
        )}

        {isLocked ? (
          <div className="border-t border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <FiLock className="text-sm text-slate-400" />
              <span>Report is {report.status || 'Locked'} · Chat History is Read-Only</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              This report is finalized. New messages cannot be sent.
            </p>
          </div>
        ) : (
          <ReportChatComposer
            onSend={send}
            onTyping={handleComposerTyping}
            disabled={sending || loading}
          />
        )}
      </aside>
    </>
  )
}
