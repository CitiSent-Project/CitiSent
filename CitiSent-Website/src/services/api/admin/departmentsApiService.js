import { apiClient } from '../core/apiClient'

export const departmentsApiService = {
  getDepartments: (token) =>
    apiClient.get('/departments', { token }),
}
