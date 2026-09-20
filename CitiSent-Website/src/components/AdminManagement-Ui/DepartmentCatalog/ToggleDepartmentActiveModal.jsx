import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../../hooks/shared/useLastNonNull'
import { ModalShell } from '../../ui/ModalShell'

export function ToggleDepartmentActiveModal({ department, onClose, onToggleDepartmentActive, isBusy }) {
    const [toggleError, setToggleError] = useState('')
    const modalRef = useRef(null)
    const displayDept = useLastNonNull(department)

    useModalAccessibility({
        isOpen: Boolean(department && displayDept),
        onClose: onClose,
        containerRef: modalRef,
    })

    const willActivate = displayDept ? !displayDept.isActive : true

    async function handleConfirmToggle(event) {
        event.preventDefault()
        setToggleError('')
        
        try {
            await onToggleDepartmentActive(displayDept)
            onClose()
        } catch (error) {
            setToggleError(error.message || 'Unable to update department status.')
        }
    }

    return (
        <ModalShell
            isOpen={Boolean(department && displayDept)}
            onClose={onClose}
            dialogRef={modalRef}
            role="dialog"
            ariaLabel={`${willActivate ? 'Activate' : 'Deactivate'} department modal`}
            maxWidth="max-w-lg"
            closeOnBackdropClick={!isBusy}
        >
            {displayDept && (
                <>
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700">
                        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                            {willActivate ? 'Activate Department' : 'Deactivate Department'}
                        </h3>
                    </div>
                    <div className="mx-5 pt-4 text-sm text-slate-600 sm:mx-6 dark:text-slate-300">
                        {willActivate ? (
                            <p>
                                You are about to activate <span className="font-semibold text-slate-900 dark:text-white">{displayDept.label}</span>. 
                                <br/><br/>
                                Users will be able to see this department and submit new reports to it.
                            </p>
                        ) : (
                            <p>
                                You are about to deactivate <span className="font-semibold text-slate-900 dark:text-white">{displayDept.label}</span>.
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
                            <motion.button
                                type="button"
                                onClick={onClose}
                                disabled={isBusy}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="submit"
                                disabled={isBusy}
                                whileHover={{ scale: isBusy ? 1 : 1.02 }}
                                whileTap={{ scale: isBusy ? 1 : 0.96 }}
                                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer ${
                                    willActivate 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-500/20' 
                                        : 'bg-amber-600 hover:bg-amber-700 shadow-xs shadow-amber-500/20'
                                }`}
                            >
                                {isBusy ? 'Processing...' : willActivate ? 'Confirm Activation' : 'Confirm Deactivation'}
                            </motion.button>
                        </div>
                    </form>
                </>
            )}
        </ModalShell>
    )
}
