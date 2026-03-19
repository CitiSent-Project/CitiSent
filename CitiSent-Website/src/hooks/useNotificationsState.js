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
}) {
  const notifications = getAdminNotifications({ notificationsByAdmin, adminId: activeAdminId })

  function handleToggleNotification(notificationId) {
    setNotificationsByAdmin((previous) =>
      toggleAdminNotificationReadState({
        notificationsByAdmin: previous,
        adminId: activeAdminId,
        notificationId,
      })
    )
  }

  function handleClearNotifications() {
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
