import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { DropdownButton } from '../ui/DropdownButton'
import { Spinner } from '../ui/Spinner'
import { ModalShell } from '../ui/ModalShell'
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
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      dialogRef={dialogRef}
      role="dialog"
      ariaLabel="Add user form"
      maxWidth="max-w-xl"
      closeOnBackdropClick={!isSubmitting}
    >
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700/80">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add New User</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Fill in the required user details below.</p>
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
                placeholder="Jane"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Middle Name</label>
              <input
                type="text"
                value={form.mname}
                onChange={(event) => updateField('mname', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                placeholder="Santos"
                disabled={isSubmitting}
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
                placeholder="Doe"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="new-user-username">
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              placeholder="jane_doe"
              title="Use 3 to 40 letters, numbers, or underscores."
              disabled={isSubmitting}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              This is the username the person will use to sign in to the mobile app.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              placeholder="janedoe@gmail.com"
              disabled={isSubmitting}
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
                placeholder="San Isidro Norte"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                placeholder="Sto. Tomas"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Province</label>
              <input
                type="text"
                value={form.province}
                onChange={(event) => updateField('province', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                placeholder="Batangas"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700/80">
            <motion.button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.96 }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.96 }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save User'
              )}
            </motion.button>
          </div>
        </form>
    </ModalShell>
  )
}
