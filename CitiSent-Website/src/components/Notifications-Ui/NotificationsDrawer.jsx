import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiBell, FiLoader, FiMessageSquare, FiTrash2, FiX } from 'react-icons/fi'
import { APP_PAGES } from '../../models/pageModel'
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

function getMessageMetadata(notification) {
  const type = String(notification?.type || '').toLowerCase()
  if (!type.includes('message') && !type.includes('chat')) return null
  const metadata = notification?.metadata || {}
  return metadata.reportId ? metadata : null
}

function InvitationStatusLog({ metadata }) {
  const isActive = metadata?.status === 'active'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-3 transition-colors">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            isActive
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          }`}
        >
          {isActive ? 'Active' : 'Pending'}
        </span>
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono break-all">
          {metadata?.email || 'Account invitation'}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {isActive
          ? 'The user has completed password setup and activated their account.'
          : 'The setup invitation email was sent and is awaiting user account activation.'}
      </p>
    </div>
  )
}

/**
 * Renders a compact report-number badge below message notifications.
 * Mirrors the visual style of InvitationStatusLog but is specific to conversations.
 */
function MessageContextBadge({ metadata }) {
  const reportNumber = metadata?.reportNumber
  const senderName = metadata?.senderName

  return (
    <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 px-3.5 py-2.5 transition-colors">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/60 dark:border-blue-800/60 bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:text-blue-300">
          <FiMessageSquare className="text-[10px]" />
          Conversation
        </span>
        {reportNumber && (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            #{reportNumber}
          </span>
        )}
      </div>
      {senderName && (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          From <span className="font-semibold text-slate-800 dark:text-slate-200">{senderName}</span> — tap to open the conversation thread.
        </p>
      )}
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

  /**
   * Navigates the admin to the Conversations page and closes the drawer.
   * Used for message-type notification click handlers.
   */
  function handleNavigateToConversations() {
    if (typeof onNavigate === 'function') {
      onNavigate(APP_PAGES.CONVERSATIONS)
    }
    if (typeof onClose === 'function') {
      onClose()
    }
  }

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
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl dark:border-l dark:border-slate-800"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3.5 sm:px-6 sm:py-4.5 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              Notifications
            </h1>
            {counts.unread > 0 && (
              <span className="inline-flex h-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200/50 dark:border-blue-800/50 px-2 text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0 whitespace-nowrap">
                {counts.unread} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onClearAll}
              disabled={isClearDisabled}
              title={clearButtonTooltip}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
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
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition shrink-0"
              title="Close notifications"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 shrink-0">
          <NotificationFilterChips
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={counts}
            disabled={isLoading}
          />
        </div>

        {/* Content List */}
        <section className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80">
          {isLoading ? (
            <NotificationSkeleton />
          ) : visibleNotifications.length > 0 ? (
            <div className="flex flex-col">
              {visibleNotifications.map((notification) => {
                const invitationMetadata = getInvitationMetadata(notification)
                const messageMetadata = getMessageMetadata(notification)

                return (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onToggleRead={onToggleRead}
                    onClick={messageMetadata ? handleNavigateToConversations : undefined}
                  >
                    {invitationMetadata ? (
                      <InvitationStatusLog metadata={invitationMetadata} />
                    ) : messageMetadata ? (
                      <MessageContextBadge metadata={messageMetadata} />
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
