import React from 'react'
import {
  FiAlertCircle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiUserCheck,
} from 'react-icons/fi'
import { formatDateTime } from '../../models/data'

function getNotificationTypeBadge(type = '') {
  const lower = String(type).toLowerCase()
  if (lower.includes('account') || lower.includes('invitation')) {
    return {
      icon: FiUserCheck,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    }
  }
  if (lower.includes('report') || lower.includes('urgent')) {
    return {
      icon: FiAlertCircle,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    }
  }
  if (lower.includes('chat') || lower.includes('message')) {
    return {
      icon: FiMessageSquare,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    }
  }
  return {
    icon: FiBell,
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/80',
  }
}

export function NotificationItem({ notification, onToggleRead, children }) {
  const isUnread = !notification.read
  const { icon: TypeIcon, badgeClass } = getNotificationTypeBadge(notification.type)

  return (
    <article
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isUnread
          ? 'border-blue-200/80 bg-blue-50/20 shadow-xs hover:border-blue-300 hover:bg-blue-50/30'
          : 'border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm'
      } p-4 md:p-5`}
    >
      {/* Unread Accent Bar */}
      {isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-600" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm ${badgeClass}`}
          >
            <TypeIcon />
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                {notification.title}
              </h4>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${badgeClass}`}
              >
                {notification.type || 'Notification'}
              </span>
              {isUnread && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  New
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed break-words">
              {notification.message}
            </p>

            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-numeric">
              <FiClock className="text-slate-400 text-xs" />
              <span>{formatDateTime(notification.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center sm:self-start shrink-0">
          <button
            type="button"
            onClick={() => onToggleRead(notification.id)}
            aria-label={isUnread ? 'Mark notification as read' : 'Mark notification as unread'}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
              isUnread
                ? 'border-blue-200 bg-white text-blue-700 shadow-xs hover:border-blue-300 hover:bg-blue-50'
                : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isUnread ? (
              <>
                <FiCheck className="text-blue-600" />
                <span>Mark read</span>
              </>
            ) : (
              <>
                <FiCheckCircle className="text-slate-400" />
                <span>Mark unread</span>
              </>
            )}
          </button>
        </div>
      </div>

      {children ? <div className="mt-3.5 border-t border-slate-100 pt-3">{children}</div> : null}
    </article>
  )
}
