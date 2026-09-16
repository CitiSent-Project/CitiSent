import { useState } from 'react'
import { FiAlertCircle } from 'react-icons/fi'
import {
  AuthInputField,
  AuthPageShell,
  AuthPasswordField,
  LoginOtpStep,
  PasswordResetCheckEmailStep,
  PasswordResetEmailStep,
  PasswordResetNewPasswordStep,
  PasswordResetOtpStep,
  PasswordResetSuccessStep,
} from '../../components/Auth-Ui'
import { PASSWORD_RESET_STEPS } from '../../models/passwordResetModel'
import { usePasswordResetFlow } from '../../hooks/auth/usePasswordResetFlow'

function PasswordRecovery({ onReturnToLogin }) {
  const flow = usePasswordResetFlow()
  const content = {
    [PASSWORD_RESET_STEPS.EMAIL]: <PasswordResetEmailStep flow={flow} />,
    [PASSWORD_RESET_STEPS.CHECK_EMAIL]: <PasswordResetCheckEmailStep flow={flow} />,
    [PASSWORD_RESET_STEPS.OTP]: <PasswordResetOtpStep flow={flow} />,
    [PASSWORD_RESET_STEPS.PASSWORD]: <PasswordResetNewPasswordStep flow={flow} />,
    [PASSWORD_RESET_STEPS.SUCCESS]: <PasswordResetSuccessStep onReturnToLogin={onReturnToLogin} />,
  }
  const subtitles = {
    email: 'Enter your email address to receive a verification code.',
    'check-email': 'We sent a verification code if an account matches your email.',
    otp: 'Enter the six-digit code sent to your email.',
    password: 'Choose a new password for your account.',
    success: 'Your account is ready to use.',
  }
  const isConfirmation = flow.step === PASSWORD_RESET_STEPS.CHECK_EMAIL

  return (
    <AuthPageShell
      variant="admin-login"
      title="Forgot Password?"
      subtitle={subtitles[flow.step]}
      footer={
        flow.step === PASSWORD_RESET_STEPS.SUCCESS ? null : (
          <p>
            Remember your password?{' '}
            <button
              type="button"
              onClick={onReturnToLogin}
              className="font-semibold text-white underline decoration-cyan-200 underline-offset-4 hover:text-cyan-100"
            >
              Back to login
            </button>
            .
          </p>
        )
      }
    >
      {flow.errorMessage && !isConfirmation ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 flex items-center gap-2 rounded-xl bg-rose-100/95 px-3.5 py-2.5 text-sm font-medium text-red-950 shadow-sm"
        >
          <FiAlertCircle className="h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
          <span>{flow.errorMessage}</span>
        </div>
      ) : null}
      {content[flow.step]}
    </AuthPageShell>
  )
}

