import { FiCheck } from 'react-icons/fi'

/**
 * AVATAR_COLORS
 * Curated background colors for initial-based user avatars.
 */
const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-blue-600', 'bg-teal-600',
]

function getAvatarColor(key = '') {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatReportTitle(conversation = {}) {
  const { reportNumber, reportNum, reportId, id } = conversation
  const rawId = String(reportNumber || reportNum || reportId || id || '').trim()
  if (!rawId) return 'Report'
  if (rawId.toLowerCase().startsWith('report')) return rawId
  if (rawId.startsWith('#')) return `Report ${rawId}`
  const displayId = rawId.length > 12 ? `${rawId.slice(0, 8)}…` : rawId
  return `Report #${displayId}`
}

function getInitial(conversation = {}) {
  const { reportNumber, reportNum, reportId, userName } = conversation
  const idStr = String(reportNumber || reportNum || reportId || '').trim()
  if (idStr) {
    const match = idStr.match(/[a-zA-Z0-9]/)
    if (match) return match[0].toUpperCase()
  }
  return userName?.trim().charAt(0).toUpperCase() || '#'
}

/**
 * Formats a date into relative compact labels:
 *   - < 1 min: "Now"
 *   - < 60 mins: "12m"
 *   - < 24 hrs: "3h"
 *   - Yesterday: "Yesterday"
 *   - < 7 days: "Thu"
 *   - Older: "Aug 5"
 */
function formatConversationTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24 && date.getDate() === now.getDate()) return `${diffHours}h`
  if (diffDays === 1 || (diffHours < 48 && date.getDate() !== now.getDate())) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ConversationListItem({ conversation, isActive, onClick }) {
  const {
    userName,
    reportId,
    reportNumber,
    lastMessage,
    lastMessageAt,
    lastMessageSenderRole,
    unreadCount = 0,
    isOnline,
    category,
  } = conversation || {}

  const reportTitle = formatReportTitle(conversation)
  const avatarKey = String(reportNumber || reportId || userName || '')
  const colorClass = getAvatarColor(avatarKey)
  const initial = getInitial(conversation)
  const timeLabel = formatConversationTime(lastMessageAt)
  const hasUnread = unreadCount > 0

  // Message preview logic
  let previewText = 'No messages yet'
  if (lastMessage) {
    previewText = lastMessageSenderRole === 'admin' ? `You: ${lastMessage}` : lastMessage
  }

  const ariaLabel = hasUnread
    ? `${reportTitle}${userName ? ` from ${userName}` : ''} — ${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`
    : `${reportTitle}${userName ? ` from ${userName}` : ''}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
        isActive
          ? 'bg-blue-50/90 dark:bg-blue-900/30 shadow-sm ring-1 ring-blue-200/80 dark:ring-blue-500/30'
          : hasUnread
          ? 'bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/60 dark:hover:bg-blue-900/20'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
      }`}
      aria-current={isActive ? 'true' : undefined}
      aria-label={ariaLabel}
    >
      {/* Active accent bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
      )}

      {/* Avatar with online dot indicator */}
      <div className="relative shrink-0">
        <div
          className={`grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-white ${colorClass}`}
        >
          {initial}
        </div>
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500"
            title="Online"
          />
        )}
      </div>

      {/* Content: Report title, preview, timestamp, unread badge, category & reporter */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm font-numeric ${
              hasUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'
            }`}
          >
            {reportTitle}
          </span>
          <span
            className={`shrink-0 text-[11px] font-numeric ${
              hasUnread ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-medium text-slate-400 dark:text-slate-500'
            }`}
          >
            {timeLabel}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs leading-relaxed ${
              hasUnread ? 'font-medium text-slate-900 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {previewText}
            {lastMessageSenderRole === 'admin' && !hasUnread && lastMessage && (
              <FiCheck className="ml-1 inline text-blue-500 dark:text-blue-400 text-[11px]" aria-label="Sent" />
            )}
          </p>

          {/* Subtle Unread Badge */}
          {hasUnread && (
            <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white font-numeric">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {unreadCount > 1 ? unreadCount : ''}
            </span>
          )}
        </div>

        {/* Category tag & Reporter info */}
        <div className="mt-1 flex items-center gap-1.5 overflow-hidden text-[10px]">
          {category && (
            <span className="inline-block max-w-[55%] truncate rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-medium text-slate-500 dark:text-slate-400">
              {category}
            </span>
          )}
          {userName && (
            <span className="truncate text-slate-400 dark:text-slate-500" title={userName}>
              {category ? '· ' : ''}{userName}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
