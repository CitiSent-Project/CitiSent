import { useRef } from 'react'
import { FiUploadCloud } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useModalAccessibility } from '../../../hooks/shared/useModalAccessibility'
import { useLastNonNull } from '../../../hooks/shared/useLastNonNull'
import { ModalShell } from '../../ui/ModalShell'

export function RemoveLogoModal({ department, onClose, onDeleteDepartmentLogo, isBusy, logoError }) {
    const removeLogoModalRef = useRef(null)
    const displayDept = useLastNonNull(department)

    useModalAccessibility({
        isOpen: Boolean(department && displayDept),
        onClose: onClose,
        containerRef: removeLogoModalRef,
    })

    async function handleConfirmDeleteDepartmentLogo() {
        const result = await onDeleteDepartmentLogo({
            departmentSlug: displayDept?.id,
            departmentLabel: displayDept?.label,
        })

        if (result?.ok) {
            onClose()
        }
    }

    return (
        <ModalShell
            isOpen={Boolean(department && displayDept)}
            onClose={onClose}
            dialogRef={removeLogoModalRef}
            role="dialog"
            ariaLabel="Remove department logo modal"
            maxWidth="max-w-md"
            closeOnBackdropClick={!isBusy}
        >
            {displayDept && (
                <>
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700">
                        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Remove Department Logo</h3>
                    </div>
                    <div className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 mb-4 dark:border-amber-800/50 dark:bg-amber-950/40">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-2xs dark:border-slate-700 dark:bg-slate-700/50">
                                {displayDept.logoUrl ? (
                                    <img
                                        src={displayDept.logoUrl}
                                        alt={`${displayDept.label} logo preview`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <FiUploadCloud className="text-slate-400 text-lg" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">{displayDept.label}</p>
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">Are you sure you want to remove this logo image?</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Removing the logo will reset the department icon to the default system placeholder for all administrative views.
                        </p>

                        {logoError ? (
                            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                {logoError}
                            </p>
                        ) : null}

                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                            <motion.button
                                type="button"
                                onClick={onClose}
                                disabled={isBusy}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleConfirmDeleteDepartmentLogo}
                                disabled={isBusy}
                                whileHover={{ scale: isBusy ? 1 : 1.02 }}
                                whileTap={{ scale: isBusy ? 1 : 0.96 }}
                                className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 shadow-xs shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                            >
                                {isBusy ? 'Removing...' : 'Remove Logo'}
                            </motion.button>
                        </div>
                    </div>
                </>
            )}
        </ModalShell>
    )
}
