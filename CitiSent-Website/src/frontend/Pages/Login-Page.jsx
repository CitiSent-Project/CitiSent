import { useState } from 'react'
import { AuthInputField, AuthPageShell, AuthPasswordField } from '../../components/Auth-Ui'
import { PASSWORD_RESET_STEPS, PasswordResetCheckEmailStep, PasswordResetEmailStep, PasswordResetNewPasswordStep, PasswordResetOtpStep, PasswordResetSuccessStep, usePasswordResetFlow } from '../../features/auth/passwordReset'

function PasswordRecovery({ onReturnToLogin }) {
  const flow = usePasswordResetFlow()
  const content = {
    [PASSWORD_RESET_STEPS.EMAIL]: <PasswordResetEmailStep flow={flow} />,
    [PASSWORD_RESET_STEPS.CHECK_EMAIL]: <PasswordResetCheckEmailStep flow={flow} />,
    [PASSWORD_RESET_STEPS.OTP]: <PasswordResetOtpStep flow={flow} />,
    [PASSWORD_RESET_STEPS.PASSWORD]: <PasswordResetNewPasswordStep flow={flow} />,
    [PASSWORD_RESET_STEPS.SUCCESS]: <PasswordResetSuccessStep onReturnToLogin={onReturnToLogin} />,
  }
  const subtitles = { email: 'Enter your email address to receive a verification code.', 'check-email': 'We sent a verification code if an account matches your email.', otp: 'Enter the six-digit code sent to your email.', password: 'Choose a new password for your account.', success: 'Your account is ready to use.' }
  const isConfirmation = flow.step === PASSWORD_RESET_STEPS.CHECK_EMAIL

  return <AuthPageShell variant="admin-login" title="Forgot Password?" subtitle={subtitles[flow.step]} footer={flow.step === PASSWORD_RESET_STEPS.SUCCESS ? null : <p>Remember your password? <button type="button" onClick={onReturnToLogin} className="font-semibold text-white underline decoration-cyan-200 underline-offset-4">Back to login</button>.</p>}>
    {flow.errorMessage && !isConfirmation ? <p role="alert" className="mb-5 rounded-lg bg-rose-100/95 px-3 py-2 text-sm text-red-900" aria-live="polite">{flow.errorMessage}</p> : null}
    {content[flow.step]}
  </AuthPageShell>
}

export function LoginPage({ onLogin, rememberedEmail }) {
  const [form, setForm] = useState({ identifier: rememberedEmail, password: '', rememberMe: Boolean(rememberedEmail) })
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const updateField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.identifier.trim() || !form.password.trim()) return setFeedback({ type: 'error', message: 'Username or email and password are required.' })
    setSubmitting(true)
    const result = await onLogin({ identifier: form.identifier.trim(), password: form.password, rememberMe: form.rememberMe })
    setSubmitting(false)
    setFeedback({ type: result.ok ? 'success' : 'error', message: result.message })
  }

  if (isForgotMode) return <PasswordRecovery onReturnToLogin={() => setIsForgotMode(false)} />
  return <AuthPageShell variant="admin-login" title="Login" subtitle="Sign in to access the CitiSent admin workspace." footer={<p className="text-xs text-white/70">Admin accounts are provisioned internally by system administrators.<br /><a href="/privacy-policy" className="mt-2 inline-block font-medium text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white">Data Privacy Policy</a></p>}>
    <form className="space-y-5" onSubmit={handleSubmit}>
      <AuthInputField id="login-identifier" label="Username or Email" type="text" value={form.identifier} onChange={(value) => updateField('identifier', value)} placeholder="Enter your username or email" variant="admin-login" inputRule="loginIdentifier" onInvalidInput={(message) => setFeedback({ type: 'error', message })} />
      <AuthPasswordField id="login-password" label="Password" value={form.password} onChange={(value) => updateField('password', value)} placeholder="Password" variant="admin-login" />
      <div className="flex items-center justify-between"><label className="flex cursor-pointer items-center gap-2 text-sm text-white/90"><input type="checkbox" checked={form.rememberMe} onChange={(event) => updateField('rememberMe', event.target.checked)} className="rounded border-white/20 bg-transparent text-[#173f75]" /><span>Remember this sign-in</span></label><button type="button" onClick={() => { setIsForgotMode(true); setFeedback({ type: '', message: '' }) }} className="text-sm font-medium text-white/90 underline decoration-white/30 underline-offset-4 hover:text-white">Forgot password?</button></div>
      {feedback.message ? <p className={`rounded-lg px-3 py-2 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-rose-100/95 text-red-900'}`}>{feedback.message}</p> : null}
      <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-[26px] font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70">{submitting ? 'Signing in...' : 'Sign-in'}</button>
    </form>
  </AuthPageShell>
}
