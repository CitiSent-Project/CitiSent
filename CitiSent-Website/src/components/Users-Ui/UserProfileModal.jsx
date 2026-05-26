import { useRef } from 'react'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'

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
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
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
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">User Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Admin view of user details.</p>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">User ID:</span> <span className="font-numeric">{user.id}</span>
          </p>
          <p>
            <span className="font-medium text-slate-900">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-medium text-slate-900">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium text-slate-900">Barangay:</span> {user.barangay || 'Not available'}
          </p>
          <p>
            <span className="font-medium text-slate-900">City:</span> {user.city || 'Not available'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Province:</span> {user.province || 'Not available'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Status:</span> {user.status}
          </p>
          <p>
            <span className="font-medium text-slate-900">Registered:</span> <span className="font-numeric">{user.registeredAt}</span>
          </p>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
