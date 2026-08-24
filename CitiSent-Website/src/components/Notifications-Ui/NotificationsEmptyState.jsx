import React from 'react'
import { FiBell, FiCheckCircle, FiInbox } from 'react-icons/fi'

export function NotificationsEmptyState({ activeFilter = 'All' }) {
  const isUnread = activeFilter === 'Unread'
  const isRead = activeFilter === 'Read'

  const Icon = isUnread ? FiCheckCircle : isRead ? FiInbox : FiBell

  const title = isUnread
    ? 'All caught up!'
    : isRead
    ? 'No read notifications'
    : 'No notifications found'

  const description = isUnread
    ? 'You have read all your notifications. New alerts will appear here.'
    : isRead
    ? 'Notifications you mark as read will be listed here.'
    : 'You currently have no notifications recorded.'

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 backdrop-blur-xs p-8 text-center shadow-xs">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 shadow-xs">
        <Icon className="text-xl text-slate-600" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  )
}
