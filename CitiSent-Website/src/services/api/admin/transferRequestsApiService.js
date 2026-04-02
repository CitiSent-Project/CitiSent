import { apiClient } from '../core/apiClient'

export const transferRequestsApiService = {
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
}
