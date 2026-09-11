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
        <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-800 dark:hover:border-slate-600">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-700/50">
                        {department.logoUrl ? (
                            <img
                                src={department.logoUrl}
                                alt={`${department.label} logo`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <FiImage className="text-lg text-slate-400" aria-hidden="true" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug break-words [overflow-wrap:anywhere] dark:text-white">
                            {department.label}
                        </h3>
                        <div className="mt-1">
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 border border-slate-200/60 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                                {department.id}
                            </code>
                        </div>
                    </div>
                </div>
                <span
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                        department.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/60 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                    }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${department.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {department.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="mt-3.5 border-t border-slate-100 pt-3 space-y-2 dark:border-slate-700/60">
                {/* Logo Management Row */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor={fileInputId}
                        className={`flex-1 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        <FiUploadCloud aria-hidden="true" className="text-sm text-slate-500 dark:text-slate-400" />
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
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                        >
                            <FiXCircle className="text-sm" />
                            <span className="text-[11px] font-medium">Remove</span>
                        </button>
                    ) : null}
                </div>

                {/* 3-Column Action Toolbelt */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onOpenRenameModal(department)}
                        title="Rename department"
                        aria-label={`Rename ${department.label}`}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <FiEdit2 className="text-xs text-slate-500 dark:text-slate-400" />
                        <span>Rename</span>
                    </button>
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onToggleDepartmentActive(department)}
                        title={department.isActive ? 'Deactivate department' : 'Activate department'}
                        aria-label={`${department.isActive ? 'Deactivate' : 'Activate'} ${department.label}`}
                        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            department.isActive
                                ? 'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400'
                        }`}
                    >
                        {department.isActive ? (
                            <>
                                <FiToggleRight className="text-sm text-blue-600 dark:text-blue-400" />
                                <span>Active</span>
                            </>
                        ) : (
                            <>
                                <FiToggleLeft className="text-sm text-slate-400" />
                                <span>Inactive</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onOpenDeleteModal(department)}
                        title="Delete department"
                        aria-label={`Delete ${department.label}`}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 text-xs font-medium text-rose-700 shadow-2xs transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                    >
                        <FiTrash2 className="text-xs text-rose-500" />
                        <span>Delete</span>
                    </button>
                </div>
            </div>
            {logoError ? (
                <p className="mt-2 text-xs text-rose-600 font-medium">{logoError}</p>
            ) : null}
        </article>
    )
}
