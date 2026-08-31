import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiBell, FiLoader, FiTrash2, FiX } from 'react-icons/fi'
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

export function NotificationsDrawer({
  notifications = [],
  onToggleRead,
  onClearAll,
  isLoading = false,
  isClearing = false,
  onClose,
  onNavigate,
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Notifications</h1>
            {counts.unread > 0 && (
              <span className="inline-flex h-5 items-center justify-center rounded-full bg-blue-100 px-2 text-[10px] font-bold text-blue-700">
                {counts.unread} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearAll}
              disabled={isClearDisabled}
              title={clearButtonTooltip}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isClearing ? (
                <>
                  <FiLoader className="animate-spin text-xs shrink-0" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="text-xs shrink-0" />
                  <span>Clear all</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              title="Close notifications"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white">
          <NotificationFilterChips
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={counts}
            disabled={isLoading}
          />
        </div>

        {/* Content List */}
        <section className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <NotificationSkeleton />
          ) : visibleNotifications.length > 0 ? (
            <div className="flex flex-col">
              {visibleNotifications.map((notification) => {
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
              })}
            </div>
          ) : (
            <div className="p-8">
              <NotificationsEmptyState 
                activeFilter={filter} 
                onDismiss={() => setFilter('All')}
                onNavigate={() => {
                  onNavigate()
                  onClose()
                }}
              />
            </div>
          )}
        </section>

      </motion.div>
    </div>
  )
}
