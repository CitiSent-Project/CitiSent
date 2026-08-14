import { apiClient } from '../core/apiClient'

export const reportsApiService = {
  listReports: (token, { limit = 100, offset = 0, status, userId } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })

    if (status) {
      params.set('status', status)
    }

    if (userId) {
      params.set('userId', userId)
    }

    return apiClient.get(`/admin/reports?${params.toString()}`, {
      token,
    })
  },
  getReportById: (token, reportId) =>
    apiClient.get(`/admin/reports/${reportId}`, {
      token,
    }),
  updateReport: (token, reportId, payload) =>
    apiClient.patch(`/admin/reports/${reportId}`, payload, {
      token,
    }),
  listReportMessages: (token, reportId, options = {}) =>
    apiClient.get(`/reports/${reportId}/messages`, { token, signal: options.signal }),
  sendReportMessage: (token, reportId, content) =>
    apiClient.post(`/reports/${reportId}/messages`, { message: content }, { token }),
  markReportMessagesRead: (token, reportId) =>
    apiClient.patch(`/reports/${reportId}/messages/read`, {}, { token }),
  getReportChatSuggestions: (token, reportId, forceRegenerate = false) =>
    apiClient.get(`/reports/${reportId}/messages/suggestions?forceRegenerate=${forceRegenerate}`, { token }),
  listConversations: (token) =>
    apiClient.get('/admin/conversations', { token }),
}
