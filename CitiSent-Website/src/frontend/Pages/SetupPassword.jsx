import { useMemo, useState } from 'react'
import { FiCheckCircle, FiLock } from 'react-icons/fi'
import { authApiService } from '../../services/api/auth/authApiService'
import { AuthPasswordField } from '../../components/Auth-Ui'

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

  if (password.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.'
  }

  return ''
}

export function SetupPasswordPage() {
  const isResetMode = window.location.pathname === '/reset-password'
  const token = useMemo(() => getSetupToken(), [])
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const hasMissingResetToken = isResetMode && !token

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
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
    } catch (error) {
      setErrorMessage(isResetMode
        ? 'This reset link is invalid, expired, or has already been used. Request a new password reset to continue.'
        : error.message || 'Unable to activate this account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = hasMissingResetToken ? 'Invalid reset link' : isResetMode ? 'Create a new password' : 'Set up your password'
  const subtitle = isResetMode
    ? 'Choose a new password for your CitiSent account.'
    : 'Choose a password for your CitiSent account.'

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-700">
              <FiLock className="text-xl" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              <p className="text-sm text-slate-600">{subtitle}</p>
            </div>
          </div>

          {hasMissingResetToken ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900" role="alert">
              <p className="font-semibold">Reset link expired or invalid</p>
              <p className="mt-2 text-sm">This link is missing or no longer available. Request a new reset link to continue.</p>
              <a href="/" className="mt-4 inline-block text-sm font-semibold text-blue-700 underline underline-offset-4">Request a new reset link</a>
            </div>
          ) : successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FiCheckCircle />
                {isResetMode ? 'Password reset' : 'Account activated'}
              </div>
              <p className="mt-2 text-sm">{successMessage}</p>
              <div className="mt-4">
                <a
                  href="/"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-4"
                >
                  Go to login
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthPasswordField id="setup-password" label="New Password" value={form.password} onChange={(value) => updateField('password', value)} placeholder="At least 8 characters" />
              <AuthPasswordField id="setup-confirm-password" label="Confirm Password" value={form.confirmPassword} onChange={(value) => updateField('confirmPassword', value)} placeholder="Repeat your new password" />

              {errorMessage ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
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
