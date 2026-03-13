import { useState } from 'react'
import { AuthInputField, AuthPageShell, AuthPasswordField } from '../components/Auth-Ui'

export function LoginPage({ onLogin, onSwitchToRegister, rememberedEmail }) {
	const [form, setForm] = useState({
		email: rememberedEmail,
		password: '',
		rememberMe: Boolean(rememberedEmail),
	})
	const [feedback, setFeedback] = useState({ type: '', message: '' })

	function updateField(field, value) {
		setForm((previous) => ({ ...previous, [field]: value }))
	}

	function validateForm() {
		if (!form.email.trim() || !form.password.trim()) {
			return 'Email and password are required.'
		}

		return ''
	}

	function handleSubmit(event) {
		event.preventDefault()
		const validationMessage = validateForm()
		if (validationMessage) {
			setFeedback({ type: 'error', message: validationMessage })
			return
		}

		const result = onLogin({
			email: form.email.trim().toLowerCase(),
			password: form.password,
			rememberMe: form.rememberMe,
		})

		setFeedback({ type: result.ok ? 'success' : 'error', message: result.message })
	}

	return (
		<AuthPageShell
			variant="figma-login"
			title="Login"
			subtitle="Sign in to access the CitiSent admin workspace."
			footer={
				<p>
					Need an account?{' '}
					<button
						type="button"
						onClick={onSwitchToRegister}
						className="px-2 py-0.5 font-semibold text-white underline decoration-blue-200 underline-offset-4 hover:bg-blue-900/45"
					>
						Register here
					</button>
					.
				</p>
			}
		>
			<form className="space-y-5" onSubmit={handleSubmit}>
				<AuthInputField
					id="login-email"
					label="Username"
					type="email"
					value={form.email}
					onChange={(value) => updateField('email', value)}
					placeholder="username@citisent"
					variant="figma-login"
				/>

				<AuthPasswordField
					id="login-password"
					label="Password"
					value={form.password}
					onChange={(value) => updateField('password', value)}
					placeholder="Password"
					variant="figma-login"
				/>

				<label className="flex items-center gap-2 text-sm text-white/95">
					<input
						type="checkbox"
						checked={form.rememberMe}
						onChange={(event) => updateField('rememberMe', event.target.checked)}
						className="h-4 w-4 rounded border-white/60 bg-white"
					/>
					Remember this username
				</label>

				{feedback.message ? (
					<p
						className={`rounded-lg px-3 py-2 text-sm ${
							feedback.type === 'success'
								? 'bg-green-100 text-green-700'
								: 'bg-rose-100/95 text-rose-700'
						}`}
					>
						{feedback.message}
					</p>
				) : null}

				<button
					type="submit"
					className="w-full rounded-xl bg-blue-900 px-4 py-2.5 text-[26px] font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300/70"
				>
					Sign-in
				</button>
			</form>
		</AuthPageShell>
	)
}
