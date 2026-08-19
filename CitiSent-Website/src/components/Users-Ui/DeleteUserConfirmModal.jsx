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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-description"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="delete-user-title" className="text-lg font-semibold text-slate-900">
            Delete user account?
          </h2>
        </div>
        <div className="px-5 py-4 text-sm text-slate-700">
          <p id="delete-user-description">
            This permanently deletes the account for <strong>{user.name}</strong> ({user.email}).
          </p>
          <p className="mt-2 text-rose-700">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? 'Deleting...' : 'Delete user'}
          </button>
        </div>
      </div>
    </div>
  )
}
