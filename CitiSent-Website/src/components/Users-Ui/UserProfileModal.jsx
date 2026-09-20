import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../hooks/shared/useLastNonNull'
import { ModalShell } from '../ui/ModalShell'

export function UserProfileModal({ user, isOpen, onClose }) {
  const dialogRef = useRef(null)
  const displayUser = useLastNonNull(user)

  useModalAccessibility({
    isOpen: Boolean(isOpen && displayUser),
    onClose,
    containerRef: dialogRef,
  })

  return (
    <ModalShell
      isOpen={Boolean(isOpen && displayUser)}
      onClose={onClose}
      dialogRef={dialogRef}
      role="dialog"
      ariaLabel="User profile details"
      maxWidth="max-w-md"
    >
      {displayUser && (
        <>
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700/80">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Profile</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Admin view of user details.</p>
          </div>

          <div className="space-y-4 px-6 py-5 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">User ID</span>
              <span className="font-numeric font-medium text-slate-900 dark:text-white">{displayUser.displayId || displayUser.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">Name</span>
              <span className="font-medium text-slate-900 dark:text-white">{displayUser.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-medium text-slate-900 dark:text-white">{displayUser.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">Location</span>
              <span className="text-right font-medium text-slate-900 dark:text-white">
                {[displayUser.barangay, displayUser.city, displayUser.province].filter(Boolean).join(', ') || 'Not available'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">Status</span>
              <span className="font-medium text-slate-900 dark:text-white">{displayUser.status}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="font-medium text-slate-500 dark:text-slate-400">Registered</span>
              <span className="font-numeric font-medium text-slate-900 dark:text-white">{displayUser.registeredAt}</span>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 px-6 py-5 dark:border-slate-700/80">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer"
            >
              Close
            </motion.button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
