import { useRef } from 'react'
import { FiUploadCloud } from 'react-icons/fi'
import { useModalAccessibility } from '../../../hooks/useModalAccessibility'

export function RemoveLogoModal({ department, onClose, onDeleteDepartmentLogo, isBusy, logoError }) {
    const removeLogoModalRef = useRef(null)

    useModalAccessibility({
        isOpen: Boolean(department),
        onClose: onClose,
        containerRef: removeLogoModalRef,
    })

    if (!department) return null

    async function handleConfirmDeleteDepartmentLogo() {
        const result = await onDeleteDepartmentLogo({
            departmentSlug: department.id,
            departmentLabel: department.label,
        })

        if (result?.ok) {
            onClose()
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
                ref={removeLogoModalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Remove agency logo modal"
                tabIndex={-1}
                className="max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] border border-slate-100"
            >
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h3 className="text-base font-bold tracking-tight text-slate-900">Remove Agency Logo</h3>
                </div>
                <div className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 mb-4">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                            {department.logoUrl ? (
                                <img
                                    src={department.logoUrl}
                                    alt={`${department.label} logo preview`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <FiUploadCloud className="text-slate-400 text-lg" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-amber-900">{department.label}</p>
                            <p className="text-[11px] text-amber-800/80">Are you sure you want to remove this logo image?</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        Removing the logo will reset the agency icon to the default system placeholder for all administrative views.
                    </p>

                    {logoError ? (
                        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                            {logoError}
                        </p>
                    ) : null}

                    <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDeleteDepartmentLogo}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 active:scale-[0.98] shadow-xs shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                        >
                            {isBusy ? 'Removing...' : 'Remove Logo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
