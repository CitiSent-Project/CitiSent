import { useEffect, useMemo, useState } from 'react'
import { authApiService } from '../../../services/api/auth/authApiService'
import { PASSWORD_RESET_RESEND_COOLDOWN_MS, PASSWORD_RESET_STEPS, initialPasswordResetState } from './passwordResetFlowModel'
import { normalizeEmail, normalizeOtp, validateEmail, validateOtp, validatePassword } from './passwordResetValidation'

const GENERIC_SEND_MESSAGE = 'If an account matches this email, a verification code has been sent.'

function safeErrorMessage(error, fallback) {
  if (error?.status === 429 && error?.userMessage) return error.userMessage
  return fallback
}

export function usePasswordResetFlow() {
  const [state, setState] = useState(initialPasswordResetState)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!state.resendAvailableAt || state.resendAvailableAt <= Date.now()) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [state.resendAvailableAt])

  const resendSeconds = useMemo(
    () => Math.max(0, Math.ceil((state.resendAvailableAt - now) / 1_000)),
    [state.resendAvailableAt, now]
  )

  function update(patch) {
    setState((current) => ({ ...current, ...patch }))
  }

  function returnToEmail(message = '') {
    setState({ ...initialPasswordResetState, errorMessage: message })
  }

  async function sendOtp(emailValue = state.email) {
    const email = normalizeEmail(emailValue)
    const validationMessage = validateEmail(email)
    if (validationMessage) {
      update({ email: emailValue, errorMessage: validationMessage })
      return false
    }
    if (state.isSubmitting) return false

    update({ isSubmitting: true, errorMessage: '' })
    try {
      await authApiService.requestOtp({ email })
      update({
        step: PASSWORD_RESET_STEPS.CHECK_EMAIL,
        email,
        otp: '',
        resetToken: '',
        resendAvailableAt: Date.now() + PASSWORD_RESET_RESEND_COOLDOWN_MS,
        isSubmitting: false,
        errorMessage: GENERIC_SEND_MESSAGE,
      })
      return true
    } catch (error) {
      update({ isSubmitting: false, errorMessage: safeErrorMessage(error, 'Unable to send a verification code. Please try again.') })
      return false
    }
  }

  function proceedToOtp() {
    if (state.step === PASSWORD_RESET_STEPS.CHECK_EMAIL) update({ step: PASSWORD_RESET_STEPS.OTP, errorMessage: '' })
  }

  async function verifyOtp() {
    const otp = normalizeOtp(state.otp)
    const validationMessage = validateOtp(otp)
    if (validationMessage) return update({ otp, errorMessage: validationMessage })
    if (state.isSubmitting) return

    update({ isSubmitting: true, errorMessage: '' })
    try {
      const response = await authApiService.verifyOtp({ email: state.email, otp })
      const resetToken = response?.data?.resetToken
      if (!resetToken) throw new Error('Missing reset token')
      update({ step: PASSWORD_RESET_STEPS.PASSWORD, otp: '', resetToken, isSubmitting: false })
    } catch {
      update({ isSubmitting: false, errorMessage: 'That verification code is invalid or expired. Please try again or request a new code.' })
    }
  }

  async function resetPassword(password, confirmation) {
    const validationMessage = validatePassword(password, confirmation)
    if (validationMessage) return update({ errorMessage: validationMessage })
    if (!state.resetToken) return returnToEmail('Your reset session has expired. Please start again.')
    if (state.isSubmitting) return

    update({ isSubmitting: true, errorMessage: '' })
    try {
      await authApiService.resetPasswordWithOtp({ resetToken: state.resetToken, password })
      update({ ...initialPasswordResetState, step: PASSWORD_RESET_STEPS.SUCCESS })
      return true
    } catch {
      returnToEmail('Your reset session is invalid or expired. Please start again.')
      return false
    }
  }

  return {
    ...state,
    resendSeconds,
    updateEmail: (email) => update({ email, errorMessage: '' }),
    updateOtp: (otp) => update({ otp: normalizeOtp(otp), errorMessage: '' }),
    sendOtp,
    proceedToOtp,
    verifyOtp,
    resetPassword,
    returnToEmail,
  }
}
