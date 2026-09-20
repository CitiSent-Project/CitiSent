import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../hooks/shared/useLastNonNull'
import { ModalShell } from '../ui/ModalShell'

/** Confirms the irreversible removal of a citizen account. */
export function DeleteUserConfirmModal({ user, isOpen, isDeleting, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const displayUser = useLastNonNull(user)

  useModalAccessibility({
    isOpen: Boolean(isOpen && displayUser),
    onClose: isDeleting ? () => {} : onCancel,
    containerRef: dialogRef,
  })

  return (
    <ModalShell
      isOpen={Boolean(isOpen && displayUser)}
      onClose={isDeleting ? () => {} : onCancel}
      dialogRef={dialogRef}
      role="alertdialog"
      ariaLabelledBy="delete-user-title"
      ariaDescribedBy="delete-user-description"
      maxWidth="max-w-md"
      closeOnBackdropClick={!isDeleting}
    >
      {displayUser && (
        <>
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700/80">
            <h2 id="delete-user-title" className="text-xl font-semibold text-slate-900 dark:text-white">
              Delete user account?
            </h2>
          </div>
          <div className="px-6 py-5 text-sm text-slate-700 dark:text-slate-300">
            <p id="delete-user-description">
              This permanently deletes the account for <strong className="text-slate-900 dark:text-white">{displayUser.name}</strong> ({displayUser.email}).
            </p>
            <p className="mt-2 text-rose-600 dark:text-rose-400">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5 dark:border-slate-700/80">
            <motion.button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              whileHover={{ scale: isDeleting ? 1 : 1.02 }}
              whileTap={{ scale: isDeleting ? 1 : 0.96 }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              whileHover={{ scale: isDeleting ? 1 : 1.02 }}
              whileTap={{ scale: isDeleting ? 1 : 0.96 }}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-rose-600 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete user'}
            </motion.button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
