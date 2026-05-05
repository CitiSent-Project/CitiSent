import { useMemo, useState } from 'react'
import { AuthInputField, AuthPageShell, AuthPasswordField } from '../../components/Auth-Ui'

export function RegisterPage({ onRegister, onSwitchToLogin, departmentOptions }) {
	const availableDepartments = useMemo(
		() => (Array.isArray(departmentOptions) ? departmentOptions : []),
		[departmentOptions],
	)

	const initialForm = {
		fname: '',
		mname: '',
		lname: '',
		email: '',
		departmentId: availableDepartments[0]?.id || '',
		role: 'Office Admin',
		phone: '',
		address: '',
		password: '',
		confirmPassword: '',
	}

	const [form, setForm] = useState(initialForm)
	const [feedback, setFeedback] = useState({ type: '', message: '' })
	const [submitting, setSubmitting] = useState(false)

	const resolvedDepartmentId = form.departmentId || availableDepartments[0]?.id || ''

	function updateField(field, value) {
		setForm((previous) => ({ ...previous, [field]: value }))
	}

	function validateForm() {
		if (availableDepartments.length === 0) {
			return 'No departments are available yet. Please try again in a moment.'
		}

		if (
			!form.fname.trim() ||
			!form.lname.trim() ||
			!form.email.trim() ||
			!resolvedDepartmentId.trim() ||
			!form.password
		) {
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
			availableDepartments.find((department) => department.id === resolvedDepartmentId) || null

		setSubmitting(true)
		const result = await onRegister({
			fname: form.fname.trim(),
			mname: form.mname.trim() || null,
			lname: form.lname.trim(),
			email: form.email.trim().toLowerCase(),
			departmentId: resolvedDepartmentId,
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
			layout="split"
			variant="admin-login"
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
			<form className="grid gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4" onSubmit={handleSubmit}>
				<div className="md:col-span-2 grid gap-4 md:grid-cols-3">
					<AuthInputField
						id="register-fname"
						label="First Name"
						value={form.fname}
						onChange={(value) => updateField('fname', value)}
						placeholder="Juan"
						variant="admin-login"
					/>
					<AuthInputField
						id="register-mname"
						label="Middle Name (Optional)"
						value={form.mname}
						onChange={(value) => updateField('mname', value)}
						placeholder="Santos"
						variant="admin-login"
					/>
					<AuthInputField
						id="register-lname"
						label="Last Name"
						value={form.lname}
						onChange={(value) => updateField('lname', value)}
						placeholder="Dela Cruz"
						variant="admin-login"
					/>
				</div>

				<AuthInputField
					id="register-email"
					label="Email"
					type="email"
					value={form.email}
					onChange={(value) => updateField('email', value)}
					placeholder="admin@citisent.gov"
					variant="admin-login"
				/>

				<div>
					<label htmlFor="register-department-select" className="mb-1 block text-sm font-medium text-white/95">
						Assigned Department
					</label>
					<select
						id="register-department-select"
						value={resolvedDepartmentId}
						onChange={(event) => updateField('departmentId', event.target.value)}
						disabled={availableDepartments.length === 0}
						className="w-full rounded-xl border border-white/50 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
					>
						{availableDepartments.length === 0 ? (
							<option value="">No departments available</option>
						) : null}
						{availableDepartments.map((department) => (
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
					variant="admin-login"
				/>

				<AuthInputField
					id="register-address"
					label="Address"
					value={form.address}
					onChange={(value) => updateField('address', value)}
					placeholder="City Hall, Main District"
					variant="admin-login"
				/>

				<AuthPasswordField
					id="register-password"
					label="Password"
					value={form.password}
					onChange={(value) => updateField('password', value)}
					placeholder="Create password"
					variant="admin-login"
				/>

				<AuthPasswordField
					id="register-confirm-password"
					label="Confirm Password"
					value={form.confirmPassword}
					onChange={(value) => updateField('confirmPassword', value)}
					placeholder="Confirm password"
					variant="admin-login"
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
						disabled={submitting || availableDepartments.length === 0}
						className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-base font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{submitting ? 'Registering...' : 'Register Admin'}
					</button>
				</div>
			</form>
		</AuthPageShell>
	)
}
