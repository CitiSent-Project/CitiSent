import { FiEdit2, FiImage, FiToggleLeft, FiToggleRight, FiTrash2, FiUploadCloud, FiXCircle } from 'react-icons/fi'

export function DepartmentMobileCard({
    department,
    isBusy,
    logoError,
    onLogoFileChange,
    onOpenRemoveLogoModal,
    onOpenRenameModal,
    onToggleDepartmentActive,
    onOpenDeleteModal
}) {
    const fileInputId = `agency-logo-mobile-${department.id}`

    return (
        <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
            <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-700/50">
                    {department.logoUrl ? (
                        <img
                            src={department.logoUrl}
                            alt={`${department.label} logo`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <FiImage className="text-sm" aria-hidden="true" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm leading-snug dark:text-white">{department.label}</p>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200/60 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                        {department.id}
                    </code>
                </div>
                <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        department.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/60 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                    }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${department.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {department.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                    <label
                        htmlFor={fileInputId}
                        className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        <FiUploadCloud aria-hidden="true" className="text-xs text-slate-500" />
                        <span>{department.logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                    </label>
                    <input
                        id={fileInputId}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={isBusy}
                        onChange={(event) => onLogoFileChange(department, event)}
                        className="sr-only"
                    />
                    {department.logoUrl || department.logoPath ? (
                        <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onOpenRemoveLogoModal(department)}
                            title="Remove logo"
                            aria-label={`Remove ${department.label} logo`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                        >
                            <FiXCircle className="text-xs" />
                        </button>
                    ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onOpenRenameModal(department)}
                        title="Rename department"
                        aria-label={`Rename ${department.label}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                        <FiEdit2 className="text-xs" />
                    </button>
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onToggleDepartmentActive(department)}
                        title={department.isActive ? 'Deactivate department' : 'Activate department'}
                        aria-label={`${department.isActive ? 'Deactivate' : 'Activate'} ${department.label}`}
                        className={`grid h-8 w-8 place-items-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                            department.isActive
                                ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400'
                        }`}
                    >
                        {department.isActive ? (
                            <FiToggleRight className="text-sm" />
                        ) : (
                            <FiToggleLeft className="text-sm" />
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onOpenDeleteModal(department)}
                        title="Delete department"
                        aria-label={`Delete ${department.label}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                    >
                        <FiTrash2 className="text-xs" />
                    </button>
                </div>
            </div>
            {logoError ? (
                <p className="mt-2 text-xs text-rose-600 font-medium">{logoError}</p>
            ) : null}
        </article>
    )
}
