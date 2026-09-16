import { useEffect, useId, useRef, useState } from 'react'
import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiMail, FiRefreshCw, FiShield } from 'react-icons/fi'

export function LoginOtpStep({
  maskedEmail,
  email,
  onVerify,
  onResend,
  onReturnToLogin,
  initialCooldown = 60,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [cooldown, setCooldown] = useState(initialCooldown)

  const inputRefs = useRef([])
  const helperId = useId()
  const errorAlertId = useId()

  // Auto-focus the first slot on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = window.setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [cooldown])

  const otpCode = digits.join('')
  const isComplete = otpCode.length === 6 && digits.every((d) => d.trim() !== '')

  function handleDigitChange(index, value) {
    const cleaned = value.replace(/\D/g, '')

    // If user typed/pasted a single digit
    if (cleaned.length <= 1) {
      const nextDigits = [...digits]
      nextDigits[index] = cleaned
      setDigits(nextDigits)
      setErrorMessage('')

      // Auto-advance to next input
      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
      return
    }

    // If pasted multiple digits into one slot
    handlePastedCode(cleaned)
  }

  function handlePastedCode(rawPasted) {
    const cleaned = rawPasted.replace(/\D/g, '').slice(0, 6)
    if (!cleaned) return

    const nextDigits = [...digits]
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = cleaned[i] || ''
    }
    setDigits(nextDigits)
    setErrorMessage('')

    const nextFocusIndex = Math.min(cleaned.length, 5)
    inputRefs.current[nextFocusIndex]?.focus()

    // If a full 6-digit code was pasted, trigger submit
    if (cleaned.length === 6) {
      submitCode(cleaned)
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is empty, jump to previous box and clear it
        const nextDigits = [...digits]
        nextDigits[index - 1] = ''
        setDigits(nextDigits)
        inputRefs.current[index - 1]?.focus()
      } else {
        const nextDigits = [...digits]
        nextDigits[index] = ''
        setDigits(nextDigits)
      }
      setErrorMessage('')
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(event) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text')
    handlePastedCode(pasted)
  }

  async function submitCode(codeToSubmit = otpCode) {
    if (codeToSubmit.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const result = await onVerify(codeToSubmit)
    setIsSubmitting(false)

    if (!result?.ok) {
      setErrorMessage(result?.message || 'Invalid or expired verification code.')
      // Select all or focus the first input so the user can easily re-type
      inputRefs.current[0]?.focus()
    }
  }

  async function handleResendCode() {
    if (cooldown > 0 || isResending || isSubmitting) return

    setIsResending(true)
    setErrorMessage('')
    setSuccessMessage('')

    const result = await onResend()
    setIsResending(false)

    if (result?.ok) {
      setSuccessMessage('A fresh verification code has been sent to your email.')
      setCooldown(60)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } else {
      setErrorMessage(result?.message || 'Failed to resend code. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* 2FA Status Notice Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-white/30 bg-white/10 p-3.5 backdrop-blur-xs text-white">
        <div className="mt-0.5 rounded-lg bg-white/20 p-2 text-cyan-200">
          <FiShield className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-white">Two-Factor Authentication</p>
          <p className="mt-0.5 text-white/85 text-xs sm:text-sm">
            We sent a 6-digit security code to{' '}
            <span className="font-mono font-medium text-cyan-200">{maskedEmail || email}</span>.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage ? (
        <div
          id={errorAlertId}
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-xl bg-rose-100/95 px-3.5 py-2.5 text-sm font-medium text-red-950 shadow-sm transition-all"
        >
          <FiAlertCircle className="h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* Success Notice */}
      {successMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl bg-emerald-100/95 px-3.5 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition-all"
        >
          <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* OTP Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submitCode()
        }}
        className="space-y-5"
      >
        <div>
          <label htmlFor="otp-digit-0" className="mb-2 block text-sm font-semibold text-white">
            Verification Code
          </label>

          {/* 6 Digit Input Group */}
          <div
            className="flex items-center justify-between gap-1.5 sm:gap-2.5"
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-digit-${idx}`}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${idx + 1} of 6`}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e.key)}
                disabled={isSubmitting}
                className={`h-12 w-11 sm:h-14 sm:w-13 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-150 shadow-inner ${
                  digit
                    ? 'border-white bg-white text-[#173f75] ring-2 ring-cyan-200/60'
                    : 'border-white/50 bg-white/90 text-slate-800 placeholder:text-slate-400 focus:border-white focus:bg-white focus:ring-4 focus:ring-cyan-200/50'
                } focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          <p id={helperId} className="mt-2.5 text-xs sm:text-sm text-white/80">
            Enter the 6-digit code sent to your email. The code expires in 5 minutes.
          </p>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={!isComplete || isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f75] px-4 text-base sm:text-lg font-semibold text-white shadow-[0_8px_18px_rgba(15,52,105,0.26)] transition duration-150 hover:bg-[#123666] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
        >
          {isSubmitting ? (
            <>
              <FiRefreshCw className="h-5 w-5 animate-spin text-cyan-200" />
              <span>Verifying code...</span>
            </>
          ) : (
            'Verify & Sign In'
          )}
        </button>

        {/* Action Footers: Resend & Back */}
        <div className="flex flex-col gap-2 pt-2 text-sm sm:flex-row sm:items-center sm:justify-between border-t border-white/20">
          <button
            type="button"
            onClick={onReturnToLogin}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 self-start font-medium text-white/90 underline decoration-white/30 underline-offset-4 transition hover:text-white active:text-cyan-100 disabled:opacity-50"
          >
            <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Login</span>
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={cooldown > 0 || isResending || isSubmitting}
            className="self-start sm:self-auto font-medium text-white underline decoration-white/30 underline-offset-4 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? (
              <span className="inline-flex items-center gap-1">
                <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </span>
            ) : cooldown > 0 ? (
              `Resend code in ${cooldown}s`
            ) : (
              'Resend code'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
