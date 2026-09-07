import { useRef } from 'react'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'

/**
 * ReloginModal
 * -----------
 * Displayed after an admin changes their email address.
 * Because email is a credential, the session is invalidated and the admin
 * must sign in again with the new email. The modal explains why and offers
 * a single action: "Re‑login now".
 */
export function ReloginModal({ isOpen, onConfirmLogout }) {
  const dialogRef = useRef(null)

  // Trap focus inside the modal and allow Escape to trigger re‑login
  useModalAccessibility({
    isOpen,
    onClose: onConfirmLogout,
    containerRef: dialogRef,
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="relogin-title"
        aria-describedby="relogin-desc"
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:border dark:border-slate-700 dark:bg-slate-800"
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2
          id="relogin-title"
          className="text-center text-lg font-semibold text-slate-900 dark:text-white"
        >
          Email address changed
        </h2>

        <p
          id="relogin-desc"
          className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          Your email address has been updated successfully. For security
          purposes, you need to sign in again with your new credentials.
        </p>

        <button
          type="button"
          onClick={onConfirmLogout}
          className="mt-6 w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Re‑login now
        </button>
      </div>
    </div>
  )
}
