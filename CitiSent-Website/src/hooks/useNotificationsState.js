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

  async function handleToggleNotification(notificationId) {
    const targetNotification = notifications.find((notification) => notification.id === notificationId)
    if (!targetNotification) {
      return
    }

    const nextReadState = !targetNotification.read

    setNotificationsByAdmin((previous) =>
      toggleAdminNotificationReadState({
        notificationsByAdmin: previous,
        adminId: activeAdminId,
        notificationId,
      })
    )

    if (!persistToggleRead) {
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
    }
  }

  async function handleClearNotifications() {
    if (persistClearAll) {
      try {
        await persistClearAll()
      } catch (error) {
        if (notifyError) {
          notifyError('Notification cleanup failed.', error?.message || 'Unable to clear notifications.')
        }
        return
      }
    }

    const transition = buildClearAdminNotificationsTransition({
      notificationsByAdmin,
      adminId: activeAdminId,
    })

    setNotificationsByAdmin(transition.nextNotificationsByAdmin)
    addActivity(transition.activity.action, transition.activity.detail)
    notifySuccess(transition.successMessage)
  }

  const unreadNotifications = countUnreadNotifications(notifications)

  return {
    notifications,
    unreadNotifications,
    handleToggleNotification,
    handleClearNotifications,
  }
}
