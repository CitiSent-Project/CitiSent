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
  departmentId: '',
}

export function AddAdminFormModal({ isOpen, onClose, onSubmit, departmentOptions = [] }) {
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

    if (!form.departmentId) {
      setInputError('Select a department before saving this admin account.')
      return
    }

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
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      dialogRef={dialogRef}
      role="dialog"
      ariaLabel="Add admin form"
      maxWidth="max-w-lg"
      closeOnBackdropClick={!isSubmitting}
    >
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add New Admin</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Fill in the required details below. An activation email will be sent to the admin's
          email address.
        </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-5">
          {inputError ? (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {inputError}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">First Name</label>
              <input
                type="text"
                required
                value={form.fname}
                onChange={(event) => updateField('fname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                placeholder="Juan"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Middle Name</label>
              <input
                type="text"
                value={form.mname}
                onChange={(event) => updateField('mname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                placeholder="Santos"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Last Name</label>
              <input
                type="text"
                required
                value={form.lname}
                onChange={(event) => updateField('lname', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                placeholder="Dela Cruz"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Username</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9_]+"
              autoCapitalize="none"
              autoComplete="username"
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
              placeholder="juan_dela_cruz"
              title="Use 3 to 40 letters, numbers, or underscores."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
              placeholder="admin@citisent.gov.ph"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300" htmlFor="new-admin-department">
              Department <span aria-hidden="true">*</span>
            </label>
            <DropdownButton
              className="w-full"
              id="new-admin-department"
              name="departmentId"
              ariaLabel="Select department (required)"
              ariaInvalid={!form.departmentId && Boolean(inputError)}
              value={form.departmentId}
              onChange={(value) => updateField('departmentId', value)}
              options={departmentDropdownOptions}
              placeholder="Select a department"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Each office admin must be assigned to an active department.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Barangay</label>
              <input
                type="text"
                required
                value={form.barangay}
                onChange={(event) => updateField('barangay', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                placeholder="San Isidro Norte"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300" htmlFor="new-admin-city">
                City
              </label>
              <input
                id="new-admin-city"
                type="text"
                value={form.city}
                readOnly
                disabled
                aria-disabled="true"
                tabIndex={-1}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed select-none focus:outline-none dark:border-slate-700/80 dark:bg-slate-900/40 dark:text-slate-400"
                placeholder="Sto. Tomas"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300" htmlFor="new-admin-province">
                Province
              </label>
              <input
                id="new-admin-province"
                type="text"
                value={form.province}
                readOnly
                disabled
                aria-disabled="true"
                tabIndex={-1}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed select-none focus:outline-none dark:border-slate-700/80 dark:bg-slate-900/40 dark:text-slate-400"
                placeholder="Batangas"
              />
            </div>
          </div>

          <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:justify-end dark:border-slate-700">
            <motion.button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.96 }}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition duration-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.96 }}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70 sm:py-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Admin'
              )}
            </motion.button>
          </div>
        </form>
    </ModalShell>
  )
}
