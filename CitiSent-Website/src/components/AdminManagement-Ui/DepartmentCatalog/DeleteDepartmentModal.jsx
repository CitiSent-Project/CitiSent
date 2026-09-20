import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../../hooks/shared/useLastNonNull'
import { formatReferenceBreakdownMessage } from './utils'
import { ModalShell } from '../../ui/ModalShell'

export function DeleteDepartmentModal({ department, onClose, onDeleteDepartment, isBusy }) {
    const [deleteError, setDeleteError] = useState('')
    const [deleteWithCleanup, setDeleteWithCleanup] = useState(false)
    const deleteModalRef = useRef(null)
    const displayDept = useLastNonNull(department)

    useModalAccessibility({
        isOpen: Boolean(department && displayDept),
        onClose: onClose,
        containerRef: deleteModalRef,
    })

    async function handleConfirmDeleteDepartment(event) {
        event.preventDefault()

        const shouldCleanup = deleteWithCleanup === true
        setDeleteError('')
        
        const result = await onDeleteDepartment({
            departmentSlug: displayDept.id,
            departmentLabel: displayDept.label,
            cleanup: shouldCleanup,
        })

        if (result?.ok) {
            onClose()
            return
        }

        const referenceBreakdown = result?.details?.breakdown
        const breakdownMessage = formatReferenceBreakdownMessage(referenceBreakdown)
        const fallbackMessage = result?.message || 'Unable to delete department.'

        setDeleteError(breakdownMessage ? `${fallbackMessage} ${breakdownMessage}` : fallbackMessage)
    }

    return (
        <ModalShell
            isOpen={Boolean(department && displayDept)}
            onClose={onClose}
            dialogRef={deleteModalRef}
            role="dialog"
            ariaLabel="Delete department modal"
            maxWidth="max-w-lg"
            closeOnBackdropClick={!isBusy}
        >
            {displayDept && (
                <>
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700">
                        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Delete Department</h3>
                    </div>
                    <p className="mx-5 pt-4 text-xs text-slate-600 sm:mx-6 dark:text-slate-300">
                        This will permanently remove <span className="font-semibold text-slate-900 dark:text-white">{displayDept.label}</span>. This action cannot be undone.
                    </p>
                    <p className="mx-5 mt-1 text-[11px] text-slate-400 sm:mx-6 dark:text-slate-400">
                        Inactive departments can still be blocked when they are referenced by existing records.
                    </p>
                    <form onSubmit={handleConfirmDeleteDepartment} className="space-y-4 px-5 py-4 sm:px-6">
                        <label className="flex items-start gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                            <input
                                type="checkbox"
                                required
                                checked={deleteWithCleanup}
                                disabled={isBusy}
                                onChange={(event) => setDeleteWithCleanup(event.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                            />
                            <span className="font-medium">Also remove linked reports and clear department references.</span>
                        </label>
                        <p className="-mt-2 text-[11px] text-slate-400">
                            Use cleanup only for inactive departments when you intentionally want destructive removal.
                        </p>
                        {deleteError ? (
                            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                {deleteError}
                            </p>
                        ) : null}

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
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
                                disabled={isBusy || !deleteWithCleanup}
                                whileHover={{ scale: (isBusy || !deleteWithCleanup) ? 1 : 1.02 }}
                                whileTap={{ scale: (isBusy || !deleteWithCleanup) ? 1 : 0.96 }}
                                className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 shadow-xs shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                            >
                                {isBusy ? 'Deleting...' : 'Delete Department'}
                            </motion.button>
                        </div>
                    </form>
                </>
            )}
        </ModalShell>
    )
}
