import { FiCheck } from 'react-icons/fi'

/**
 * AVATAR_COLORS
 * A curated palette of background colors for initial-based user avatars.
 * The color is determined by hashing the user name to ensure consistency.
 */
const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
]

/**
 * Returns a deterministic color class based on a user's name.
 * The same name always produces the same color.
 */
function getAvatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * Returns the user's first initial (uppercase) for the avatar fallback.
 */
function getInitial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?'
}

/**
 * Formats a timestamp into a human-readable relative label:
 *   - Today:     "10:37 AM"
 *   - This week: "Thu"
 *   - Older:     "Aug 5"
 */
function formatConversationTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Same calendar day → show time
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  // Within the last 7 days → show short weekday
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }

  // Older → show "Mon DD" format
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/**
 * ConversationListItem
 * --------------------
 * A single conversation entry in the left sidebar list.
 *
 * Props:
 *   - conversation  — Normalized conversation object from the mapper.
 *   - isActive      — Whether this conversation is currently selected.
 *   - onClick       — Callback when the user clicks this item.
 *
 * Design matches the reference image: avatar with online dot, name,
 * last message preview (truncated), timestamp, and unread badge.
 */
export function ConversationListItem({ conversation, isActive, onClick }) {
  const {
    userName,
    lastMessage,
    lastMessageAt,
    lastMessageSenderRole,
    unreadCount,
    isOnline,
    category,
  } = conversation

  const colorClass = getAvatarColor(userName)
  const initial = getInitial(userName)
  const timeLabel = formatConversationTime(lastMessageAt)
  const hasUnread = unreadCount > 0

  // Build a preview string: prefix with "You: " if the last message was from admin
  const previewText =
    lastMessageSenderRole === 'admin'
      ? `You: ${lastMessage}`
      : lastMessage

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
        isActive
          ? 'bg-blue-50 shadow-sm ring-1 ring-blue-200/60'
          : 'hover:bg-slate-50'
      }`}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`Conversation with ${userName}`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
      )}

      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <div
          className={`grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-white ${colorClass}`}
        >
          {initial}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        )}
      </div>

      {/* Content: name, message preview, category */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm font-semibold ${
              hasUnread ? 'text-slate-900' : 'text-slate-700'
            }`}
          >
            {userName}
          </span>
          <span className="shrink-0 text-[11px] font-medium text-slate-400 font-numeric">
            {timeLabel}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs leading-relaxed ${
              hasUnread ? 'font-medium text-slate-700' : 'text-slate-500'
            }`}
          >
            {previewText || 'No messages yet'}
            {/* Read check for admin's own last message */}
            {lastMessageSenderRole === 'admin' && !hasUnread && lastMessage && (
              <FiCheck className="ml-1 inline text-blue-500" aria-label="Sent" />
            )}
          </p>

          {/* Unread badge */}
          {hasUnread ? (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white font-numeric">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </div>

        {/* Category tag */}
        {category && (
          <span className="mt-1 inline-block max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {category}
          </span>
        )}
      </div>
    </button>
  )
}
