import { useState } from 'react'
import { AuthInputField, AuthPageShell, AuthPasswordField } from '../components/Auth-Ui'

const initialForm = {
	fullName: '',
	email: '',
	department: '',
	role: 'Administrator',
	phone: '',
	address: '',
	password: '',
	confirmPassword: '',
}

export function RegisterPage({ onRegister, onSwitchToLogin }) {
	const [form, setForm] = useState(initialForm)
	const [feedback, setFeedback] = useState({ type: '', message: '' })

	function updateField(field, value) {
		setForm((previous) => ({ ...previous, [field]: value }))
	}

	function validateForm() {
		if (!form.fullName.trim() || !form.email.trim() || !form.department.trim() || !form.password) {
			return 'Please complete all required fields.'
		}

		if (form.password.length < 6) {
			return 'Password must be at least 6 characters.'
		}

		if (form.password !== form.confirmPassword) {
			return 'Passwords do not match.'
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

		const result = onRegister({
			fullName: form.fullName.trim(),
			email: form.email.trim().toLowerCase(),
			department: form.department.trim(),
			role: form.role,
			phone: form.phone.trim(),
			address: form.address.trim(),
			password: form.password,
		})

		setFeedback({ type: result.ok ? 'success' : 'error', message: result.message })

		if (result.ok) {
			setForm(initialForm)
		}
	}

	return (
		<AuthPageShell
			variant="figma-login"
			title="Create Admin Account"
			subtitle="Set up your account to access the CitiSent admin workspace."
			footer={
				<p>
					Already registered?{' '}
					<button
						type="button"
						onClick={onSwitchToLogin}
						className="font-semibold text-white underline decoration-cyan-200 underline-offset-4"
					>
						Go to login
					</button>
					.
				</p>
			}
		>
			<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
				<AuthInputField
					id="register-name"
					label="Full Name"
					value={form.fullName}
					onChange={(value) => updateField('fullName', value)}
					placeholder="Juan Dela Cruz"
					variant="figma-login"
				/>

				<AuthInputField
					id="register-email"
					label="Email"
					type="email"
					value={form.email}
					onChange={(value) => updateField('email', value)}
					placeholder="admin@citisent.gov"
					variant="figma-login"
				/>

				<AuthInputField
					id="register-department"
					label="Department"
					value={form.department}
					onChange={(value) => updateField('department', value)}
					placeholder="City Operations Office"
					variant="figma-login"
				/>

				<div>
					<label htmlFor="register-role" className="mb-1 block text-sm font-medium text-white/95">
						Role
					</label>
					<select
						id="register-role"
						value={form.role}
						onChange={(event) => updateField('role', event.target.value)}
						className="w-full rounded-xl border border-white/50 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
					>
						<option>Administrator</option>
						<option>Supervisor</option>
						<option>Moderator</option>
					</select>
				</div>

				<AuthInputField
					id="register-phone"
					label="Phone"
					value={form.phone}
					onChange={(value) => updateField('phone', value)}
					placeholder="+63 900 000 0000"
					variant="figma-login"
				/>

				<AuthInputField
					id="register-address"
					label="Address"
					value={form.address}
					onChange={(value) => updateField('address', value)}
					placeholder="City Hall, Main District"
					variant="figma-login"
				/>

				<AuthPasswordField
					id="register-password"
					label="Password"
					value={form.password}
					onChange={(value) => updateField('password', value)}
					placeholder="Create password"
					variant="figma-login"
				/>

				<AuthPasswordField
					id="register-confirm-password"
					label="Confirm Password"
					value={form.confirmPassword}
					onChange={(value) => updateField('confirmPassword', value)}
					placeholder="Confirm password"
					variant="figma-login"
				/>

				<div className="md:col-span-2">
					{feedback.message ? (
						<p
							className={`mb-3 rounded-lg px-3 py-2 text-sm ${
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
							className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-base font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
					>
						Register Admin
					</button>
				</div>
			</form>
		</AuthPageShell>
	)
}
