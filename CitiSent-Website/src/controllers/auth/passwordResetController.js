export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateEmail(value) {
  const email = normalizeEmail(value)
  if (!email) return 'Please enter your email address.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
  return ''
}

export function normalizeOtp(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 6)
}

export function validateOtp(value) {
  return /^\d{6}$/.test(String(value || '')) ? '' : 'Enter the six-digit verification code.'
}

export function validatePassword(password, confirmation) {
  if (!password) return 'Please enter a new password.'
  if (password.length < 8) return 'Your new password must be at least 8 characters.'
  if (password !== confirmation) return 'Your passwords do not match.'
  return ''
}

export function resolveSafeErrorMessage(error, fallback) {
  if (error?.status === 429 && error?.userMessage) return error.userMessage
  return fallback
}
