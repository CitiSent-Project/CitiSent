import { useMemo, useState } from 'react'
import {
  NotificationFilterChips,
  NotificationItem,
  NotificationsEmptyState,
} from '../components/Notifications-Ui'

export function Notifications({ notifications, onToggleRead, onClearAll, onRevealTemporaryPassword }) {
  const [filter, setFilter] = useState('All')
  const [authPasswordByNotification, setAuthPasswordByNotification] = useState({})
  const [authErrorByNotification, setAuthErrorByNotification] = useState({})
  const [isRevealingByNotification, setIsRevealingByNotification] = useState({})
  const [revealedPasswordByNotification, setRevealedPasswordByNotification] = useState({})

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

  async function handleRevealPassword(notificationId) {
    const password = String(authPasswordByNotification[notificationId] || '')

    if (!password.trim()) {
      setAuthErrorByNotification((previous) => ({
        ...previous,
        [notificationId]: 'Enter your admin password to reveal the temporary password.',
      }))
      return
    }

    setIsRevealingByNotification((previous) => ({
      ...previous,
      [notificationId]: true,
    }))

    try {
      if (!onRevealTemporaryPassword) {
        setAuthErrorByNotification((previous) => ({
          ...previous,
          [notificationId]: 'Reveal action is unavailable right now.',
        }))
        return
      }

      const result = await onRevealTemporaryPassword({
        notificationId,
        password,
      })

      if (!result?.ok) {
        setAuthErrorByNotification((previous) => ({
          ...previous,
          [notificationId]: result?.message || 'Authentication failed. Please try again.',
        }))
        return
      }

      setRevealedPasswordByNotification((previous) => ({
        ...previous,
        [notificationId]: result.temporaryPassword || '',
      }))
      setAuthPasswordByNotification((previous) => ({
        ...previous,
        [notificationId]: '',
      }))
      setAuthErrorByNotification((previous) => ({
        ...previous,
        [notificationId]: '',
      }))
    } finally {
      setIsRevealingByNotification((previous) => ({
        ...previous,
        [notificationId]: false,
      }))
    }
  }

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
            visibleNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onToggleRead={onToggleRead}
              >
                {notification?.meta?.securePayload?.kind === 'temporaryPassword' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Protected temporary password
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Authenticate with your admin password before revealing this credential.
                    </p>

                    {revealedPasswordByNotification[notification.id] ? (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Revealed temporary password
                        </p>
                        <p className="mt-1 font-mono text-sm text-emerald-900">
                          {revealedPasswordByNotification[notification.id]}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="password"
                        value={authPasswordByNotification[notification.id] || ''}
                        onChange={(event) =>
                          setAuthPasswordByNotification((previous) => ({
                            ...previous,
                            [notification.id]: event.target.value,
                          }))
                        }
                        placeholder="Enter your password"
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-500"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => handleRevealPassword(notification.id)}
                        disabled={Boolean(isRevealingByNotification[notification.id])}
                        className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isRevealingByNotification[notification.id] ? 'Verifying...' : 'Reveal'}
                      </button>
                    </div>

                    {authErrorByNotification[notification.id] ? (
                      <p className="mt-2 text-xs text-rose-600">{authErrorByNotification[notification.id]}</p>
                    ) : null}
                  </div>
                ) : null}
              </NotificationItem>
            ))
          ) : (
            <NotificationsEmptyState />
          )}
        </section>
      </div>
    </main>
  )
}
