import { useState } from 'react'
import { AuthPasswordField } from '../AuthPasswordField'
import { PasswordRequirements } from '../PasswordRequirements'
import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '../../../utils/passwordValidation'

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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <AuthPasswordField
        id="reset-password"
        label="New password"
        value={password}
        onChange={setPassword}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        maxLength={MAX_PASSWORD_LENGTH}
        variant="admin-login"
      />
      <PasswordRequirements
        password={password}
        confirmPassword={confirmation}
        variant="admin-login"
      />
      <AuthPasswordField
        id="reset-password-confirmation"
        label="Confirm new password"
        value={confirmation}
        onChange={setConfirmation}
        placeholder="Repeat your new password"
        maxLength={MAX_PASSWORD_LENGTH}
        variant="admin-login"
      />
      {flow.errorMessage ? (
        <p className="rounded-lg border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm text-rose-200">
          {flow.errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={flow.isSubmitting}
        className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-lg font-semibold text-white shadow-sm transition hover:bg-[#123666] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {flow.isSubmitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}
