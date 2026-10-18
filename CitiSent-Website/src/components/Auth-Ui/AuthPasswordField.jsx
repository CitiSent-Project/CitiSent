import { useState } from "react";
import { FiAlertCircle, FiAlertTriangle, FiCheck, FiEye, FiEyeOff } from "react-icons/fi";

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  status = "idle",
  statusMessage = "",
  shape = "pill",
  variant = "default",
  icon: Icon = null,
  maxLength = 128,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const isAdminLogin = variant === "admin-login";

  // Backwards compatibility with legacy `error` prop
  const effectiveStatus = error ? "invalid" : status;
  const effectiveMessage = error || statusMessage;

  const isPill = shape === "pill";
  const roundedClass = isPill ? "rounded-full" : "rounded-xl";

  let statusBorderClass = "border-slate-300 focus:border-blue-500 focus:ring-blue-100 dark:border-slate-600";
  if (isAdminLogin) {
    statusBorderClass = "border-white/60 bg-white text-slate-800 placeholder:text-slate-400 hover:border-white focus:border-white focus:ring-cyan-200/50 shadow-sm";
  } else if (effectiveStatus === "valid") {
    statusBorderClass = "border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-emerald-100 text-slate-800";
  } else if (effectiveStatus === "invalid") {
    statusBorderClass = "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100 text-slate-800";
  } else if (effectiveStatus === "warning") {
    statusBorderClass = "border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-amber-100 text-slate-800";
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className={`mb-2 block text-sm font-semibold tracking-tight ${
            isAdminLogin ? "text-white/95" : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          {...rest}
          className={`h-12 w-full border text-base tracking-normal transition-all duration-200 focus:outline-none focus:ring-4 ${roundedClass} ${
            Icon ? "pl-11 pr-12" : "pl-5 pr-12"
          } ${statusBorderClass}`}
        />
        <button
          type="button"
          tabIndex={-1}
          className={`absolute inset-y-0 right-0 grid w-12 place-items-center transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isAdminLogin ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <FiEye className="h-5 w-5" /> : <FiEyeOff className="h-5 w-5" />}
        </button>
      </div>

      {effectiveMessage && (
        <div
          role={effectiveStatus === "invalid" ? "alert" : "status"}
          className={`mt-2 flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
            effectiveStatus === "invalid"
              ? "text-rose-600 dark:text-rose-400"
              : effectiveStatus === "warning"
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {effectiveStatus === "invalid" && (
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-rose-600 text-white text-[10px] font-bold">
              !
            </span>
          )}
          {effectiveStatus === "warning" && (
            <FiAlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          )}
          {effectiveStatus === "valid" && (
            <FiCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          )}
          <span>{effectiveMessage}</span>
        </div>
      )}
    </div>
  );
}
