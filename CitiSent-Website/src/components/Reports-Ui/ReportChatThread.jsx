import { useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiChevronDown } from 'react-icons/fi'
import { ReportChatMessageItem } from './ReportChatMessageItem'

export function ReportChatThread({ messages = [], loading = false, error = '', profileId = '' }) {
  const containerRef = useRef(null)
  const endRef = useRef(null)
  const [unreadNewCount, setUnreadNewCount] = useState(0)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const prevMessagesLengthRef = useRef(messages.length)

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    if (endRef.current && typeof endRef.current.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior })
      setUnreadNewCount(0)
    }
  }

  // Handle scroll events to detect if user is near bottom
  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const atBottom = distanceFromBottom < 80
    setIsNearBottom(atBottom)

    if (atBottom) {
      setUnreadNewCount(0)
    }
  }

  // Auto-scroll logic when new messages arrive
  useEffect(() => {
    const isInitialLoad = prevMessagesLengthRef.current === 0 && messages.length > 0
    const hasNewMessage = messages.length > prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    if (isInitialLoad) {
      if (endRef.current && typeof endRef.current.scrollIntoView === 'function') {
        endRef.current.scrollIntoView({ behavior: 'auto' })
      }
      return
    }

    if (hasNewMessage) {
      const lastMessage = messages[messages.length - 1]
      const isOwnMessage = lastMessage && String(lastMessage.senderId) === String(profileId)

      if (isOwnMessage || isNearBottom) {
        if (endRef.current && typeof endRef.current.scrollIntoView === 'function') {
          endRef.current.scrollIntoView({ behavior: 'smooth' })
        }
        setTimeout(() => setUnreadNewCount(0), 0)
      } else {
        setTimeout(() => setUnreadNewCount((prev) => prev + 1), 0)
      }
    }
  }, [messages, profileId, isNearBottom])

  if (loading) {
    return (
      <div className="grid flex-1 place-items-center text-sm text-slate-500">
        Loading conversation...
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="grid flex-1 place-items-center p-8 text-center text-slate-500">
        <FiMessageCircle className="mb-2 text-3xl text-slate-300" />
        <p className="text-sm font-medium">No messages yet.</p>
        <p className="text-xs text-slate-400">Start the conversation with the report owner.</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 min-w-0 flex-col overflow-hidden">
      {/* Scrollable Message List */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 min-w-0"
      >
        {messages.map((message) => (
          <ReportChatMessageItem
            key={message.id}
            message={message}
            isAdmin={String(message.senderId) === String(profileId)}
          />
        ))}
        <div ref={endRef} />
      </div>

      {/* Floating New Message Indicator */}
      {unreadNewCount > 0 && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-blue-700 active:scale-95"
          aria-label="Scroll to new messages"
        >
          <FiChevronDown className="text-sm animate-bounce" />
          <span>
            {unreadNewCount} New {unreadNewCount === 1 ? 'message' : 'messages'}
          </span>
        </button>
      )}
    </div>
  )
}
