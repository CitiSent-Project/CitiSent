import { useCallback, useRef, useState } from 'react'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { DropdownButton } from '../ui/DropdownButton'
import { Spinner } from '../ui/Spinner'
import { getStructuredInputError } from '../../utils/structuredInputValidation'

const initialForm = {
  fname: '',
  mname: '',
  lname: '',
  username: '',
  email: '',
  barangay: '',
  city: 'Sto. Tomas',
  province: 'Batangas',
  status: 'Active',
}

export function AddUserFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputError, setInputError] = useState('')
  const dialogRef = useRef(null)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
    setForm(initialForm)
    setInputError('')
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
    const ruleByField = {
      fname: 'name',
      mname: 'name',
      lname: 'name',
      username: 'username',
      email: 'email',
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
          {inputError ? (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {inputError}
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-700">First Name</label>
              <input
                type="text"
                required
                value={form.fname}
                onChange={(event) => updateField('fname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                placeholder="Jane"
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
                placeholder="Doe"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700" htmlFor="new-user-username">
              Username
            </label>
            <input
              id="new-user-username"
              type="text"
              required
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9_]+"
              autoCapitalize="none"
              autoComplete="username"
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="jane_doe"
              title="Use 3 to 40 letters, numbers, or underscores."
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500">
              This is the username the person will use to sign in to the mobile app.
            </p>
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
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 hover:bg-blue-100 transition duration-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg hover:bg-blue-900 transition duration-300 bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
