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
}) {
  const isAdminLogin = variant === "admin-login";

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`mb-1 block text-sm font-medium ${isAdminLogin ? "text-white/95" : "text-slate-700"}`}
      >
        {label}
      </label>
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
        className={`h-12 w-full rounded-xl border px-4 text-base transition duration-150 focus:outline-none focus:ring-4 ${
          isAdminLogin
            ? "border-white/60 bg-white text-slate-800 placeholder:text-slate-400 focus:border-white focus:ring-cyan-100/45"
            : "bg-white text-slate-700 focus:ring-cyan-200"
        } ${
          error
            ? "border-rose-300 focus:border-rose-400"
            : "border-slate-300 focus:border-slate-400"
        } ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""}`}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
