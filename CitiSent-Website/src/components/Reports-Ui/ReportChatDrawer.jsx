import { useCallback, useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiRefreshCw, FiX } from 'react-icons/fi'
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
  }, [report.id, token])

  // Initial load
  useEffect(() => { load() }, [load])

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
      <div className="fixed inset-0 z-40 bg-slate-900/20" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Report chat">
        <header className="flex items-start justify-between border-b border-slate-200 bg-[#183b68] p-4 text-white">
          <div>
            <div className="flex items-center gap-2">
              <FiMessageCircle />
              <h2 className="font-semibold">Talk to User</h2>
            </div>
            <p className="mt-1 text-xs text-blue-100">Report {report.id} · {report.category}</p>
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

        <ReportChatComposer onSend={send} onTyping={handleComposerTyping} disabled={sending || loading} />
      </aside>
    </>
  )
}
