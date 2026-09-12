import { useState } from 'react'
import { AuthInputField, AuthPageShell, AuthPasswordField } from '../../components/Auth-Ui'

export function LoginPage({ onLogin, onForgotPassword, rememberedEmail }) {
	const [form, setForm] = useState({
		identifier: rememberedEmail,
		password: '',
		rememberMe: Boolean(rememberedEmail),
	})
	const [isForgotMode, setIsForgotMode] = useState(false)
	const [forgotEmail, setForgotEmail] = useState('')
	const [feedback, setFeedback] = useState({ type: '', message: '' })
	const [submitting, setSubmitting] = useState(false)

	function updateField(field, value) {
		setForm((previous) => ({ ...previous, [field]: value }))
	}

	function validateLoginForm() {
		if (!form.identifier.trim() || !form.password.trim()) {
			return 'Username or email and password are required.'
		}

		return ''
	}

	function validateForgotForm() {
		if (!forgotEmail.trim()) {
			return 'Please enter your email address.'
		}
		// Basic email validation regex
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
			return 'Please enter a valid email address.'
		}
		return ''
	}

	async function handleSubmit(event) {
		event.preventDefault()

		if (isForgotMode) {
			const validationMessage = validateForgotForm()
			if (validationMessage) {
				setFeedback({ type: 'error', message: validationMessage })
				return
			}
			setSubmitting(true)
			setFeedback({ type: '', message: '' })

			// Call the actual forgot password service
			const response = await onForgotPassword({ email: forgotEmail.trim() })

			setSubmitting(false)
			if (response.ok) {
				setFeedback({
					type: 'success',
					message: 'Reset instructions will be sent if an account matches this email.',
				})
				setForgotEmail('')
			} else {
				setFeedback({
					type: 'error',
					message: response.message || 'Unable to process your request. Please try again later.',
				})
			}
			return
		}

		const validationMessage = validateLoginForm()
		if (validationMessage) {
			setFeedback({ type: 'error', message: validationMessage })
			return
		}

		setSubmitting(true)
		const result = await onLogin({
			identifier: form.identifier.trim(),
			password: form.password,
			rememberMe: form.rememberMe,
		})
		setSubmitting(false)
		setFeedback({ type: result.ok ? 'success' : 'error', message: result.message })
	}

	const title = isForgotMode ? 'Forgot Password?' : 'Login'
	const subtitle = isForgotMode
		? 'Enter your email address to receive a password reset link.'
		: 'Sign in to access the CitiSent admin workspace.'

	const footer = isForgotMode ? (
		<p>
			Remember your password?{' '}
			<button
				type="button"
				onClick={() => {
					setIsForgotMode(false)
					setFeedback({ type: '', message: '' })
				}}
				className="font-semibold text-white underline decoration-cyan-200 underline-offset-4"
			>
				Back to login
			</button>
			.
		</p>
	) : (
		<p className="text-xs text-white/70">
			Admin accounts are provisioned internally by system administrators.
			<br />
			<a href="/privacy-policy" className="mt-2 inline-block font-medium text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white">
				Data Privacy Policy
			</a>
		</p>
	)

	return (
		<AuthPageShell
			variant="admin-login"
			title={title}
			subtitle={subtitle}
			footer={footer}
		>
			<form className="space-y-5" onSubmit={handleSubmit}>
				{isForgotMode ? (
					<AuthInputField
						id="forgot-email"
						label="Email Address"
						type="email"
						value={forgotEmail}
						onChange={(value) => {
							setForgotEmail(value)
							setFeedback({ type: '', message: '' })
						}}
						placeholder="Enter your registered email"
						variant="admin-login"
						inputRule="email"
						onInvalidInput={(message) => setFeedback({ type: 'error', message })}
					/>
				) : (
					<>
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

						<AuthPasswordField
							id="login-password"
							label="Password"
							value={form.password}
							onChange={(value) => updateField('password', value)}
							placeholder="Password"
							variant="admin-login"
						/>

						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer">
								<input
									type="checkbox"
									checked={form.rememberMe}
									onChange={(e) => updateField('rememberMe', e.target.checked)}
									className="rounded border-white/20 bg-transparent text-[#173f75]"
								/>
								<span>Remember this sign-in</span>
							</label>
							<button
								type="button"
								onClick={() => {
									setIsForgotMode(true)
									setFeedback({ type: '', message: '' })
								}}
								className="text-sm font-medium text-white/90 hover:text-white underline decoration-white/30 underline-offset-4"
							>
								Forgot password?
							</button>
						</div>
					</>
				)}

				{feedback.message ? (
					<p
						className={`rounded-lg px-3 py-2 text-sm ${
							feedback.type === 'success'
								? 'bg-green-100 text-green-700'
								: 'bg-rose-100/95 text-red-900'
						}`}
					>
						{feedback.message}
					</p>
				) : null}

				<button
					type="submit"
					disabled={submitting}
					className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-[26px] font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
				>
					{isForgotMode
						? submitting
							? 'Sending...'
							: 'Send link'
						: submitting
							? 'Signing in...'
							: 'Sign-in'}
				</button>
			</form>
		</AuthPageShell>
	)
}
