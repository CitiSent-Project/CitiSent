import { useMemo } from 'react'
import { FiAlertCircle, FiCheck } from 'react-icons/fi'
import { evaluatePassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../../utils/passwordValidation'

export function PasswordRequirements({
  password = '',
  confirmPassword = '',
  status = 'idle',
  variant = 'default',
  showStrengthBar = true,
  showConfirmCheck = true,
}) {
  const isAdminLogin = variant === 'admin-login'
  const evalResult = useMemo(
    () => evaluatePassword(password, confirmPassword),
    [password, confirmPassword]
  )

  const { rules, commonReason, score, strengthLabel, strengthColor, isValid } = evalResult
  const hasTypedPassword = Boolean(password && password.length > 0)
  const isInvalid = status === 'invalid' || (hasTypedPassword && !isValid && status !== 'idle')

  const items = [
    {
      id: 'length',
      label: `At least ${MIN_PASSWORD_LENGTH} characters (up to ${MAX_PASSWORD_LENGTH})`,
      met: rules.minLength && rules.maxLength,
    },
    {
      id: 'special',
      label: 'At least one special symbol (!@#$%^&*)',
      met: rules.hasSpecial,
    },
    {
      id: 'number',
      label: 'At least one number (0-9)',
      met: rules.hasNumber,
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A-Z)',
      met: rules.hasUppercase,
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter (a-z)',
      met: rules.hasLowercase,
    },
    {
      id: 'whitespace',
      label: 'No spaces or whitespace',
      met: rules.noWhitespace,
    },
    {
      id: 'patterns',
      label: 'No common words or sequential patterns',
      met: rules.notCommon,
    },
  ]

  if (showConfirmCheck && confirmPassword) {
    items.push({
      id: 'match',
      label: 'Passwords match',
      met: rules.matchesConfirmation,
    })
  }

  // Bar progress percentage: 0 to 100%
  const progressPercent = hasTypedPassword ? Math.max(12, (score / 5) * 100) : 0

  const barColorClasses = {
    rose: 'bg-rose-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    sky: 'bg-blue-500',
    emerald: 'bg-emerald-500',
  }[strengthColor] || 'bg-slate-300'

  return (
    <div className="space-y-3 pt-1.5" aria-live="polite">
      {/* Optional sleek strength meter bar */}
      {showStrengthBar && hasTypedPassword && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={isAdminLogin ? 'text-white/80' : 'text-slate-500'}>
              Password strength
            </span>
            <span
              className={`font-semibold ${
                isAdminLogin
                  ? strengthColor === 'emerald'
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                  : strengthColor === 'emerald'
                    ? 'text-emerald-600'
                    : 'text-rose-600'
              }`}
            >
              {strengthLabel}
            </span>
          </div>
          <div
            className={`h-1.5 w-full overflow-hidden rounded-full ${
              isAdminLogin ? 'bg-white/20' : 'bg-slate-100'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${barColorClasses}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Warning callout for common / sequential patterns */}
      {hasTypedPassword && commonReason && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-xl p-2.5 text-xs font-medium ${
            isAdminLogin
              ? 'border border-amber-400/40 bg-amber-950/60 text-amber-200'
              : 'border border-amber-200 bg-amber-50/80 text-amber-800'
          }`}
        >
          <FiAlertCircle className="mt-0.5 shrink-0 text-sm" />
          <span>{commonReason}</span>
        </div>
      )}

      {/* Checklist matching attached design */}
      <ul
        aria-label="Password requirements"
        className={`grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 ${
          isAdminLogin ? 'text-white/70' : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        {items.map((item) => {
          const isMet = item.met

          // Determine item state:
          // If met: green
          // If unmet AND in error/invalid state: red
          // Otherwise (neutral untyped or idle): neutral gray
          let itemColorClass = 'text-slate-600 dark:text-slate-400'
          let checkColorClass = 'text-slate-400 dark:text-slate-500'

          if (isMet) {
            itemColorClass = isAdminLogin
              ? 'text-emerald-300 font-medium'
              : 'text-emerald-600 dark:text-emerald-400 font-medium'
            checkColorClass = isAdminLogin ? 'text-emerald-300' : 'text-emerald-500'
          } else if (isInvalid) {
            itemColorClass = isAdminLogin
              ? 'text-rose-300 font-medium'
              : 'text-rose-600 dark:text-rose-400 font-medium'
            checkColorClass = isAdminLogin ? 'text-rose-300' : 'text-rose-500'
          }

          return (
            <li
              key={item.id}
              className={`flex items-center gap-2 transition-colors duration-150 ${itemColorClass}`}
            >
              <FiCheck className={`h-4 w-4 shrink-0 transition-colors ${checkColorClass}`} />
              <span className="text-xs sm:text-[13px] tracking-tight">{item.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
