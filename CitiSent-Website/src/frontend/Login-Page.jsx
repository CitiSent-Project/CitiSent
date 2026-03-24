import { useState } from 'react'
import { AuthInputField, AuthPageShell, AuthPasswordField } from '../components/Auth-Ui'

export function LoginPage({ onLogin, onSwitchToRegister, rememberedEmail }) {
	const [form, setForm] = useState({
		identifier: rememberedEmail,
		password: '',
		rememberMe: Boolean(rememberedEmail),
	})
	const [feedback, setFeedback] = useState({ type: '', message: '' })
	const [submitting, setSubmitting] = useState(false)

	function updateField(field, value) {
		setForm((previous) => ({ ...previous, [field]: value }))
	}

	function validateForm() {
		if (!form.identifier.trim() || !form.password.trim()) {
			return 'Username or email and password are required.'
		}

		return ''
	}

	async function handleSubmit(event) {
		event.preventDefault()
		const validationMessage = validateForm()
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
						className="font-semibold text-white underline decoration-cyan-200 underline-offset-4"
					>
						Register here
					</button>
					.
				</p>
			}
		>
			<form className="space-y-5" onSubmit={handleSubmit}>
				<AuthInputField
					id="login-identifier"
					label="Email"
					type="text"
					value={form.identifier}
					onChange={(value) => updateField('identifier', value)}
					placeholder="example@citisent.gov"
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
					Remember this sign-in
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
					disabled={submitting}
					className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-[26px] font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
				>
					{submitting ? 'Signing in...' : 'Sign-in'}
				</button>
			</form>
		</AuthPageShell>
	)
}
