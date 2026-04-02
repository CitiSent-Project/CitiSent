import { apiClient } from '../core/apiClient'

export const usersApiService = {
  listUsers: (token, { limit = 50, offset = 0, search, status } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })

    if (search) {
      params.set('search', search)
    }

    if (status) {
      params.set('status', status)
    }

    return apiClient.get(`/admin/users?${params.toString()}`, {
      token,
    })
  },
  getUserById: (token, userId) =>
    apiClient.get(`/admin/users/${userId}`, {
      token,
    }),
  createUser: (token, payload) =>
    apiClient.post('/admin/users', payload, {
      token,
    }),
  updateUser: (token, userId, payload) =>
    apiClient.patch(`/admin/users/${userId}`, payload, {
      token,
    }),
  banUser: (token, userId, payload = {}) =>
    apiClient.patch(`/admin/users/${userId}/ban`, payload, {
      token,
    }),
  unbanUser: (token, userId) =>
    apiClient.patch(`/admin/users/${userId}/unban`, {}, {
      token,
    }),
}
