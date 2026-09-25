import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  variant = "default",
  icon: Icon = null,
}) {
  const [visible, setVisible] = useState(false);
  const isAdminLogin = variant === "admin-login";

  return (
    <div>
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
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
            Icon ? "pl-11 pr-11" : "pl-4 pr-11"
          } ${
            isAdminLogin
              ? "border-white/60 bg-white text-slate-800 placeholder:text-slate-400 hover:border-white focus:border-white focus:ring-cyan-200/50 shadow-sm"
              : "bg-white text-slate-700 focus:ring-cyan-200"
          } ${
            error
              ? "border-rose-300 focus:border-rose-400 ring-2 ring-rose-200"
              : "border-slate-300 focus:border-slate-400"
          }`}
        />
        <button
          type="button"
          className={`absolute inset-y-0 right-0 grid w-11 place-items-center transition hover:scale-110 ${
            isAdminLogin ? "text-slate-500 hover:text-slate-800" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
