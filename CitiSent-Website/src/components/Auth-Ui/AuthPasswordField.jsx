import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export function AuthPasswordField({ id, label, value, onChange, placeholder, error, variant = 'default' }) {
  const [visible, setVisible] = useState(false)
  const isFigmaLogin = variant === 'figma-login'

  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1 block text-sm font-medium ${isFigmaLogin ? 'text-white/95' : 'text-slate-700'}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border px-3 py-2 pr-11 text-sm transition focus:outline-none focus:ring-2 ${
            isFigmaLogin
              ? 'border-white/50 bg-white text-slate-700 placeholder:text-slate-400 focus:border-white focus:ring-cyan-200/70'
              : 'bg-white text-slate-700 focus:ring-cyan-200'
          } ${
            error ? 'border-rose-300 focus:border-rose-400' : 'border-slate-300 focus:border-slate-400'
          }`}
        />
        <button
          type="button"
          className={`absolute inset-y-1 right-1 grid w-8 place-items-center text-blue-900 ${
            isFigmaLogin ? 'hover:bg-blue-100' : 'hover:bg-blue-100'
          }`}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}
