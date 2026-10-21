import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../hooks/shared/useLastNonNull'
import { splitFullName } from '../../models/nameModel'
import { getStructuredInputError } from '../../utils/structuredInputValidation'
import { ModalShell } from '../ui/ModalShell'

export function EditUserFormModal({ user, isOpen, onClose, onSubmit }) {
  const dialogRef = useRef(null)
  const displayUser = useLastNonNull(user)

  const [form, setForm] = useState(() => {
    const nameParts = splitFullName(displayUser?.name)

    return {
      fname: displayUser?.fname ?? nameParts.fname,
      mname: displayUser?.mname ?? nameParts.mname,
      lname: displayUser?.lname ?? nameParts.lname,
      email: displayUser?.email ?? '',
      barangay: displayUser?.barangay ?? '',
      city: displayUser?.city ?? '',
      province: displayUser?.province ?? '',
    }
  })
  const [inputError, setInputError] = useState('')

  useModalAccessibility({
    isOpen: Boolean(isOpen && displayUser),
    onClose,
    containerRef: dialogRef,
  })

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
    <ModalShell
      isOpen={Boolean(isOpen && displayUser)}
      onClose={onClose}
      dialogRef={dialogRef}
      role="dialog"
      ariaLabel="Edit user form"
      maxWidth="max-w-xl"
    >
      <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Edit User</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Update user profile details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 px-4 py-3.5 sm:px-5">
        {inputError ? (
          <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {inputError}
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">First Name</label>
            <input
              type="text"
              required
              value={form.fname}
              onChange={(event) => updateField('fname', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Middle Name</label>
            <input
              type="text"
              value={form.mname}
              onChange={(event) => updateField('mname', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
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
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Barangay</label>
            <input
              type="text"
              required
              value={form.barangay}
              onChange={(event) => updateField('barangay', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Province</label>
            <input
              type="text"
              value={form.province}
              onChange={(event) => updateField('province', event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3.5 dark:border-slate-800">
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            Save Changes
          </motion.button>
        </div>
      </form>
    </ModalShell>
  )
}
