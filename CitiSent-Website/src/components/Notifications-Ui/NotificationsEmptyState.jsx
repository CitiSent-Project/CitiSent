import React from 'react'
import { FiBell, FiCheckCircle, FiInbox } from 'react-icons/fi'

export function NotificationsEmptyState({ activeFilter = 'All', onDismiss, onNavigate }) {
  const isUnread = activeFilter === 'Unread'
  const isRead = activeFilter === 'Read'

  const Icon = isUnread ? FiCheckCircle : isRead ? FiInbox : FiBell

  const title = isUnread
    ? "You're all caught up!"
    : isRead
    ? 'No read notifications'
    : 'No notifications found'

  const description = isUnread
    ? 'You have read all your notifications. New alerts will appear here.'
    : isRead
    ? 'Notifications you mark as read will be listed here.'
    : 'There are no recent notifications or alerts to display at this time.'

  // Formatting current date like "Feb 4"
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col rounded-xl border border-blue-100 bg-blue-50/30 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600">
          <Icon className="text-xl" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-[15px] font-medium text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
          <p className="text-[11px] font-semibold text-slate-400 mt-2">{today}</p>
          
          <div className="mt-4 flex items-center gap-3">
            {activeFilter !== 'All' && (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Dismiss
              </button>
            )}
            <button
              type="button"
              onClick={onNavigate}
              className="rounded-md bg-yellow-400 px-4 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
