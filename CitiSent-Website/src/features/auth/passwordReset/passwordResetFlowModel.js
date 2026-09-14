export const PASSWORD_RESET_STEPS = Object.freeze({
  EMAIL: 'email',
  CHECK_EMAIL: 'check-email',
  OTP: 'otp',
  PASSWORD: 'password',
  SUCCESS: 'success',
})

export const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60_000

export const initialPasswordResetState = Object.freeze({
  step: PASSWORD_RESET_STEPS.EMAIL,
  email: '',
  otp: '',
  resetToken: '',
  resendAvailableAt: 0,
  isSubmitting: false,
  errorMessage: '',
})
