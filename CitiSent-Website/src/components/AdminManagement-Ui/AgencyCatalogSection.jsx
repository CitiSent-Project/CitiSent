import { useMemo, useRef, useState } from 'react'
import {
    FiEdit2,
    FiImage,
    FiPlus,
    FiToggleLeft,
    FiToggleRight,
    FiTrash2,
    FiUploadCloud,
    FiXCircle,
} from 'react-icons/fi'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { getStructuredInputError } from '../../utils/structuredInputValidation'

const MAX_LOGO_FILE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

function pluralize(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`
}

function formatReferenceBreakdownMessage(referenceBreakdown) {
    if (!referenceBreakdown || typeof referenceBreakdown !== 'object') {
        return ''
    }

    const profiles = Number(referenceBreakdown.profiles || 0)
    const reports = Number(referenceBreakdown.reports || 0)
    const transferRequests = Number(referenceBreakdown.transferRequests || 0)

    const linkedItems = [
        profiles > 0 ? pluralize(profiles, 'user profile') : '',
        reports > 0 ? pluralize(reports, 'report') : '',
        transferRequests > 0 ? pluralize(transferRequests, 'transfer request') : '',
    ].filter(Boolean)

    if (linkedItems.length === 0) {
        return ''
    }

    return `This agency is still linked to ${linkedItems.join(', ')}.`
}

function toSlug(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function AgencyCatalogSection({
    departmentCatalog = [],
    onCreateDepartment,
    onUpdateDepartment,
    onSetDepartmentActive,
    onUpdateDepartmentLogo,
    onDeleteDepartmentLogo,
    onDeleteDepartment,
}) {
    const [form, setForm] = useState({
        name: '',
    })
    const [isCreating, setIsCreating] = useState(false)
    const [formError, setFormError] = useState('')
    const [busyDepartmentSlug, setBusyDepartmentSlug] = useState('')
    const [renameModal, setRenameModal] = useState(null)
    const [renameName, setRenameName] = useState('')
    const [renameSlug, setRenameSlug] = useState('')
    const [renameError, setRenameError] = useState('')
    const [deleteModal, setDeleteModal] = useState(null)
    const [deleteError, setDeleteError] = useState('')
    const [deleteWithCleanup, setDeleteWithCleanup] = useState(false)
    const [logoErrorBySlug, setLogoErrorBySlug] = useState({})
    const renameModalRef = useRef(null)
    const deleteModalRef = useRef(null)

    useModalAccessibility({
        isOpen: Boolean(renameModal),
        onClose: () => {
            setRenameModal(null)
            setRenameName('')
            setRenameSlug('')
            setRenameError('')
        },
        containerRef: renameModalRef,
    })

    useModalAccessibility({
        isOpen: Boolean(deleteModal),
        onClose: handleCloseDeleteModal,
        containerRef: deleteModalRef,
    })

    const sortedCatalog = useMemo(
        () =>
            [...departmentCatalog].sort((left, right) =>
                String(left?.label || '').localeCompare(String(right?.label || ''))
            ),
        [departmentCatalog]
    )

    function updateForm(field, value) {
        const inputError = getStructuredInputError(value, 'location')
        if (inputError) {
            setFormError(inputError)
            return
        }

        setFormError('')
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    async function handleCreateDepartment(event) {
        event.preventDefault()

        const payload = {
            slug: toSlug(form.name),
            name: String(form.name || '').trim(),
        }

        if (!payload.slug || !payload.name) {
            setFormError('Agency name is required.')
            return
        }

        setIsCreating(true)
        const result = await onCreateDepartment(payload)
        setIsCreating(false)

        if (result?.ok) {
            setForm({
                name: '',
            })
            setFormError('')
        }
    }

    function handleOpenRenameModal(department) {
        setRenameModal(department)
        setRenameName(department.label)
        setRenameSlug(department.slug || department.id)
        setRenameError('')
    }

    function handleCloseRenameModal() {
        setRenameModal(null)
        setRenameName('')
        setRenameSlug('')
        setRenameError('')
    }

    function handleOpenDeleteModal(department) {
        setDeleteModal(department)
        setDeleteError('')
        setDeleteWithCleanup(false)
    }

    function handleCloseDeleteModal() {
        setDeleteModal(null)
        setDeleteError('')
        setDeleteWithCleanup(false)
    }

    function clearLogoError(departmentSlug) {
        setLogoErrorBySlug((previous) => {
            if (!previous[departmentSlug]) {
                return previous
            }

            const next = { ...previous }
            delete next[departmentSlug]
            return next
        })
    }

    function setLogoError(departmentSlug, message) {
        setLogoErrorBySlug((previous) => ({
            ...previous,
            [departmentSlug]: message,
        }))
    }

    function validateLogoFile(file) {
        if (!file) {
            return 'Please choose a logo image.'
        }

        if (!ALLOWED_LOGO_TYPES.has(file.type)) {
            return 'Use a PNG, JPG, or WebP image.'
        }

        if (file.size > MAX_LOGO_FILE_SIZE_BYTES) {
            return 'Logo image must be 2MB or smaller.'
        }

        return ''
    }

    async function handleSubmitRenameDepartment(event) {
        event.preventDefault()

        if (!renameModal) {
            return
        }

        const nextName = String(renameName || '').trim()
        const nextSlug = toSlug(renameSlug)
        if (!nextName) {
            setRenameError('Agency name is required.')
            return
        }

        if (!nextSlug) {
            setRenameError('A valid slug is required (letters, numbers, and hyphens only).')
            return
        }

        if (nextName === renameModal.label && nextSlug === (renameModal.slug || renameModal.id)) {
            handleCloseRenameModal()
            return
        }

        setRenameError('')
        setBusyDepartmentSlug(renameModal.id)
        const result = await onUpdateDepartment({
            departmentSlug: renameModal.id,
            name: nextName,
            slug: nextSlug,
        })
        setBusyDepartmentSlug('')

        if (result?.ok) {
            handleCloseRenameModal()
            return
        }

        setRenameError(result?.message || 'Unable to update agency name.')
    }

    async function handleToggleDepartmentActive(department) {
        setBusyDepartmentSlug(department.id)
        await onSetDepartmentActive({
            departmentSlug: department.id,
            isActive: !department.isActive,
        })
        setBusyDepartmentSlug('')
    }

    async function handleLogoFileChange(department, event) {
        const file = event.target.files?.[0] || null
        event.target.value = ''

        const validationError = validateLogoFile(file)
        if (validationError) {
            setLogoError(department.id, validationError)
            return
        }

        clearLogoError(department.id)
        setBusyDepartmentSlug(department.id)
        const result = await onUpdateDepartmentLogo({
            departmentSlug: department.id,
            departmentLabel: department.label,
            file,
        })
        setBusyDepartmentSlug('')

        if (!result?.ok) {
            setLogoError(department.id, result?.message || 'Unable to update agency logo.')
        }
    }

    async function handleDeleteDepartmentLogo(department) {
        if (!department.logoPath && !department.logoUrl) {
            return
        }

        clearLogoError(department.id)
        setBusyDepartmentSlug(department.id)
        const result = await onDeleteDepartmentLogo({
            departmentSlug: department.id,
            departmentLabel: department.label,
        })
        setBusyDepartmentSlug('')

        if (!result?.ok) {
            setLogoError(department.id, result?.message || 'Unable to remove agency logo.')
        }
    }

    async function handleConfirmDeleteDepartment(event) {
        event.preventDefault()

        if (!deleteModal) {
            return
        }

        const shouldCleanup = deleteWithCleanup === true
        setDeleteError('')
        setBusyDepartmentSlug(deleteModal.id)
        const result = await onDeleteDepartment({
            departmentSlug: deleteModal.id,
            departmentLabel: deleteModal.label,
            cleanup: shouldCleanup,
        })
        setBusyDepartmentSlug('')

        if (result?.ok) {
            handleCloseDeleteModal()
            return
        }

        // Surface reference counts when backend reports exactly what still blocks deletion.
        const referenceBreakdown = result?.details?.breakdown
        const breakdownMessage = formatReferenceBreakdownMessage(referenceBreakdown)
        const fallbackMessage = result?.message || 'Unable to delete agency.'

        setDeleteError(breakdownMessage ? `${fallbackMessage} ${breakdownMessage}` : fallbackMessage)
    }

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">Agency Catalog</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Manage agency names, availability, and official logos shown across CitiSent.
                    </p>
                </div>
            </div>

            <form className="mt-4 flex flex-col gap-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-100 sm:flex-row sm:items-end" onSubmit={handleCreateDepartment}>
                <div className="flex-1 min-w-0">
                    <label htmlFor="create-agency-input" className="block mb-1 text-xs font-semibold text-slate-700">
                        Agency Name
                    </label>
                    <input
                        id="create-agency-input"
                        value={form.name}
                        onChange={(event) => updateForm('name', event.target.value)}
                        placeholder="e.g. City Treasury Office"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] shadow-xs shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto cursor-pointer shrink-0"
                >
                    <FiPlus className="text-xs text-white" />
                    <span>{isCreating ? 'Adding...' : 'Add Agency'}</span>
                </button>
            </form>
            {formError ? <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{formError}</p> : null}

            {/* Mobile Card List View */}
            <div className="mt-5 space-y-3 md:hidden">
                {sortedCatalog.map((department) => {
                    const isBusy = busyDepartmentSlug === department.id
                    const logoError = logoErrorBySlug[department.id]
                    const fileInputId = `agency-logo-mobile-${department.id}`

                    return (
                        <article key={department.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-slate-400 shadow-2xs">
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
                                    <p className="font-semibold text-slate-900 text-sm leading-snug">{department.label}</p>
                                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200/60">
                                        {department.id}
                                    </code>
                                </div>
                                <span
                                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                        department.isActive
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                            : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${department.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    {department.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                                <div className="flex items-center gap-1.5">
                                    <label
                                        htmlFor={fileInputId}
                                        className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                                    >
                                        <FiUploadCloud aria-hidden="true" className="text-xs text-slate-500" />
                                        <span>{department.logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                                    </label>
                                    <input
                                        id={fileInputId}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        disabled={isBusy}
                                        onChange={(event) => handleLogoFileChange(department, event)}
                                        className="sr-only"
                                    />
                                    {department.logoUrl || department.logoPath ? (
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleDeleteDepartmentLogo(department)}
                                            title="Remove logo"
                                            aria-label={`Remove ${department.label} logo`}
                                            className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <FiXCircle className="text-xs" />
                                        </button>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleOpenRenameModal(department)}
                                        title="Rename agency"
                                        aria-label={`Rename ${department.label}`}
                                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <FiEdit2 className="text-xs" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleToggleDepartmentActive(department)}
                                        title={department.isActive ? 'Deactivate agency' : 'Activate agency'}
                                        aria-label={`${department.isActive ? 'Deactivate' : 'Activate'} ${department.label}`}
                                        className={`grid h-8 w-8 place-items-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                            department.isActive
                                                ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200'
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
                                        onClick={() => handleOpenDeleteModal(department)}
                                        title="Delete agency"
                                        aria-label={`Delete ${department.label}`}
                                        className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
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
                })}

                {sortedCatalog.length === 0 ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-8 text-center">
                        <p className="text-xs font-medium text-slate-500">No agencies found in catalog.</p>
                    </div>
                ) : null}
            </div>

            {/* Desktop Table View */}
            <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200/80 shadow-2xs md:block">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full min-w-[860px] table-fixed text-left text-xs">
                        <colgroup>
                            <col className="w-[20%]" />
                            <col className="w-[34%]" />
                            <col className="w-[16%]" />
                            <col className="w-[14%]" />
                            <col className="w-[16%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="pl-6 pr-3 py-3">Logo</th>
                                <th className="px-3 py-3">Agency</th>
                                <th className="px-3 py-3">Slug</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="pl-3 pr-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {sortedCatalog.map((department) => {
                                const isBusy = busyDepartmentSlug === department.id
                                const logoError = logoErrorBySlug[department.id]
                                const fileInputId = `agency-logo-${department.id}`

                                return (
                                    <tr key={department.id} className="transition-colors hover:bg-slate-50/60">
                                        <td className="pl-6 pr-3 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200/80 bg-slate-50 text-slate-400 shadow-2xs">
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
                                                        className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                                                    >
                                                        <FiUploadCloud aria-hidden="true" className="text-xs text-slate-400" />
                                                        <span>{department.logoUrl ? 'Replace' : 'Upload'}</span>
                                                    </label>
                                                    <input
                                                        id={fileInputId}
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/webp"
                                                        disabled={isBusy}
                                                        onChange={(event) => handleLogoFileChange(department, event)}
                                                        className="sr-only"
                                                    />
                                                    {department.logoUrl || department.logoPath ? (
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => handleDeleteDepartmentLogo(department)}
                                                            title="Remove logo"
                                                            aria-label={`Remove ${department.label} logo`}
                                                            className="grid h-7 w-7 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                                        <td className="px-3 py-3 font-semibold text-slate-900 truncate max-w-[280px]" title={department.label}>
                                            {department.label}
                                        </td>
                                        <td className="px-3 py-3">
                                            <code className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 border border-slate-200/60">
                                                {department.id}
                                            </code>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                    department.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                                        : 'bg-slate-100 text-slate-500 border border-slate-200/60'
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
                                                    onClick={() => handleOpenRenameModal(department)}
                                                    title="Rename agency"
                                                    aria-label={`Rename ${department.label}`}
                                                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs"
                                                >
                                                    <FiEdit2 className="text-xs" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => handleToggleDepartmentActive(department)}
                                                    title={department.isActive ? 'Deactivate agency' : 'Activate agency'}
                                                    aria-label={`${department.isActive ? 'Deactivate' : 'Activate'} ${department.label}`}
                                                    className={`grid h-8 w-8 place-items-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs ${
                                                        department.isActive
                                                            ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                            : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200'
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
                                                    onClick={() => handleOpenDeleteModal(department)}
                                                    title="Delete agency"
                                                    aria-label={`Delete ${department.label}`}
                                                    className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs"
                                                >
                                                    <FiTrash2 className="text-xs" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}

                            {sortedCatalog.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="pl-6 pr-6 py-10 text-center text-xs font-medium text-slate-500">
                                        No agencies found in catalog.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {renameModal ? (
                <div
                    className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 backdrop-blur-xs sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            handleCloseRenameModal()
                        }
                    }}
                >
                    <div
                        ref={renameModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Rename agency modal"
                        tabIndex={-1}
                        className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] border border-slate-100"
                    >
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h3 className="text-base font-bold tracking-tight text-slate-900">Rename Agency</h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Update the display name for {renameModal.label}.
                            </p>
                        </div>

                        <form onSubmit={handleSubmitRenameDepartment} className="space-y-4 px-5 py-5 sm:px-6">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Agency Name</label>
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
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                {renameError ? <p className="mt-1 text-xs text-rose-600 font-medium">{renameError}</p> : null}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Slug</label>
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
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="mt-1 text-[11px] text-slate-400">Use lowercase letters, numbers, and hyphens.</p>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseRenameModal}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busyDepartmentSlug === renameModal.id}
                                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] shadow-xs shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                                >
                                    {busyDepartmentSlug === renameModal.id ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteModal ? (
                <div
                    className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 backdrop-blur-xs sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            handleCloseDeleteModal()
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
                            This will permanently remove <span className="font-semibold text-slate-900">{deleteModal.label}</span>. This action cannot be undone.
                        </p>
                        <p className="mx-5 mt-1 text-[11px] text-slate-400 sm:mx-6">
                            Inactive agencies can still be blocked when they are referenced by existing records.
                        </p>
                        <form onSubmit={handleConfirmDeleteDepartment} className="space-y-4 px-5 py-4 sm:px-6">
                            <label className="flex items-start gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3 text-xs text-rose-900">
                                <input
                                    type="checkbox"
                                    checked={deleteWithCleanup}
                                    disabled={busyDepartmentSlug === deleteModal.id}
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
                                    onClick={handleCloseDeleteModal}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busyDepartmentSlug === deleteModal.id}
                                    className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 active:scale-[0.98] shadow-xs shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                                >
                                    {busyDepartmentSlug === deleteModal.id ? 'Deleting...' : 'Delete Agency'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
