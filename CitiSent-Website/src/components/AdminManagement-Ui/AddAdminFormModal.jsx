import { useCallback, useRef, useState } from 'react'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { DropdownButton } from '../ui/DropdownButton'
import { Spinner } from '../ui/Spinner'

const initialForm = {
  fname: '',
  mname: '',
  lname: '',
  email: '',
  barangay: '',
  city: 'Sto. Tomas',
  province: 'Batangas',
  departmentId: '',
}

export function AddAdminFormModal({ isOpen, onClose, onSubmit, departmentOptions = [] }) {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dialogRef = useRef(null)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
    setForm(initialForm)
  }, [onClose, isSubmitting])

  useModalAccessibility({
    isOpen,
    onClose: handleClose,
    containerRef: dialogRef,
  })

  if (!isOpen) {
    return null
  }

  function updateField(field, value) {
    setForm((previousForm) => ({ ...previousForm, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const submitted = await onSubmit(form)
      if (submitted) {
        setForm(initialForm)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const departmentDropdownOptions = departmentOptions.map((department) => ({
    value: department.id,
    label: department.label,
  }))

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add admin form"
        tabIndex={-1}
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl"
      >
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-slate-900">Add New Admin</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the required details below. An activation email will be sent to the admin's
            email address.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-700">First Name</label>
              <input
                type="text"
                required
                value={form.fname}
                onChange={(event) => updateField('fname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                placeholder="Juan"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Middle Name</label>
              <input
                type="text"
                value={form.mname}
                onChange={(event) => updateField('mname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                placeholder="Santos"
                disabled={isSubmitting}
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
                placeholder="Dela Cruz"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="admin@citisent.gov.ph"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Department</label>
            <DropdownButton
              className="w-full"
              ariaLabel="Select department"
              value={form.departmentId}
              onChange={(value) => updateField('departmentId', value)}
              options={departmentDropdownOptions}
              placeholder="Select a department"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-700">Barangay</label>
              <input
                type="text"
                required
                value={form.barangay}
                onChange={(event) => updateField('barangay', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                placeholder="San Isidro Norte"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                placeholder="Sto. Tomas"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Province</label>
              <input
                type="text"
                value={form.province}
                onChange={(event) => updateField('province', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                placeholder="Batangas"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition duration-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70 sm:py-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Admin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
