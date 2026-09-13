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
    <div className="flex flex-col rounded-2xl border border-slate-100 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-800/30 p-4 sm:p-6 shadow-xs">
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
          <Icon className="text-lg sm:text-xl" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed wrap-break-word">
            {description}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2 font-numeric">
            {today}
          </p>
          
          <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3">
            {activeFilter !== 'All' && (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              >
                Show All
              </button>
            )}
            <button
              type="button"
              onClick={onNavigate}
              className="rounded-lg bg-blue-600 dark:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

