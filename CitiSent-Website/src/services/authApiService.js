import { apiClient } from './apiClient'

export const authApiService = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  me: (token) =>
    apiClient.get('/auth/me', {
      token,
    }),
  updateCurrentUser: (token, payload) =>
    apiClient.patch('/users/me', payload, {
      token,
    }),
}
