import React from 'react'
import {
  FiAlertCircle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiMessageSquare,
  FiUserCheck,
} from 'react-icons/fi'
import { formatDateTime } from '../../models/data'

function getNotificationTypeBadge(type = '') {
  const lower = String(type).toLowerCase()
  if (lower.includes('account') || lower.includes('invitation')) {
    return {
      icon: FiUserCheck,
      badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40',
    }
  }
  if (lower.includes('report') || lower.includes('urgent')) {
    return {
      icon: FiAlertCircle,
      badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40',
    }
  }
  if (lower.includes('chat') || lower.includes('message')) {
    return {
      icon: FiMessageSquare,
      badgeClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40',
    }
  }
  return {
    icon: FiBell,
    badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
  }
}

export function NotificationItem({ notification, onToggleRead, onClick, children }) {
  const isUnread = !notification.read
  const isClickable = typeof onClick === 'function'
  const { icon: TypeIcon, badgeClass } = getNotificationTypeBadge(notification.type)

  return (
    <article
      className={`group relative flex items-start gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-3.5 py-4 sm:px-5 sm:py-4.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
        isUnread ? 'bg-slate-50/40 dark:bg-slate-800/40' : ''
      } ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      aria-label={isClickable ? `${notification.title} — click to view` : undefined}
    >
      {/* Icon badge */}
      <div
        className={`grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full shadow-2xs ${badgeClass}`}
      >
        <TypeIcon className="text-base sm:text-lg" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Title and Read Toggle Button row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1">
            <h4
              className={`text-xs sm:text-sm leading-snug break-words ${
                isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-800 dark:text-slate-200'
              }`}
            >
              {notification.title}
            </h4>
            {isUnread && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </div>

          {/* Toggle Read Button - pinned at top right */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleRead(notification.id)
            }}
            aria-label={isUnread ? 'Mark notification as read' : 'Mark notification as unread'}
            className={`inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/20 shrink-0 ${
              isUnread ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60' : ''
            }`}
            title={isUnread ? 'Mark as read' : 'Mark as unread'}
          >
            {isUnread ? (
              <FiCheck className="text-base sm:text-lg" />
            ) : (
              <FiCheckCircle className="text-base sm:text-lg" />
            )}
          </button>
        </div>

        {/* Notification Message */}
        <p
          className={`mt-1 text-xs sm:text-sm leading-relaxed break-words ${
            isUnread ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {notification.message}
        </p>

        {/* Timestamp and metadata */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-numeric text-slate-400 dark:text-slate-500">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <FiClock className="text-xs shrink-0" />
            <span>{formatDateTime(notification.createdAt)}</span>
          </span>
          <span>•</span>
          <span className="whitespace-nowrap capitalize">{notification.type || 'Notification'}</span>
          {isClickable && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">
                View <FiExternalLink className="text-[10px]" />
              </span>
            </>
          )}
        </div>

        {/* Subcontent (children) */}
        {children ? <div className="mt-2.5">{children}</div> : null}
      </div>
    </article>
  )
}
