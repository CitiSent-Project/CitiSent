export function PasswordResetOtpStep({ flow }) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        flow.verifyOtp()
      }}
    >
      <div>
        <label htmlFor="reset-otp" className="mb-2 block text-sm font-semibold text-white">
          Verification code
        </label>
        <input
          id="reset-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={flow.otp}
          onChange={(event) => flow.updateOtp(event.target.value)}
          placeholder="Six-digit code"
          aria-describedby="reset-otp-help"
          className="h-12 w-full rounded-xl border border-white/60 bg-white px-4 text-center text-base font-semibold tracking-[0.22em] text-slate-800 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 transition duration-150 focus:border-white focus:outline-none focus:ring-4 focus:ring-cyan-100/45 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <p id="reset-otp-help" className="mt-2 text-sm leading-5 text-white/80">Enter the six digits exactly as shown in your email.</p>
      </div>
      <button
        type="submit"
        disabled={flow.isSubmitting}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#173f75] px-4 text-base font-semibold text-white shadow-[0_8px_18px_rgba(15,52,105,0.26)] transition duration-150 hover:bg-[#123666] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/65"
      >
        {flow.isSubmitting ? 'Verifying...' : 'Verify code'}
      </button>
      <div className="flex flex-col gap-1 border-t border-white/20 pt-3 text-sm min-[375px]:flex-row min-[375px]:items-center min-[375px]:justify-between">
        <button type="button" onClick={() => flow.returnToEmail()} className="min-h-11 self-start px-1 font-medium text-white underline decoration-white/45 underline-offset-4 transition hover:text-cyan-100 active:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/70">
          Use another email
        </button>
        <button
          type="button"
          disabled={flow.isSubmitting || flow.resendSeconds > 0}
          onClick={() => flow.sendOtp()}
          className="min-h-11 self-start px-1 font-medium text-white underline decoration-white/45 underline-offset-4 transition hover:text-cyan-100 active:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/70 min-[375px]:self-auto"
        >
          {flow.resendSeconds ? `Resend in ${flow.resendSeconds}s` : 'Resend code'}
        </button>
      </div>
    </form>
  )
}
