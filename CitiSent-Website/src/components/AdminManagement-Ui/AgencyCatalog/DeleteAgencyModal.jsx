import { useRef, useState, useEffect } from 'react'
import { useModalAccessibility } from '../../../hooks/shared/useModalAccessibility'
import { formatReferenceBreakdownMessage } from './utils'

export function DeleteAgencyModal({ department, onClose, onDeleteDepartment, isBusy }) {
    const [deleteError, setDeleteError] = useState('')
    const [deleteWithCleanup, setDeleteWithCleanup] = useState(false)
    const deleteModalRef = useRef(null)

    useModalAccessibility({
        isOpen: Boolean(department),
        onClose: onClose,
        containerRef: deleteModalRef,
    })

    useEffect(() => {
        if (department) {
            setDeleteError('')
            setDeleteWithCleanup(false)
        }
    }, [department])

    if (!department) return null

    async function handleConfirmDeleteDepartment(event) {
        event.preventDefault()

        const shouldCleanup = deleteWithCleanup === true
        setDeleteError('')
        
        const result = await onDeleteDepartment({
            departmentSlug: department.id,
            departmentLabel: department.label,
            cleanup: shouldCleanup,
        })

        if (result?.ok) {
            onClose()
            return
        }

        const referenceBreakdown = result?.details?.breakdown
        const breakdownMessage = formatReferenceBreakdownMessage(referenceBreakdown)
        const fallbackMessage = result?.message || 'Unable to delete agency.'

        setDeleteError(breakdownMessage ? `${fallbackMessage} ${breakdownMessage}` : fallbackMessage)
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
                ref={deleteModalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Delete agency modal"
                tabIndex={-1}
                className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] border border-slate-100"
            >
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h3 className="text-base font-bold tracking-tight text-slate-900">Delete Agency</h3>
                </div>
                <p className="mx-5 pt-4 text-xs text-slate-600 sm:mx-6">
                    This will permanently remove <span className="font-semibold text-slate-900">{department.label}</span>. This action cannot be undone.
                </p>
                <p className="mx-5 mt-1 text-[11px] text-slate-400 sm:mx-6">
                    Inactive agencies can still be blocked when they are referenced by existing records.
                </p>
                <form onSubmit={handleConfirmDeleteDepartment} className="space-y-4 px-5 py-4 sm:px-6">
                    <label className="flex items-start gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3 text-xs text-rose-900">
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
                        Use cleanup only for inactive agencies when you intentionally want destructive removal.
                    </p>
                    {deleteError ? (
                        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                            {deleteError}
                        </p>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isBusy || !deleteWithCleanup}
                            className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 active:scale-[0.98] shadow-xs shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                        >
                            {isBusy ? 'Deleting...' : 'Delete Agency'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
