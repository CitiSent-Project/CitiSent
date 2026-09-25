import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCopy,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiX,
} from 'react-icons/fi'
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

function RequestAccessModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  function handleCopyEmail() {
    navigator.clipboard?.writeText('sysadmin@citisent.gov.ph')
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-access-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#102e56] p-6 sm:p-7 text-white shadow-2xl backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
          aria-label="Close modal"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300">
            <FiShield className="h-6 w-6" />
          </div>
          <div>
            <h3 id="request-access-title" className="text-lg font-bold text-white">
              Admin Account Provisioning
            </h3>
            <p className="text-xs text-cyan-200/80">
              City Government Administrative Access
            </p>
          </div>
        </div>

        <p className="text-sm text-blue-100/90 leading-relaxed mb-4">
          CitiSent administrator accounts for Department Heads, Dispatchers, and Municipal Supervisors are provisioned internally by the City Government System Administrator to ensure security and official compliance.
        </p>

        <div className="rounded-xl border border-white/15 bg-white/5 p-4 mb-5 text-sm text-blue-100/90 space-y-2">
          <p className="font-semibold text-white text-xs uppercase tracking-wider">
            How to obtain access:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-blue-100/80">
            <li>Submit an internal access request to your Department Administrator or City Hall IT Office.</li>
            <li>Provide your official government email address (e.g., <code className="text-cyan-200">@citisent.gov.ph</code>).</li>
            <li>Once approved, a secure password setup link and two-factor authentication verification will be sent to your inbox.</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleCopyEmail}
            className="flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition cursor-pointer w-full sm:w-auto justify-center"
          >
            {copied ? (
              <>
                <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <FiCopy className="h-4 w-4" />
                <span>Copy: sysadmin@citisent.gov.ph</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25 transition cursor-pointer w-full sm:w-auto"
          >
            Understood
          </button>
        </div>
      </motion.div>
    </div>
  )
}

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
          <p className="text-center sm:text-left text-sm text-blue-100/90">
            Remember your password?{' '}
            <button
              type="button"
              onClick={onReturnToLogin}
              className="font-semibold text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-100 cursor-pointer"
            >
              Back to login
            </button>
          </p>
        )
      }
    >
      {flow.errorMessage && !isConfirmation ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 flex items-center gap-2 rounded-xl bg-rose-100/95 px-3.5 py-2.5 text-sm font-medium text-red-950 shadow-sm border border-rose-300"
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
  onSwitchToRegister,
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
  const [showRegisterModal, setShowRegisterModal] = useState(false)

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

  function handleRegisterClick() {
    if (typeof onSwitchToRegister === 'function') {
      onSwitchToRegister()
      return
    }
    setShowRegisterModal(true)
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
        title="Two-Factor Verification"
        subtitle="Security verification is required for official CitiSent administrative workspace access."
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-100/70">
            <span>CitiSent Administrative Workspace Protection</span>
            <span className="font-semibold text-cyan-200">Security Level: 2FA Encrypted</span>
          </div>
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
    <>
      <AuthPageShell
        variant="admin-login"
        title="Admin Login"
        subtitle="Sign in to access the CitiSent administrative workspace."
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-100/70">
            <span>Admin accounts are provisioned internally.</span>
            <a
              href="/privacy-policy"
              className="font-medium text-cyan-200/90 underline decoration-cyan-300/30 underline-offset-4 hover:text-white"
            >
              Data Privacy Policy
            </a>
          </div>
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
              icon={FiMail}
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
            icon={FiLock}
          />

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/90 select-none">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => updateField('rememberMe', event.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-white/20 text-[#173f75] focus:ring-cyan-300 focus:ring-offset-0 cursor-pointer"
              />
              <span>Remember this sign-in</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setViewMode('forgot')
                setFeedback({ type: '', message: '' })
              }}
              className="text-sm font-medium text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-200 rounded-xs cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <AnimatePresence mode="wait">
            {feedback.message ? (
              <motion.div
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition-all ${
                  feedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                    : 'bg-rose-100/95 text-red-950 border border-rose-300'
                }`}
              >
                <FiAlertCircle className="h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                <span>{feedback.message}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={submitting ? {} : { scale: 1.01 }}
            whileTap={submitting ? {} : { scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#173f75] hover:bg-[#123666] active:bg-[#0e2c54] px-4 py-3.5 text-lg font-semibold text-white shadow-[0_8px_20px_rgba(15,46,91,0.35)] hover:shadow-[0_10px_25px_rgba(15,46,91,0.45)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-200/70 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <FiRefreshCw className="h-5 w-5 animate-spin text-cyan-200" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign-in</span>
            )}
          </motion.button>

          {/* Register / Create Account Option */}
          <div className="pt-2 text-center text-sm text-blue-100/90">
            <span>Need an admin account? </span>
            <button
              type="button"
              onClick={handleRegisterClick}
              className="font-semibold text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 transition hover:text-cyan-100 hover:decoration-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200/60 rounded-xs cursor-pointer"
            >
              Request Access / Register
            </button>
          </div>
        </form>
      </AuthPageShell>

      <RequestAccessModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </>
  )
}
