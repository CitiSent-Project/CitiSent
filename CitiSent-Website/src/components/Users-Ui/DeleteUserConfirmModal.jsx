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
          <div className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
            <h2 id="delete-user-title" className="text-sm font-semibold text-slate-900 dark:text-white">
              Delete user account?
            </h2>
          </div>
          <div className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
            <p id="delete-user-description">
              This permanently deletes the account for <strong className="font-semibold text-slate-900 dark:text-white">{displayUser.name}</strong> ({displayUser.email}).
            </p>
            <p className="mt-2 text-rose-600 dark:text-rose-400">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <motion.button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              whileHover={{ scale: isDeleting ? 1 : 1.01 }}
              whileTap={{ scale: isDeleting ? 1 : 0.98 }}
              className="rounded-md border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              whileHover={{ scale: isDeleting ? 1 : 1.01 }}
              whileTap={{ scale: isDeleting ? 1 : 0.98 }}
              className="flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete user'}
            </motion.button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
