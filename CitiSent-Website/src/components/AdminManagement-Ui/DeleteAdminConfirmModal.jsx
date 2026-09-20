import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../hooks/shared/useLastNonNull'
import { ModalShell } from '../ui/ModalShell'

/** Confirms the irreversible removal of an office admin account. */
export function DeleteAdminConfirmModal({ admin, isOpen, isDeleting, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const displayAdmin = useLastNonNull(admin)

  useModalAccessibility({
    isOpen: Boolean(isOpen && displayAdmin),
    onClose: isDeleting ? () => {} : onCancel,
    containerRef: dialogRef,
  })

  return (
    <ModalShell
      isOpen={Boolean(isOpen && displayAdmin)}
      onClose={isDeleting ? () => {} : onCancel}
      dialogRef={dialogRef}
      role="alertdialog"
      ariaLabelledBy="delete-admin-title"
      ariaDescribedBy="delete-admin-description"
      maxWidth="max-w-md"
      closeOnBackdropClick={!isDeleting}
    >
      {displayAdmin && (
        <>
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h2 id="delete-admin-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Delete office admin account?
            </h2>
          </div>
          <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
            <p id="delete-admin-description">
              This permanently deletes the admin account for{' '}
              <strong className="text-slate-900 dark:text-white">
                {displayAdmin.fullName || displayAdmin.name || displayAdmin.username}
              </strong>{' '}
              ({displayAdmin.email}).
            </p>
            <p className="mt-2 font-medium text-rose-700 dark:text-rose-400">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
            <motion.button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              whileHover={{ scale: isDeleting ? 1 : 1.02 }}
              whileTap={{ scale: isDeleting ? 1 : 0.96 }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              whileHover={{ scale: isDeleting ? 1 : 1.02 }}
              whileTap={{ scale: isDeleting ? 1 : 0.96 }}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Admin'}
            </motion.button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
