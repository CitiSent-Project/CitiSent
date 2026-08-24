import { useMemo, useState } from 'react'
import { FiBell, FiLoader, FiTrash2 } from 'react-icons/fi'
import {
  NotificationFilterChips,
  NotificationItem,
  NotificationsEmptyState,
  NotificationSkeleton,
} from '../../components/Notifications-Ui'

function getInvitationMetadata(notification) {
  const metadata = notification?.metadata || notification?.meta?.invitation
  return metadata?.kind === 'accountInvitation' ? metadata : null
}

function InvitationStatusLog({ metadata }) {
  const isActive = metadata?.status === 'active'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            isActive
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
              : 'bg-amber-100 text-amber-800 border border-amber-200/60'
          }`}
        >
          {isActive ? 'Active' : 'Pending'}
        </span>
        <span className="text-xs font-semibold text-slate-800 font-mono">
          {metadata?.email || 'Account invitation'}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-600">
        {isActive
          ? 'The user has completed password setup and activated their account.'
          : 'The setup invitation email was sent and is awaiting user account activation.'}
      </p>
    </div>
  )
}

export function Notifications({
  notifications = [],
  onToggleRead,
  onClearAll,
  isLoading = false,
  isClearing = false,
}) {
  const [filter, setFilter] = useState('All')

  const counts = useMemo(() => {
    const unread = notifications.filter((n) => !n.read).length
    const read = notifications.length - unread
    return {
      all: notifications.length,
      unread,
      read,
    }
  }, [notifications])

  const visibleNotifications = useMemo(() => {
    if (filter === 'Unread') {
      return notifications.filter((notification) => !notification.read)
    }

    if (filter === 'Read') {
      return notifications.filter((notification) => notification.read)
    }

    return notifications
  }, [notifications, filter])

  const isClearDisabled = notifications.length === 0 || isLoading || isClearing

  const clearButtonTooltip =
    notifications.length === 0
      ? 'No notifications to clear'
      : isLoading
      ? 'Loading notifications...'
      : isClearing
      ? 'Clearing notifications...'
      : 'Clear all notifications'

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FiBell className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
                {counts.unread > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 font-numeric">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                    {counts.unread} unread
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Keep track of reports, account updates, and administrative activities in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={onClearAll}
              disabled={isClearDisabled}
              title={clearButtonTooltip}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 shadow-xs"
            >
              {isClearing ? (
                <>
                  <FiLoader className="animate-spin text-xs shrink-0 text-slate-500" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="text-xs shrink-0 text-slate-500" />
                  <span>Clear all</span>
                </>
              )}
            </button>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <NotificationFilterChips
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={counts}
            disabled={isLoading}
          />

          <div className="space-y-3">
            {isLoading ? (
              <NotificationSkeleton />
            ) : visibleNotifications.length > 0 ? (
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
              <NotificationsEmptyState activeFilter={filter} />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
