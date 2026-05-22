import { useMemo, useRef, useState } from 'react'
import {
    FiEdit2,
    FiImage,
    FiToggleLeft,
    FiToggleRight,
    FiTrash2,
    FiUploadCloud,
    FiXCircle,
} from 'react-icons/fi'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'

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
        slug: '',
        name: '',
    })
    const [isCreating, setIsCreating] = useState(false)
    const [busyDepartmentSlug, setBusyDepartmentSlug] = useState('')
    const [renameModal, setRenameModal] = useState(null)
    const [renameName, setRenameName] = useState('')
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
        setForm((previous) => ({
            ...previous,
            [field]: value,
            ...(field === 'name' && !previous.slug
                ? {
                    slug: toSlug(value),
                }
                : {}),
        }))
    }

    async function handleCreateDepartment(event) {
        event.preventDefault()

        const payload = {
            slug: toSlug(form.slug),
            name: String(form.name || '').trim(),
        }

        if (!payload.slug || !payload.name) {
            return
        }

        setIsCreating(true)
        const result = await onCreateDepartment(payload)
        setIsCreating(false)

        if (result?.ok) {
            setForm({
                slug: '',
                name: '',
            })
        }
    }

    function handleOpenRenameModal(department) {
        setRenameModal(department)
        setRenameName(department.label)
        setRenameError('')
    }

    function handleCloseRenameModal() {
        setRenameModal(null)
        setRenameName('')
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
        if (!nextName) {
            setRenameError('Agency name is required.')
            return
        }

        if (nextName === renameModal.label) {
            handleCloseRenameModal()
            return
        }

        setRenameError('')
        setBusyDepartmentSlug(renameModal.id)
        const result = await onUpdateDepartment({
            departmentSlug: renameModal.id,
            name: nextName,
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
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Agency catalog</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Manage agency names, availability, and official logos shown across CitiSent.
                    </p>
                </div>
            </div>

            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateDepartment}>
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Slug
                    <input
                        value={form.slug}
                        onChange={(event) => updateForm('slug', event.target.value)}
                        placeholder="city-treasury"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Agency Name
                    <input
                        value={form.name}
                        onChange={(event) => updateForm('name', event.target.value)}
                        placeholder="City Treasury Office"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                </label>

                <div className="md:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isCreating ? 'Adding agency...' : 'Add agency'}
                    </button>
                </div>
            </form>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                <table className="w-full min-w-230 text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-3">Logo</th>
                            <th className="px-3 py-2">Agency</th>
                            <th className="px-3 py-2">Slug</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCatalog.map((department) => {
                            const isBusy = busyDepartmentSlug === department.id
                            const logoError = logoErrorBySlug[department.id]
                            const fileInputId = `agency-logo-${department.id}`

                            return (
                                <tr key={department.id} className="border-b border-slate-100 align-top last:border-b-0">
                                    <td className="px-3 py-3">
                                        <div className="flex items-start gap-3">
                                            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                                                {department.logoUrl ? (
                                                    <img
                                                        src={department.logoUrl}
                                                        alt={`${department.label} logo`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <FiImage className="text-lg" aria-hidden="true" />
                                                )}
                                            </div>
                                            <div className="min-w-35">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <label
                                                        htmlFor={fileInputId}
                                                        className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                                                    >
                                                        <FiUploadCloud aria-hidden="true" />
                                                        {department.logoUrl ? 'Replace' : 'Upload'}
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
                                                            className="grid h-8 w-8 place-items-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <FiXCircle className="text-sm" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                                {logoError ? (
                                                    <p className="mt-1 max-w-50 text-xs text-rose-600">{logoError}</p>
                                                ) : (
                                                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, or WebP up to 2MB</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 font-medium text-slate-800">{department.label}</td>
                                    <td className="px-3 py-3 text-slate-600">{department.id}</td>
                                    <td className="px-3 py-3">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${department.isActive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}
                                        >
                                            {department.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleOpenRenameModal(department)}
                                                title="Rename agency"
                                                aria-label={`Rename ${department.label}`}
                                                className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <FiEdit2 className="text-sm" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleToggleDepartmentActive(department)}
                                                title={department.isActive ? 'Deactivate agency' : 'Activate agency'}
                                                aria-label={`${department.isActive ? 'Deactivate' : 'Activate'} ${department.label}`}
                                                className="grid h-8 w-8 place-items-center rounded-md bg-blue-700 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {department.isActive ? (
                                                    <FiToggleRight className="text-base" />
                                                ) : (
                                                    <FiToggleLeft className="text-base" />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleOpenDeleteModal(department)}
                                                title="Delete agency"
                                                aria-label={`Delete ${department.label}`}
                                                className="grid h-8 w-8 place-items-center rounded-md bg-rose-600 text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <FiTrash2 className="text-sm" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {sortedCatalog.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-600">
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
                    className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
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
                        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
                    >
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h3 className="text-lg font-semibold text-slate-900">Rename agency</h3>
                            <p className="m-5 text-sm text-slate-600">
                                Update the display name for {renameModal.label}.
                            </p>
                        </div>

                        <form onSubmit={handleSubmitRenameDepartment} className="space-y-4 px-5 py-4">
                            <div>
                                <label className="mb-1 block text-sm text-slate-700">Agency Name</label>
                                <input
                                    type="text"
                                    value={renameName}
                                    onChange={(event) => setRenameName(event.target.value)}
                                    placeholder="City Treasury Office"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                                />
                                {renameError ? <p className="mt-1 text-xs text-rose-600">{renameError}</p> : null}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseRenameModal}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-300 theme-dark-btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busyDepartmentSlug === renameModal.id}
                                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 theme-dark-btn-primary"
                                >
                                    {busyDepartmentSlug === renameModal.id ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteModal ? (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
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
                        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
                    >
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h3 className="text-lg font-semibold text-slate-900">Delete agency</h3>
                        </div>
                        <p className="pt-3 m-5 text-sm text-slate-600">
                            This will permanently remove {deleteModal.label}. This action cannot be undone.
                        </p>
                        <p className="mx-5 -mt-2 text-xs text-slate-500">
                            Inactive agencies can still be blocked when they are referenced by existing records.
                        </p>
                        <form onSubmit={handleConfirmDeleteDepartment} className="space-y-4 px-5 py-4">
                            <label className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                                <input
                                    type="checkbox"
                                    checked={deleteWithCleanup}
                                    disabled={busyDepartmentSlug === deleteModal.id}
                                    onChange={(event) => setDeleteWithCleanup(event.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-700 focus:ring-rose-500"
                                />
                                <span>Also remove linked reports and clear department references.</span>
                            </label>
                            <p className="-mt-2 text-xs text-slate-500">
                                Use cleanup only for inactive agencies when you intentionally want destructive removal.
                            </p>
                            {deleteError ? (
                                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-red-900">
                                    {deleteError}
                                </p>
                            ) : null}

                            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseDeleteModal}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-300 theme-dark-btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busyDepartmentSlug === deleteModal.id}
                                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {busyDepartmentSlug === deleteModal.id ? 'Deleting...' : 'Delete agency'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
