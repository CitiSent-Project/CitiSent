import { useState } from 'react'
import { AuthPasswordField } from '../AuthPasswordField'

export function PasswordResetNewPasswordStep({ flow }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const succeeded = await flow.resetPassword(password, confirmation)
    if (succeeded) {
      setPassword('')
      setConfirmation('')
    }
  }

  const requirements = [
    ['At least 8 characters', password.length >= 8],
    ['Passwords match', Boolean(password) && password === confirmation],
  ]

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <AuthPasswordField
        id="reset-password"
        label="New password"
        value={password}
        onChange={setPassword}
        placeholder="At least 8 characters"
        variant="admin-login"
      />
      <AuthPasswordField
        id="reset-password-confirmation"
        label="Confirm new password"
        value={confirmation}
        onChange={setConfirmation}
        placeholder="Repeat your new password"
        variant="admin-login"
      />
      <ul aria-label="Password requirements" className="space-y-1 text-xs text-white/80">
        {requirements.map(([label, met]) => (
          <li key={label} className={met ? 'text-emerald-200' : ''}>
            {met ? '✓' : '○'} {label}
          </li>
        ))}
      </ul>
      <button
        type="submit"
        disabled={flow.isSubmitting}
        className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-xl font-semibold text-white"
      >
        {flow.isSubmitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}
