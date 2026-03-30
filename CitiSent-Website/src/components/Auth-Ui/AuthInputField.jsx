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
}) {
  const isAdminLogin = variant === "admin-login";

  return (
    <div>
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
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
          isAdminLogin
            ? "border-white/50 bg-white text-slate-700 placeholder:text-slate-400 focus:border-white focus:ring-cyan-200/70"
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
