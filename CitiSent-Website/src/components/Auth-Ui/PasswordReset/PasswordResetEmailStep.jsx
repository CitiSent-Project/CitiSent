import { AuthInputField } from '../AuthInputField'

export function PasswordResetEmailStep({ flow }) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        flow.sendOtp()
      }}
    >
      <AuthInputField
        id="forgot-email"
        label="Email Address"
        type="email"
        value={flow.email}
        onChange={flow.updateEmail}
        placeholder="Enter your registered email"
        variant="admin-login"
      />
      <button
        type="submit"
        disabled={flow.isSubmitting}
        className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-[26px] font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
      >
        {flow.isSubmitting ? 'Sending...' : 'Send verification code'}
      </button>
    </form>
  )
}
