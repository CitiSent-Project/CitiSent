import { FiMail } from 'react-icons/fi'

export function PasswordResetCheckEmailStep({ flow }) {
  return (
    <div className="space-y-5 text-center">
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cyan-100 text-3xl text-[#173f75]"
        aria-hidden="true"
      >
        <FiMail />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">Check your email</h2>
        <p className="mt-2 text-sm leading-6 text-white/80">
          If an account matches this email, a verification code has been sent. Check your inbox and spam folder.
        </p>
      </div>
      <button
        type="button"
        onClick={flow.proceedToOtp}
        className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-xl font-semibold text-white transition hover:bg-[#123666] focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
      >
        I have my code
      </button>
      <button
        type="button"
        disabled={flow.isSubmitting || flow.resendSeconds > 0}
        onClick={() => flow.sendOtp()}
        className="text-sm font-semibold text-white underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {flow.resendSeconds ? `Resend code in ${flow.resendSeconds}s` : 'Resend code'}
      </button>
    </div>
  )
}
