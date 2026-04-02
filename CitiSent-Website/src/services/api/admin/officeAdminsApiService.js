import { apiClient } from '../core/apiClient'

export const officeAdminsApiService = {
  listOfficeAdmins: (token) =>
    apiClient.get('/admin/office-admins', {
      token,
    }),
  assignOfficeDepartment: (token, adminId, payload) =>
    apiClient.patch(`/admin/office-admins/${adminId}/department`, payload, {
      token,
    }),
}
