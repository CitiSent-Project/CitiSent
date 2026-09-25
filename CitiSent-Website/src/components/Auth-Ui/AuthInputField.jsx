import { getStructuredInputError } from '../../utils/structuredInputValidation'

export function AuthInputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  variant = "default",
  className = "",
  inputRule,
  onInvalidInput,
  icon: Icon = null,
}) {
  const isAdminLogin = variant === "admin-login";

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`mb-1.5 block text-sm font-medium ${isAdminLogin ? "text-white/95" : "text-slate-700"}`}
      >
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value
            const inputError = getStructuredInputError(nextValue, inputRule)

            if (inputError) {
              onInvalidInput?.(inputError)
              return
            }

            onInvalidInput?.('')
            onChange(nextValue)
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`h-12 w-full rounded-xl border text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
            Icon ? "pl-11 pr-4" : "px-4"
          } ${
            isAdminLogin
              ? "border-white/60 bg-white text-slate-800 placeholder:text-slate-400 hover:border-white focus:border-white focus:ring-cyan-200/50 shadow-sm"
              : "bg-white text-slate-700 focus:ring-cyan-200"
          } ${
            error
              ? "border-rose-300 focus:border-rose-400 ring-2 ring-rose-200"
              : "border-slate-300 focus:border-slate-400"
          } ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""}`}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
