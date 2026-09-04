import { useRef } from 'react'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'

export function UserProfileModal({ user, isOpen, onClose }) {
  const dialogRef = useRef(null)

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
  })

  if (!isOpen || !user) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity dark:bg-slate-900/60"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="User profile details"
        tabIndex={-1}
        className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-slate-900/50"
      >
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700/80">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Profile</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Admin view of user details.</p>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="font-medium text-slate-500 dark:text-slate-400">User ID</span>
            <span className="font-numeric font-medium text-slate-900 dark:text-white">{user.id}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="font-medium text-slate-500 dark:text-slate-400">Name</span>
            <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="font-medium text-slate-500 dark:text-slate-400">Email</span>
            <span className="font-medium text-slate-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="font-medium text-slate-500 dark:text-slate-400">Location</span>
            <span className="text-right font-medium text-slate-900 dark:text-white">
              {[user.barangay, user.city, user.province].filter(Boolean).join(', ') || 'Not available'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="font-medium text-slate-500 dark:text-slate-400">Status</span>
            <span className="font-medium text-slate-900 dark:text-white">{user.status}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400">Registered</span>
            <span className="font-numeric font-medium text-slate-900 dark:text-white">{user.registeredAt}</span>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-5 dark:border-slate-700/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
