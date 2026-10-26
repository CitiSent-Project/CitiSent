import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { DropdownButton } from '../ui/DropdownButton'
import { Spinner } from '../ui/Spinner'
import { ModalShell } from '../ui/ModalShell'
import { getStructuredInputError } from '../../utils/structuredInputValidation'
import { fetchStoTomasBatangasBarangays } from '../../services/locationData'

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
  const [barangayOptions, setBarangayOptions] = useState([])
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function loadBarangays() {
      setIsLoadingBarangays(true)
      try {
        const barangays = await fetchStoTomasBatangasBarangays()
        if (isMounted) {
          setBarangayOptions(barangays)
        }
      } catch {
        if (isMounted) {
          setBarangayOptions([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingBarangays(false)
        }
      }
    }

    if (isOpen) {
      loadBarangays()
    }

    return () => {
      isMounted = false
    }
  }, [isOpen])

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

    if (!form.barangay) {
      setInputError('Select a barangay before saving this admin account.')
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

  const barangayDropdownOptions = useMemo(
    () =>
      barangayOptions.map((name) => ({
        value: name,
        label: name,
      })),
    [barangayOptions]
  )

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
      <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Add New Admin</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Fill in the required details below. An activation email will be sent to the admin's email address.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 px-4 py-3.5 sm:px-5">
        {inputError ? (
          <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {inputError}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">First Name</label>
            <input
              type="text"
              required
              value={form.fname}
              onChange={(event) => updateField('fname', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
              placeholder="Juan"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Middle Name</label>
            <input
              type="text"
              value={form.mname}
              onChange={(event) => updateField('mname', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
              placeholder="Santos"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Last Name</label>
            <input
              type="text"
              required
              value={form.lname}
              onChange={(event) => updateField('lname', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
              placeholder="Dela Cruz"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Username</label>
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
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            placeholder="juan_dela_cruz"
            title="Use 3 to 40 letters, numbers, or underscores."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            placeholder="admin@citisent.gov.ph"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="new-admin-department">
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
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Each office admin must be assigned to an active department.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="new-admin-barangay">
              Barangay <span aria-hidden="true">*</span>
            </label>
            <DropdownButton
              className="w-full"
              id="new-admin-barangay"
              name="barangay"
              ariaLabel="Select barangay (required)"
              ariaInvalid={!form.barangay && Boolean(inputError)}
              value={form.barangay}
              onChange={(value) => updateField('barangay', value)}
              options={barangayDropdownOptions}
              placeholder={isLoadingBarangays ? 'Loading barangays...' : 'Select a barangay'}
              disabled={isSubmitting || isLoadingBarangays}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="new-admin-city">
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
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 cursor-not-allowed select-none focus:outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
              placeholder="Sto. Tomas"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="new-admin-province">
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
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 cursor-not-allowed select-none focus:outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
              placeholder="Batangas"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3.5 dark:border-slate-800">
          <motion.button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="rounded-md border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
