import { useRef, useState } from 'react'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { splitFullName } from '../../models/nameModel'
import { getStructuredInputError } from '../../utils/structuredInputValidation'

export function EditUserFormModal({ user, isOpen, onClose, onSubmit }) {
  const dialogRef = useRef(null)
  const [form, setForm] = useState(() => {
    const nameParts = splitFullName(user?.name)

    return {
      fname: user?.fname ?? nameParts.fname,
      mname: user?.mname ?? nameParts.mname,
      lname: user?.lname ?? nameParts.lname,
      email: user?.email ?? '',
      barangay: user?.barangay ?? '',
      city: user?.city ?? '',
      province: user?.province ?? '',
    }
  })
  const [inputError, setInputError] = useState('')

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
  })

  if (!isOpen || !user) {
    return null
  }

  function updateField(field, value) {
    const ruleByField = {
      fname: 'name',
      mname: 'name',
      lname: 'name',
      barangay: 'location',
      city: 'location',
      province: 'location',
    }
    const error = getStructuredInputError(value, ruleByField[field])

    if (error) {
      setInputError(error)
      return
    }

    setInputError('')
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
      barangay: form.barangay.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
    })
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
        aria-label="Edit user form"
        tabIndex={-1}
        className="animate-in fade-in zoom-in-95 w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-slate-900/50"
      >
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700/80">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit User</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Update user profile details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {inputError ? (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              {inputError}
            </p>
          ) : null}
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
              <input
                type="text"
                required
                value={form.fname}
                onChange={(event) => updateField('fname', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Middle Name</label>
              <input
                type="text"
                value={form.mname}
                onChange={(event) => updateField('mname', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
              <input
                type="text"
                required
                value={form.lname}
                onChange={(event) => updateField('lname', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              value={form.email}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Barangay</label>
              <input
                type="text"
                required
                value={form.barangay}
                onChange={(event) => updateField('barangay', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Province</label>
              <input
                type="text"
                value={form.province}
                onChange={(event) => updateField('province', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
