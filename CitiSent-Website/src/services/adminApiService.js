import { apiClient } from './apiClient'

export const adminApiService = {
  listReports: (token, { limit = 100, offset = 0, status } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })

    if (status) {
      params.set('status', status)
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
  listTransferRequests: (token) =>
    apiClient.get('/admin/transfer-requests', {
      token,
    }),
  createTransferRequest: (token, payload) =>
    apiClient.post('/admin/transfer-requests', payload, {
      token,
    }),
  approveTransferRequest: (token, requestId, payload) =>
    apiClient.patch(`/admin/transfer-requests/${requestId}/approve`, payload, {
      token,
    }),
  rejectTransferRequest: (token, requestId, payload) =>
    apiClient.patch(`/admin/transfer-requests/${requestId}/reject`, payload, {
      token,
    }),
  listOfficeAdmins: (token) =>
    apiClient.get('/admin/office-admins', {
      token,
    }),
  assignOfficeDepartment: (token, adminId, payload) =>
    apiClient.patch(`/admin/office-admins/${adminId}/department`, payload, {
      token,
    }),
}
