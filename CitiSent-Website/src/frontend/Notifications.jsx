import { useMemo, useState } from 'react'
import {
  NotificationFilterChips,
  NotificationItem,
  NotificationsEmptyState,
} from '../components/Notifications-Ui'

export function Notifications({ notifications, onToggleRead, onClearAll }) {
  const [filter, setFilter] = useState('All')

  const visibleNotifications = useMemo(() => {
    if (filter === 'Unread') {
      return notifications.filter((notification) => !notification.read)
    }

    if (filter === 'Read') {
      return notifications.filter((notification) => notification.read)
    }

    return notifications
  }, [notifications, filter])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-600">
              Keep track of reports, account updates, and important admin actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
              {unreadCount} unread
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-lg border border-blue-900 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 transition hover:bg-blue-50"
            >
              Clear all
            </button>
          </div>
        </header>

        <NotificationFilterChips activeFilter={filter} onFilterChange={setFilter} />

        <section className="space-y-3">
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onToggleRead={onToggleRead}
              />
            ))
          ) : (
            <NotificationsEmptyState />
          )}
        </section>
      </div>
    </main>
  )
}
