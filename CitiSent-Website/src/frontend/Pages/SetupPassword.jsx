import { useMemo, useState } from 'react'
import { FiCheckCircle, FiLock } from 'react-icons/fi'
import { authApiService } from '../../services/api/auth/authApiService'
import { AuthPasswordField, PasswordRequirements } from '../../components/Auth-Ui'
import {
  validatePassword,
  evaluatePassword,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '../../utils/passwordValidation'

const initialForm = {
  password: '',
  confirmPassword: '',
}

function getSetupToken() {
  return new URLSearchParams(window.location.search).get('token') || ''
}

function validateForm({ token, password, confirmPassword }) {
  if (!token) {
    return 'This setup link is missing a token. Please use the link from your email.'
  }

  return validatePassword(password, confirmPassword)
}

export function SetupPasswordPage() {
  const isResetMode = window.location.pathname === '/reset-password'
  const token = useMemo(() => getSetupToken(), [])
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const hasMissingResetToken = isResetMode && !token

  const evalResult = useMemo(
    () => evaluatePassword(form.password, form.confirmPassword),
    [form.password, form.confirmPassword]
  )

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
    setErrorMessage('')
  }

  // Determine password field status & status message based on attached design states
  let passwordStatus = 'idle'
  let passwordStatusMessage = ''

  if (form.password.length === 0) {
    if (hasSubmitted) {
      passwordStatus = 'warning'
      passwordStatusMessage = 'Please fill out this field.'
    }
  } else if (evalResult.isValid) {
    passwordStatus = 'valid'
  } else {
    // Has typed characters but does not meet criteria
    passwordStatus = 'invalid'
    passwordStatusMessage = 'Password does not meet the criteria'
  }

  // Determine confirm password field status & status message
  let confirmStatus = 'idle'
  let confirmStatusMessage = ''

  if (form.confirmPassword.length === 0) {
    if (hasSubmitted) {
      confirmStatus = 'warning'
      confirmStatusMessage = 'Please fill out this field.'
    }
  } else if (form.password && form.confirmPassword === form.password) {
    confirmStatus = 'valid'
    confirmStatusMessage = 'Passwords match.'
  } else {
    confirmStatus = 'invalid'
    confirmStatusMessage = 'Passwords do not match.'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setHasSubmitted(true)

    const validationMessage = validateForm({
      token,
      password: form.password,
      confirmPassword: form.confirmPassword,
    })

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const apiCall = isResetMode
        ? authApiService.resetPassword
        : authApiService.activateAccount

      const response = await apiCall({
        token,
        password: form.password,
      })
      setSuccessMessage(
        response?.data?.message ||
        (isResetMode
          ? 'Your password has been reset successfully. You can now sign in.'
          : 'Your CitiSent account is active. You can now sign in.')
      )
      setForm(initialForm)
      setHasSubmitted(false)
    } catch (error) {
      setErrorMessage(
        isResetMode
          ? 'This reset link is invalid, expired, or has already been used. Request a new password reset to continue.'
          : error.message || 'Unable to activate this account. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = hasMissingResetToken
    ? 'Invalid reset link'
    : isResetMode
      ? 'Create a new password'
      : 'Set up your password'
  const subtitle = isResetMode
    ? 'Choose a new password for your CitiSent account.'
    : 'Choose a password for your CitiSent account.'

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#f8fafc] via-[#edf2f9] to-[#e4eaf5] px-4 py-12">
      {/* Decorative ambient blurred gradients */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-80 w-96 rounded-full bg-blue-200/35 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-96 rounded-full bg-indigo-200/30 blur-3xl"
        aria-hidden="true"
      />

      <section className="relative z-10 w-full max-w-sm">
        <div className="rounded-4xl border border-white/80 bg-white/95 p-7 shadow-[0_24px_50px_-12px_rgba(23,63,117,0.12),0_4px_16px_rgba(0,0,0,0.02)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex items-center gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <FiLock className="text-xl" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>

          {hasMissingResetToken ? (
            <div
              className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900"
              role="alert"
            >
              <p className="font-semibold">Reset link expired or invalid</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-800">
                This link is missing or no longer available. Request a new reset link to continue.
              </p>
              <a
                href="/"
                className="mt-4 inline-block text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900"
              >
                Request a new reset link
              </a>
            </div>
          ) : successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-emerald-800">
              <div className="flex items-center gap-2 text-base font-semibold text-emerald-900">
                <FiCheckCircle className="h-5 w-5 text-emerald-600" />
                {isResetMode ? 'Password reset' : 'Account activated'}
              </div>
              <p className="mt-2 text-sm leading-relaxed">{successMessage}</p>
              <div className="mt-5">
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
                >
                  Go to login
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Field */}
              <div className="space-y-3">
                <AuthPasswordField
                  id="setup-password"
                  label="New Password"
                  value={form.password}
                  onChange={(value) => updateField('password', value)}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  maxLength={MAX_PASSWORD_LENGTH}
                  shape="pill"
                  status={passwordStatus}
                  statusMessage={passwordStatusMessage}
                />

                {/* Password Criteria Checklist */}
                <PasswordRequirements
                  password={form.password}
                  confirmPassword={form.confirmPassword}
                  status={passwordStatus}
                  variant="default"
                />
              </div>

              {/* Confirm Password Field */}
              <AuthPasswordField
                id="setup-confirm-password"
                label="Confirm Password"
                value={form.confirmPassword}
                onChange={(value) => updateField('confirmPassword', value)}
                placeholder="Repeat your new password"
                maxLength={MAX_PASSWORD_LENGTH}
                shape="pill"
                status={confirmStatus}
                statusMessage={confirmStatusMessage}
              />

              {/* Global Error Banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs sm:text-sm font-medium text-rose-700"
                >
                  {errorMessage}
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-6 text-base font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isSubmitting
                  ? isResetMode
                    ? 'Updating...'
                    : 'Activating...'
                  : isResetMode
                    ? 'Reset Password'
                    : 'Activate Account'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
