export function PasswordResetOtpStep({ flow }) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        flow.verifyOtp()
      }}
    >
      <div>
        <label htmlFor="reset-otp" className="mb-1 block text-sm font-medium text-white/95">
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
          className="w-full rounded-xl border border-white/50 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
        />
      </div>
      <button
        type="submit"
        disabled={flow.isSubmitting}
        className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-xl font-semibold text-white"
      >
        {flow.isSubmitting ? 'Verifying...' : 'Verify code'}
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={() => flow.returnToEmail()} className="underline">
          Use another email
        </button>
        <button
          type="button"
          disabled={flow.isSubmitting || flow.resendSeconds > 0}
          onClick={() => flow.sendOtp()}
          className="underline disabled:opacity-60"
        >
          {flow.resendSeconds ? `Resend in ${flow.resendSeconds}s` : 'Resend code'}
        </button>
      </div>
    </form>
  )
}
