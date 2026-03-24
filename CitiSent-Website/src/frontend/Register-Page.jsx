import { useState } from 'react'
import { AuthInputField, AuthPageShell, AuthPasswordField } from '../components/Auth-Ui'
import { DEPARTMENT_OPTIONS } from '../models/data'

const initialForm = {
	fullName: '',
	email: '',
	departmentId: DEPARTMENT_OPTIONS[0]?.id || '',
	role: 'Office Admin',
	phone: '',
	address: '',
	password: '',
	confirmPassword: '',
}

export function RegisterPage({ onRegister, onSwitchToLogin }) {
	const [form, setForm] = useState(initialForm)
	const [feedback, setFeedback] = useState({ type: '', message: '' })
	const [submitting, setSubmitting] = useState(false)

	function updateField(field, value) {
		setForm((previous) => ({ ...previous, [field]: value }))
	}

	function validateForm() {
		if (!form.fullName.trim() || !form.email.trim() || !form.departmentId.trim() || !form.password) {
			return 'Please complete all required fields.'
		}

		if (form.password.length < 8) {
			return 'Password must be at least 8 characters.'
		}

		if (form.password !== form.confirmPassword) {
			return 'Passwords do not match.'
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

		const selectedDepartment =
			DEPARTMENT_OPTIONS.find((department) => department.id === form.departmentId) || null

		setSubmitting(true)
		const result = await onRegister({
			fullName: form.fullName.trim(),
			email: form.email.trim().toLowerCase(),
			departmentId: form.departmentId,
			departmentLabel: selectedDepartment?.label || '',
			role: form.role,
			phone: form.phone.trim(),
			address: form.address.trim(),
			password: form.password,
		})
		setSubmitting(false)

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
					value={DEPARTMENT_OPTIONS.find((department) => department.id === form.departmentId)?.label || ''}
					onChange={() => {}}
					placeholder=""
					variant="figma-login"
					disabled
				/>

				<div>
					<label htmlFor="register-department-select" className="mb-1 block text-sm font-medium text-white/95">
						Assigned Department
					</label>
					<select
						id="register-department-select"
						value={form.departmentId}
						onChange={(event) => updateField('departmentId', event.target.value)}
						className="w-full rounded-xl border border-white/50 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
					>
						{DEPARTMENT_OPTIONS.map((department) => (
							<option key={department.id} value={department.id}>
								{department.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label htmlFor="register-role" className="mb-1 block text-sm font-medium text-white/95">
						Role
					</label>
					<select
						id="register-role"
						value={form.role}
						onChange={() => {}}
						disabled
						className="w-full rounded-xl border border-white/50 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
					>
						<option>Office Admin</option>
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
							disabled={submitting}
							className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-base font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
					>
						{submitting ? 'Registering...' : 'Register Admin'}
					</button>
				</div>
			</form>
		</AuthPageShell>
	)
}
