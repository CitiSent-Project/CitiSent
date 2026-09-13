import { useRef, useState } from 'react'
import { useModalAccessibility } from '../../../hooks/shared/useModalAccessibility'
import { getStructuredInputError } from '../../../utils/structuredInputValidation'
import { toSlug } from './utils'

export function RenameDepartmentModal({ department, onClose, onUpdateDepartment, isBusy }) {
    const [renameName, setRenameName] = useState(() => department?.label ?? '')
    const [renameSlug, setRenameSlug] = useState(() => department?.slug ?? department?.id ?? '')
    const [renameError, setRenameError] = useState('')
    const renameModalRef = useRef(null)

    useModalAccessibility({
        isOpen: Boolean(department),
        onClose: onClose,
        containerRef: renameModalRef,
    })

    if (!department) return null

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

        if (nextName === department.label && nextSlug === (department.slug || department.id)) {
            onClose()
            return
        }

        setRenameError('')
        const result = await onUpdateDepartment({
            departmentSlug: department.id,
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
        <div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 backdrop-blur-xs sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose()
                }
            }}
        >
            <div
                ref={renameModalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Rename department modal"
                tabIndex={-1}
                className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] border border-slate-100 dark:border-slate-700 dark:bg-slate-800"
            >
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700/80">
                    <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Rename Department</h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Update the display name for {department.label}.
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
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isBusy}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] shadow-xs shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                        >
                            {isBusy ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
