import { apiClient } from '../core/apiClient'

export const dashboardApiService = {
  getDashboardSummary: (token) =>
    apiClient.get('/admin/dashboard/summary', {
      token,
    }),
  getDashboardReportsByStatus: (token) =>
    apiClient.get('/admin/dashboard/reports/status', {
      token,
    }),
  getDashboardReportsByCategory: (token) =>
    apiClient.get('/admin/dashboard/reports/category', {
      token,
    }),
  getDashboardWeeklyTrend: (token) =>
    apiClient.get('/admin/dashboard/reports/weekly-trend', {
      token,
    }),
  getDashboardRecentAdmins: (token, { limit = 5 } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
    })

    return apiClient.get(`/admin/dashboard/admins/recent?${params.toString()}`, {
      token,
    })
  },
  getDashboardRecentUsers: (token, { limit = 5 } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
    })

    return apiClient.get(`/admin/dashboard/users/recent?${params.toString()}`, {
      token,
    })
  },
}