export function LoginPage({
  onLogin,
  onVerifyOtp,
  onResendOtp,
  rememberedEmail,
}) {
  const [form, setForm] = useState({
    identifier: rememberedEmail || '',
    password: '',
    rememberMe: Boolean(rememberedEmail),
  })
  const [viewMode, setViewMode] = useState('credentials') // 'credentials' | 'otp' | 'forgot'
  const [challengeData, setChallengeData] = useState({
    tempToken: '',
    maskedEmail: '',
    email: '',
    resendCooldownSeconds: 60,
  })
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const updateField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedIdentifier = form.identifier.trim()
    const trimmedPassword = form.password.trim()

    if (!trimmedIdentifier || !trimmedPassword) {
      return setFeedback({
        type: 'error',
        message: 'Username or email and password are required.',
      })
    }

    // Client validation if user input contains an '@'
    if (trimmedIdentifier.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedIdentifier)) {
        return setFeedback({
          type: 'error',
          message: 'Please enter a valid email address (e.g., admin@citisent.gov.ph).',
        })
      }
    }

    setSubmitting(true)
    setFeedback({ type: '', message: '' })

    const result = await onLogin({
      identifier: trimmedIdentifier,
      password: form.password,
      rememberMe: form.rememberMe,
    })

    setSubmitting(false)

    if (!result?.ok) {
      return setFeedback({
        type: 'error',
        message: result?.message || 'Unable to sign in with this account.',
      })
    }

    // If 2FA OTP challenge is returned
    if (result.requireOtp) {
      setChallengeData({
        tempToken: result.tempToken,
        maskedEmail: result.maskedEmail,
        email: result.email,
        resendCooldownSeconds: result.resendCooldownSeconds || 60,
      })
      setViewMode('otp')
      return
    }

    // Direct login success fallback
    setFeedback({ type: 'success', message: result.message })
  }

  async function handleVerifyOtp(otp) {
    if (!onVerifyOtp) {
      return { ok: false, message: 'OTP verification is unavailable.' }
    }

    return await onVerifyOtp({
      tempToken: challengeData.tempToken,
      otp,
      rememberMe: form.rememberMe,
      loginIdentifier: form.identifier.trim(),
    })
  }

  async function handleResendOtp() {
    if (!onResendOtp) {
      return { ok: false, message: 'Resend code is unavailable.' }
    }

    return await onResendOtp({
      tempToken: challengeData.tempToken,
    })
  }

  function handleReturnToCredentials() {
    setViewMode('credentials')
    setFeedback({ type: '', message: '' })
  }

  // 1. Forgot Password Flow
  if (viewMode === 'forgot') {
    return <PasswordRecovery onReturnToLogin={handleReturnToCredentials} />
  }

  // 2. 2FA OTP Verification Step
  if (viewMode === 'otp') {
    return (
      <AuthPageShell
        variant="admin-login"
        title="Verification"
        subtitle="Two-Factor Authentication is required for CitiSent admin workspace access."
        footer={
          <p className="text-xs text-white/70">
            CitiSent Administrative Workspace Protection &bull; Security Level 2FA
          </p>
        }
      >
        <LoginOtpStep
          maskedEmail={challengeData.maskedEmail}
          email={challengeData.email}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onReturnToLogin={handleReturnToCredentials}
          initialCooldown={challengeData.resendCooldownSeconds}
        />
      </AuthPageShell>
    )
  }

  // 3. Primary Credentials Step
  return (
    <AuthPageShell
      variant="admin-login"
      title="Admin Login"
      subtitle="Sign in to access the CitiSent administrative workspace."
      footer={
        <p className="text-xs text-white/70">
          Admin accounts are provisioned internally by system administrators.
          <br />
          <a
            href="/privacy-policy"
            className="mt-2 inline-block font-medium text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            Data Privacy Policy
          </a>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <AuthInputField
            id="login-identifier"
            label="Username or Email"
            type="text"
            value={form.identifier}
            onChange={(value) => updateField('identifier', value)}
            placeholder="Enter your username or email"
            variant="admin-login"
            inputRule="loginIdentifier"
            onInvalidInput={(message) => setFeedback({ type: 'error', message })}
          />
          <p className="mt-1.5 text-xs text-cyan-100/80">
            Recommended: Enter your official admin email for instant 2FA code delivery.
          </p>
        </div>

        <AuthPasswordField
          id="login-password"
          label="Password"
          value={form.password}
          onChange={(value) => updateField('password', value)}
          placeholder="Password"
          variant="admin-login"
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90 select-none">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) => updateField('rememberMe', event.target.checked)}
              className="rounded border-white/20 bg-transparent text-[#173f75] focus:ring-cyan-200"
            />
            <span>Remember this sign-in</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setViewMode('forgot')
              setFeedback({ type: '', message: '' })
            }}
            className="text-sm font-medium text-white/90 underline decoration-white/30 underline-offset-4 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-200"
          >
            Forgot password?
          </button>
        </div>

        {feedback.message ? (
          <div
            role="alert"
            aria-live="assertive"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-sm transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-950'
                : 'bg-rose-100/95 text-red-950'
            }`}
          >
            <FiAlertCircle className="h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
            <span>{feedback.message}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-xl sm:text-2xl font-semibold text-white shadow-[0_8px_18px_rgba(15,52,105,0.26)] transition duration-150 hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Authenticating...' : 'Sign-in'}
        </button>
      </form>
    </AuthPageShell>
  )
}
