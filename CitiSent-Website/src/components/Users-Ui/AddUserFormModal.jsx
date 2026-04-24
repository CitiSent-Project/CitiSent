import { useCallback, useRef, useState } from 'react'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { DropdownButton } from '../ui/DropdownButton'

const initialForm = {
  name: '',
  email: '',
  address: '',
  status: 'Active',
}

export function AddUserFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm)
  const dialogRef = useRef(null)

  const handleClose = useCallback(() => {
    onClose()
    setForm(initialForm)
  }, [onClose])

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
    const submitted = await onSubmit(form)

    if (submitted) {
      setForm(initialForm)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
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
        aria-label="Add user form"
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add New User</h2>
          <p className="mt-1 text-sm text-slate-500">Fill in the required user details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="janedoe@gmail.com"
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
              placeholder="San Isidro Norte"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Account Status</label>
            <DropdownButton
              className="w-full"
              ariaLabel="Account status"
              value={form.status}
              onChange={(nextStatus) => updateField('status', nextStatus)}
              options={['Active', 'Banned']}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-300 hover:bg-blue-100 transition duration-300 px-4 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg hover:bg-blue-900 transition duration-300 bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Save User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
