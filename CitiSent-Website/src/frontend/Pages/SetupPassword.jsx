import { useMemo, useState } from 'react'
import { FiCheckCircle, FiLock } from 'react-icons/fi'
import { authApiService } from '../../services/api/auth/authApiService'

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
  const token = useMemo(() => getSetupToken(), [])
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
      const response = await authApiService.activateAccount({
        token,
        password: form.password,
      })
      setSuccessMessage(
        response?.data?.message || 'Your CitiSent account is active. You can now sign in.'
      )
      setForm(initialForm)
    } catch (error) {
      setErrorMessage(error.message || 'Unable to activate this account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-700">
              <FiLock className="text-xl" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Set up your password</h1>
              <p className="text-sm text-slate-600">Choose a password for your CitiSent account.</p>
            </div>
          </div>

          {successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FiCheckCircle />
                Account activated
              </div>
              <p className="mt-2 text-sm">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="setup-password" className="mb-1 block text-sm text-slate-700">
                  New Password
                </label>
                <input
                  id="setup-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="setup-confirm-password" className="mb-1 block text-sm text-slate-700">
                  Confirm Password
                </label>
                <input
                  id="setup-confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                />
              </div>

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
                {isSubmitting ? 'Activating...' : 'Activate Account'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
