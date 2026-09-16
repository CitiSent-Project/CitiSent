import { apiClient } from '../core/apiClient'

export const authApiService = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  adminChallenge: (payload) => apiClient.post('/auth/admin/challenge', payload),
  adminVerifyOtp: (payload) => apiClient.post('/auth/admin/verify-otp', payload),
  adminResendOtp: (payload) => apiClient.post('/auth/admin/resend-otp', payload),
  forgotPassword: (payload) => apiClient.post('/auth/request-password-reset', payload),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload),
  activateAccount: (payload) => apiClient.post('/auth/activate-account', payload),
  me: (token) =>
    apiClient.get('/auth/me', {
      token,
    }),
  updateCurrentUser: (token, payload) =>
    apiClient.patch('/users/me', payload, {
      token,
    }),
  requestOtp: (payload) => apiClient.post('/auth/request-otp', payload),
  verifyOtp: (payload) => apiClient.post('/auth/verify-otp', payload),
  resetPasswordWithOtp: (payload) => apiClient.post('/auth/reset-password-otp', payload),
  changePassword: (token, payload) =>
    apiClient.post('/auth/change-password', payload, {
      token,
    }),
}
