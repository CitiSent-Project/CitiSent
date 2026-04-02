import { apiClient } from '../core/apiClient'

export const notificationsApiService = {
  listNotifications: (token, { adminId, limit = 200, offset = 0, read } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })

    if (adminId) {
      params.set('adminId', adminId)
    }

    if (read) {
      params.set('read', read)
    }

    return apiClient.get(`/admin/notifications?${params.toString()}`, {
      token,
    })
  },
  updateNotificationReadState: (token, notificationId, payload) =>
    apiClient.patch(`/admin/notifications/${notificationId}/read`, payload, {
      token,
    }),
  bulkUpdateNotificationReadState: (token, payload) =>
    apiClient.patch('/admin/notifications/read-state', payload, {
      token,
    }),
  clearNotifications: (token, payload) =>
    apiClient.post('/admin/notifications/clear', payload, {
      token,
    }),
}
