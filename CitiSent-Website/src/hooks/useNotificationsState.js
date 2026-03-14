import {
  buildClearNotificationsTransition,
  countUnreadNotifications,
  toggleNotificationReadState,
} from '../controllers/notificationsController'

export function useNotificationsState({
  notifications,
  setNotifications,
  addActivity,
  notifySuccess,
}) {
  function handleToggleNotification(notificationId) {
    setNotifications((previous) =>
      toggleNotificationReadState({ notifications: previous, notificationId })
    )
  }

  function handleClearNotifications() {
    const transition = buildClearNotificationsTransition()
    setNotifications(transition.nextNotifications)
    addActivity(transition.activity.action, transition.activity.detail)
    notifySuccess(transition.successMessage)
  }

  const unreadNotifications = countUnreadNotifications(notifications)

  return {
    unreadNotifications,
    handleToggleNotification,
    handleClearNotifications,
  }
}
