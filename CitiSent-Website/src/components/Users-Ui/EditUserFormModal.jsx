import { useRef, useState } from 'react'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { splitFullName } from '../../models/nameModel'

export function EditUserFormModal({ user, isOpen, onClose, onSubmit }) {
  const dialogRef = useRef(null)
  const [form, setForm] = useState(() => {
    const nameParts = splitFullName(user?.name)

    return {
      fname: user?.fname ?? nameParts.fname,
      mname: user?.mname ?? nameParts.mname,
      lname: user?.lname ?? nameParts.lname,
      email: user?.email ?? '',
      address: user?.address ?? '',
    }
  })

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
  })

  if (!isOpen || !user) {
    return null
  }

  function updateField(field, value) {
    setForm((previousForm) => ({ ...previousForm, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      ...form,
      fname: form.fname.trim(),
      mname: form.mname.trim(),
      lname: form.lname.trim(),
      email: form.email.trim().toLowerCase(),
      address: form.address.trim(),
    })
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
        aria-label="Edit user form"
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
          <p className="mt-1 text-sm text-slate-500">Update user profile details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-700">First Name</label>
              <input
                type="text"
                required
                value={form.fname}
                onChange={(event) => updateField('fname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Middle Name</label>
              <input
                type="text"
                value={form.mname}
                onChange={(event) => updateField('mname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Last Name</label>
              <input
                type="text"
                required
                value={form.lname}
                onChange={(event) => updateField('lname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              readOnly
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
