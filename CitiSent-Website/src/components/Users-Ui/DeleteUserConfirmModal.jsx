import { useRef } from 'react'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'

/** Confirms the irreversible removal of a citizen account. */
export function DeleteUserConfirmModal({ user, isOpen, isDeleting, onCancel, onConfirm }) {
  const dialogRef = useRef(null)

  useModalAccessibility({
    isOpen,
    onClose: isDeleting ? () => {} : onCancel,
    containerRef: dialogRef,
  })

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity dark:bg-slate-900/60">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-description"
        tabIndex={-1}
        className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-slate-900/50"
      >
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700/80">
          <h2 id="delete-user-title" className="text-xl font-semibold text-slate-900 dark:text-white">
            Delete user account?
          </h2>
        </div>
        <div className="px-6 py-5 text-sm text-slate-700 dark:text-slate-300">
          <p id="delete-user-description">
            This permanently deletes the account for <strong className="text-slate-900 dark:text-white">{user.name}</strong> ({user.email}).
          </p>
          <p className="mt-2 text-rose-600 dark:text-rose-400">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5 dark:border-slate-700/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-rose-600"
          >
            {isDeleting ? 'Deleting...' : 'Delete user'}
          </button>
        </div>
      </div>
    </div>
  )
}
