import { useRef, useState } from 'react'
import { useModalAccessibility } from '../../../hooks/shared/useModalAccessibility'

export function ToggleDepartmentActiveModal({ department, onClose, onToggleDepartmentActive, isBusy }) {
    const [toggleError, setToggleError] = useState('')
    const modalRef = useRef(null)

    useModalAccessibility({
        isOpen: Boolean(department),
        onClose: onClose,
        containerRef: modalRef,
    })

    if (!department) return null

    const willActivate = !department.isActive

    async function handleConfirmToggle(event) {
        event.preventDefault()
        setToggleError('')
        
        try {
            await onToggleDepartmentActive(department)
            onClose()
        } catch (error) {
            setToggleError(error.message || 'Unable to update department status.')
        }
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
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label={`${willActivate ? 'Activate' : 'Deactivate'} department modal`}
                tabIndex={-1}
                className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] border border-slate-100 dark:border-slate-700 dark:bg-slate-800"
            >
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700">
                    <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                        {willActivate ? 'Activate Department' : 'Deactivate Department'}
                    </h3>
                </div>
                <div className="mx-5 pt-4 text-sm text-slate-600 sm:mx-6 dark:text-slate-300">
                    {willActivate ? (
                        <p>
                            You are about to activate <span className="font-semibold text-slate-900 dark:text-white">{department.label}</span>. 
                            <br/><br/>
                            Users will be able to see this department and submit new reports to it.
                        </p>
                    ) : (
                        <p>
                            You are about to deactivate <span className="font-semibold text-slate-900 dark:text-white">{department.label}</span>.
                            <br/><br/>
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                Users will no longer be able to select this department when creating new reports.
                            </span> Existing reports will be preserved.
                        </p>
                    )}
                </div>
                
                <form onSubmit={handleConfirmToggle} className="space-y-4 px-5 py-4 sm:px-6">
                    {toggleError ? (
                        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                            {toggleError}
                        </p>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isBusy}
                            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer ${
                                willActivate 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-500/20' 
                                    : 'bg-amber-600 hover:bg-amber-700 shadow-xs shadow-amber-500/20'
                            }`}
                        >
                            {isBusy ? 'Processing...' : willActivate ? 'Confirm Activation' : 'Confirm Deactivation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
