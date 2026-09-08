import { FiEdit2, FiImage, FiToggleLeft, FiToggleRight, FiTrash2, FiUploadCloud, FiXCircle } from 'react-icons/fi'

export function DepartmentDesktopTable({
    catalog,
    busyDepartmentSlug,
    logoErrorBySlug,
    onLogoFileChange,
    onOpenRemoveLogoModal,
    onOpenRenameModal,
    onToggleDepartmentActive,
    onOpenDeleteModal
}) {
    return (
        <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200/80 shadow-2xs md:block dark:border-slate-700">
            <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-215 table-fixed text-left text-xs">
                    <colgroup>
                        <col className="w-[20%]" />
                        <col className="w-[34%]" />
                        <col className="w-[16%]" />
                        <col className="w-[14%]" />
                        <col className="w-[16%]" />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                            <th className="pl-6 pr-3 py-3">Logo</th>
                            <th className="px-3 py-3">Department</th>
                            <th className="px-3 py-3">Slug</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="pl-3 pr-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700/60 dark:bg-slate-800">
                        {catalog.map((department) => {
                            const isBusy = busyDepartmentSlug === department.id
                            const logoError = logoErrorBySlug[department.id]
                            const fileInputId = `agency-logo-${department.id}`

                            return (
                                <tr key={department.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                                    <td className="pl-6 pr-3 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200/80 bg-slate-50 text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-700/50">
                                                {department.logoUrl ? (
                                                    <img
                                                        src={department.logoUrl}
                                                        alt={`${department.label} logo`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <FiImage className="text-xs" aria-hidden="true" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <label
                                                    htmlFor={fileInputId}
                                                    className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                                                >
                                                    <FiUploadCloud aria-hidden="true" className="text-xs text-slate-400" />
                                                    <span>{department.logoUrl ? 'Replace' : 'Upload'}</span>
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
                                                        className="grid h-7 w-7 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                    >
                                                        <FiXCircle className="text-xs" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                        {logoError ? (
                                            <p className="mt-1 text-[11px] text-rose-600 font-medium">{logoError}</p>
                                        ) : null}
                                    </td>
                                    <td className="px-3 py-3 font-semibold text-slate-900 truncate max-w-70 dark:text-white" title={department.label}>
                                        {department.label}
                                    </td>
                                    <td className="px-3 py-3">
                                        <code className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                            {department.id}
                                        </code>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                department.isActive
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full ${department.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {department.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="pl-3 pr-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => onOpenRenameModal(department)}
                                                title="Rename department"
                                                aria-label={`Rename ${department.label}`}
                                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                            >
                                                <FiEdit2 className="text-xs" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => onToggleDepartmentActive(department)}
                                                title={department.isActive ? 'Deactivate department' : 'Activate department'}
                                                aria-label={`${department.isActive ? 'Deactivate' : 'Activate'} ${department.label}`}
                                                className={`grid h-8 w-8 place-items-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs ${
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
                                                className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                            >
                                                <FiTrash2 className="text-xs" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {catalog.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="pl-6 pr-6 py-10 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                    No departments found in catalog.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
