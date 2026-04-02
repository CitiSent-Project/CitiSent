import { apiClient } from '../core/apiClient'

export const activityLogApiService = {
  getActivityLog: (token, { adminId, limit = 200, offset = 0 } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })

    if (adminId) {
      params.set('adminId', adminId)
    }

    return apiClient.get(`/admin/activity-log?${params.toString()}`, {
      token,
    })
  },
  createActivityLogEntry: (token, payload) =>
    apiClient.post('/admin/activity-log', payload, {
      token,
    }),
}
