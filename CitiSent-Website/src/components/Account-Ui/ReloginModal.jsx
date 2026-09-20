import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { ModalShell } from '../ui/ModalShell'

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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onConfirmLogout}
      dialogRef={dialogRef}
      role="alertdialog"
      ariaLabelledBy="relogin-title"
      ariaDescribedBy="relogin-desc"
      maxWidth="max-w-md"
      className="p-6"
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

      <motion.button
        type="button"
        onClick={onConfirmLogout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="mt-6 w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
      >
        Re‑login now
      </motion.button>
    </ModalShell>
  )
}
