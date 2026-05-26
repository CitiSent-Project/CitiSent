import { useMemo, useState } from 'react'
import {
  NotificationFilterChips,
  NotificationItem,
  NotificationsEmptyState,
} from '../../components/Notifications-Ui'

function getInvitationMetadata(notification) {
  const metadata = notification?.metadata || notification?.meta?.invitation
  return metadata?.kind === 'accountInvitation' ? metadata : null
}

function InvitationStatusLog({ metadata }) {
  const isActive = metadata?.status === 'active'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {isActive ? 'Active' : 'Pending'}
        </span>
        <span className="text-sm font-medium text-slate-700">
          {metadata?.email || 'Account invitation'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {isActive
          ? 'The user has completed password setup.'
          : 'The setup email was sent and is waiting for the user to activate their account.'}
      </p>
    </div>
  )
}

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
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800 font-numeric">
              {unreadCount} unread
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Clear all
            </button>
          </div>
        </header>

        <NotificationFilterChips activeFilter={filter} onFilterChange={setFilter} />

        <section className="space-y-3">
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((notification) => {
              const invitationMetadata = getInvitationMetadata(notification)

              return (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onToggleRead={onToggleRead}
                >
                  {invitationMetadata ? (
                    <InvitationStatusLog metadata={invitationMetadata} />
                  ) : null}
                </NotificationItem>
              )
            })
          ) : (
            <NotificationsEmptyState />
          )}
        </section>
      </div>
    </main>
  )
}
