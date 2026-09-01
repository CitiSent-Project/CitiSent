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
      badgeClass: 'bg-emerald-50 text-emerald-600',
    }
  }
  if (lower.includes('report') || lower.includes('urgent')) {
    return {
      icon: FiAlertCircle,
      badgeClass: 'bg-amber-50 text-amber-600',
    }
  }
  if (lower.includes('chat') || lower.includes('message')) {
    return {
      icon: FiMessageSquare,
      badgeClass: 'bg-blue-50 text-blue-600',
    }
  }
  return {
    icon: FiBell,
    badgeClass: 'bg-slate-100 text-slate-500',
  }
}

/**
 * Renders a single notification entry in the drawer.
 *
 * @param {object}   props
 * @param {object}   props.notification  - The notification data object.
 * @param {Function} props.onToggleRead  - Callback to mark read/unread.
 * @param {Function} [props.onClick]     - Optional: when provided, makes the
 *                                         card body clickable (e.g. navigate to
 *                                         the Conversations page for message
 *                                         notifications). The read-toggle button
 *                                         always stops propagation so it does not
 *                                         trigger this callback.
 * @param {React.ReactNode} [props.children] - Optional sub-content (e.g. InvitationStatusLog).
 */
export function NotificationItem({ notification, onToggleRead, onClick, children }) {
  const isUnread = !notification.read
  const isClickable = typeof onClick === 'function'
  const { icon: TypeIcon, badgeClass } = getNotificationTypeBadge(notification.type)

  return (
    <article
      className={`group relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 bg-white px-4 py-5 transition-colors hover:bg-slate-50/50 ${
        isUnread ? 'bg-slate-50/30' : ''
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
      <div className="flex flex-1 min-w-0 items-start gap-4">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${badgeClass}`}
        >
          <TypeIcon className="text-lg" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm text-slate-900 ${isUnread ? 'font-bold' : 'font-medium'}`}>
              {notification.title}
            </h4>
            {isUnread && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
            )}
          </div>

          <p className={`text-sm leading-relaxed wrap-break-word ${isUnread ? 'text-slate-700' : 'text-slate-500'}`}>
            {notification.message}
          </p>

          <div className="flex items-center gap-1.5 pt-1 text-[11px] font-numeric text-slate-400">
            <FiClock className="text-xs" />
            <span>{formatDateTime(notification.createdAt)}</span>
            <span className="mx-1">•</span>
            <span>{notification.type || 'Notification'}</span>
            {isClickable && (
              <>
                <span className="mx-1">•</span>
                <span className="inline-flex items-center gap-0.5 text-blue-500 font-semibold">
                  View <FiExternalLink className="text-[10px]" />
                </span>
              </>
            )}
          </div>
          
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
      </div>

      <div
        className="flex items-center sm:self-start shrink-0 ml-14 sm:ml-0"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleRead(notification.id)}
          aria-label={isUnread ? 'Mark notification as read' : 'Mark notification as unread'}
          className={`inline-flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
            isUnread ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700' : ''
          }`}
          title={isUnread ? 'Mark as read' : 'Mark as unread'}
        >
          {isUnread ? (
            <FiCheck className="text-lg" />
          ) : (
            <FiCheckCircle className="text-lg" />
          )}
        </button>
      </div>
    </article>
  )
}
