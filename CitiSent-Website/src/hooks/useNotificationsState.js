import { useRef } from 'react'
import {
  buildClearAdminNotificationsTransition,
  countUnreadNotifications,
  getAdminNotifications,
  toggleAdminNotificationReadState,
} from '../controllers/notificationsController'

export function useNotificationsState({
  notificationsByAdmin,
  activeAdminId,
  setNotificationsByAdmin,
  addActivity,
  notifySuccess,
  notifyError,
  persistToggleRead,
  persistClearAll,
}) {
  const notifications = getAdminNotifications({ notificationsByAdmin, adminId: activeAdminId })
  const processingToggleIds = useRef(new Set())
  const isClearingRef = useRef(false)

  async function handleToggleNotification(notificationId) {
    if (processingToggleIds.current.has(notificationId)) {
      return
    }

    const targetNotification = notifications.find((notification) => notification.id === notificationId)
    if (!targetNotification) {
      return
    }

    processingToggleIds.current.add(notificationId)

    const nextReadState = !targetNotification.read

    setNotificationsByAdmin((previous) =>
      toggleAdminNotificationReadState({
        notificationsByAdmin: previous,
        adminId: activeAdminId,
        notificationId,
      })
    )

    if (!persistToggleRead) {
      processingToggleIds.current.delete(notificationId)
      return
    }

    try {
      const result = await persistToggleRead({
        notificationId,
        isRead: nextReadState,
      })

      if (result?.notification) {
        setNotificationsByAdmin((previous) => ({
          ...previous,
          [activeAdminId]: (previous[activeAdminId] || []).map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  ...result.notification,
                }
              : notification
          ),
        }))
      }
    } catch (error) {
      setNotificationsByAdmin((previous) => ({
        ...previous,
        [activeAdminId]: (previous[activeAdminId] || []).map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: targetNotification.read,
              }
            : notification
        ),
      }))

      if (notifyError) {
        notifyError('Notification update failed.', error?.message || 'Unable to update notification state.')
      }
    } finally {
      processingToggleIds.current.delete(notificationId)
    }
  }

  async function handleClearNotifications() {
    if (isClearingRef.current) {
      return
    }
    isClearingRef.current = true

    try {
      if (persistClearAll) {
        await persistClearAll()
      }

      const transition = buildClearAdminNotificationsTransition({
        notificationsByAdmin,
        adminId: activeAdminId,
      })

      setNotificationsByAdmin(transition.nextNotificationsByAdmin)
      addActivity(transition.activity.action, transition.activity.detail)
      notifySuccess(transition.successMessage)
    } catch (error) {
      if (notifyError) {
        notifyError('Notification cleanup failed.', error?.message || 'Unable to clear notifications.')
      }
    } finally {
      isClearingRef.current = false
    }
  }

  const unreadNotifications = countUnreadNotifications(notifications)

  return {
    notifications,
    unreadNotifications,
    handleToggleNotification,
    handleClearNotifications,
  }
}
