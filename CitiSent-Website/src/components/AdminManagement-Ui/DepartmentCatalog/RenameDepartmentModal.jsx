import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../../hooks/shared/useLastNonNull'
import { getStructuredInputError } from '../../../utils/structuredInputValidation'
import { toSlug } from './utils'
import { ModalShell } from '../../ui/ModalShell'

export function RenameDepartmentModal({ department, onClose, onUpdateDepartment, isBusy }) {
    const displayDept = useLastNonNull(department)

    const [renameName, setRenameName] = useState(() => displayDept?.label ?? '')
    const [renameSlug, setRenameSlug] = useState(() => displayDept?.slug ?? displayDept?.id ?? '')
    const [renameError, setRenameError] = useState('')
    const renameModalRef = useRef(null)

    useModalAccessibility({
        isOpen: Boolean(department && displayDept),
        onClose: onClose,
        containerRef: renameModalRef,
    })

    async function handleSubmitRenameDepartment(event) {
        event.preventDefault()

        const nextName = String(renameName || '').trim()
        const nextSlug = toSlug(renameSlug)
        if (!nextName) {
            setRenameError('Department name is required.')
            return
        }

        if (!nextSlug) {
            setRenameError('A valid slug is required (letters, numbers, and hyphens only).')
            return
        }

        if (displayDept && nextName === displayDept.label && nextSlug === (displayDept.slug || displayDept.id)) {
            onClose()
            return
        }

        setRenameError('')
        const result = await onUpdateDepartment({
            departmentSlug: displayDept?.id,
            name: nextName,
            slug: nextSlug,
        })

        if (result?.ok) {
            onClose()
            return
        }

        setRenameError(result?.message || 'Unable to update department name.')
    }

    return (
        <ModalShell
            isOpen={Boolean(department && displayDept)}
            onClose={onClose}
            dialogRef={renameModalRef}
            role="dialog"
            ariaLabel="Rename department modal"
            maxWidth="max-w-lg"
            closeOnBackdropClick={!isBusy}
        >
            {displayDept && (
                <>
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700/80">
                        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Rename Department</h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Update the display name for {displayDept.label}.
                        </p>
                    </div>

                    <form onSubmit={handleSubmitRenameDepartment} className="space-y-4 px-5 py-5 sm:px-6">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Department Name</label>
                            <input
                                type="text"
                                value={renameName}
                                onChange={(event) => {
                                    const inputError = getStructuredInputError(event.target.value, 'location')
                                    if (inputError) {
                                        setRenameError(inputError)
                                        return
                                    }
                                    setRenameError('')
                                    setRenameName(event.target.value)
                                }}
                                placeholder="City Treasury Office"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white dark:placeholder-slate-500"
                            />
                            {renameError ? <p className="mt-1 text-xs text-rose-600 font-medium dark:text-rose-400">{renameError}</p> : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Slug</label>
                            <input
                                type="text"
                                value={renameSlug}
                                onChange={(event) => {
                                    const nextSlug = event.target.value
                                    if (!/^[a-z0-9-]*$/.test(nextSlug)) {
                                        setRenameError('Slug may contain lowercase letters, numbers, and hyphens only.')
                                        return
                                    }
                                    setRenameError('')
                                    setRenameSlug(nextSlug)
                                }}
                                placeholder="city-treasury-office"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white dark:placeholder-slate-500"
                            />
                            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Use lowercase letters, numbers, and hyphens.</p>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700/80">
                            <motion.button
                                type="button"
                                onClick={onClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="submit"
                                disabled={isBusy}
                                whileHover={{ scale: isBusy ? 1 : 1.02 }}
                                whileTap={{ scale: isBusy ? 1 : 0.96 }}
                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-xs shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                            >
                                {isBusy ? 'Saving...' : 'Save Changes'}
                            </motion.button>
                        </div>
                    </form>
                </>
            )}
        </ModalShell>
    )
}
