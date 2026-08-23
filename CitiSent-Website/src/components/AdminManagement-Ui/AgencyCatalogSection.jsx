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

            <form className="mt-4 grid gap-3 bg-slate-50/70 p-4.5 rounded-xl border border-slate-100" onSubmit={handleCreateDepartment}>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                    Agency Name
                    <input
                        value={form.name}
                        onChange={(event) => updateForm('name', event.target.value)}
                        placeholder="e.g. City Treasury Office"
                        className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </label>
                {formError ? <p role="alert" className="text-xs text-rose-600 font-medium">{formError}</p> : null}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] shadow-xs shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto cursor-pointer"
                    >
                        <FiPlus className="text-xs text-white" />
                        <span>{isCreating ? 'Adding agency...' : 'Add Agency'}</span>
                    </button>
                </div>
            </form>

            <div className="mt-5 space-y-3 md:hidden">
                {sortedCatalog.map((department) => {
                    const isBusy = busyDepartmentSlug === department.id
                    const logoError = logoErrorBySlug[department.id]
                    const fileInputId = `agency-logo-mobile-${department.id}`

                    return (
                        <article key={department.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex gap-3">
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
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-900">{department.label}</p>
                                    <p className="break-all text-sm text-slate-600">{department.id}</p>
                                    <span
                                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${department.isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        {department.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <label
                                    htmlFor={fileInputId}
                                    className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
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
                                        className="grid h-9 w-9 place-items-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <FiXCircle className="text-sm" />
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleOpenRenameModal(department)}
                                    title="Rename agency"
                                    aria-label={`Rename ${department.label}`}
                                    className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FiEdit2 className="text-sm" />
                                </button>
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleToggleDepartmentActive(department)}
                                    title={department.isActive ? 'Deactivate agency' : 'Activate agency'}
                                    aria-label={`${department.isActive ? 'Deactivate' : 'Activate'} ${department.label}`}
                                    className="grid h-9 w-9 place-items-center rounded-md bg-blue-700 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                                    className="grid h-9 w-9 place-items-center rounded-md bg-rose-600 text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FiTrash2 className="text-sm" />
                                </button>
                            </div>
                            {logoError ? (
                                <p className="mt-2 text-xs text-rose-600">{logoError}</p>
                            ) : (
                                <p className="mt-2 text-xs text-slate-500">PNG, JPG, or WebP up to 2MB</p>
                            )}
                        </article>
                    )
                })}

                {sortedCatalog.length === 0 ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                        No agencies found in catalog.
                    </p>
                ) : null}
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed text-left text-sm">
                    <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[24%]" />
                        <col className="w-[22%]" />
                        <col className="w-[10%]" />
                        <col className="w-[14%]" />
                    </colgroup>
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
                                    <td className="break-words px-3 py-3 font-medium text-slate-800">{department.label}</td>
                                    <td className="break-all px-3 py-3 text-slate-600">{department.id}</td>
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
                    className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4"
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
                        className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl"
                    >
                        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                            <h3 className="text-lg font-semibold text-slate-900">Rename agency</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Update the display name for {renameModal.label}.
                            </p>
                        </div>

                        <form onSubmit={handleSubmitRenameDepartment} className="space-y-4 px-4 py-4 sm:px-5">
                            <div>
                                <label className="mb-1 block text-sm text-slate-700">Agency Name</label>
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
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                                />
                                {renameError ? <p className="mt-1 text-xs text-rose-600">{renameError}</p> : null}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-slate-700">Slug</label>
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
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                                />
                                <p className="mt-1 text-xs text-slate-500">Use lowercase letters, numbers, and hyphens.</p>
                            </div>

                            <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCloseRenameModal}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-300 sm:py-2 theme-dark-btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busyDepartmentSlug === renameModal.id}
                                    className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 sm:py-2 theme-dark-btn-primary"
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
                    className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4"
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
                        className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl"
                    >
                        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                            <h3 className="text-lg font-semibold text-slate-900">Delete agency</h3>
                        </div>
                        <p className="mx-4 pt-3 text-sm text-slate-600 sm:mx-5">
                            This will permanently remove {deleteModal.label}. This action cannot be undone.
                        </p>
                        <p className="mx-4 mt-1 text-xs text-slate-500 sm:mx-5">
                            Inactive agencies can still be blocked when they are referenced by existing records.
                        </p>
                        <form onSubmit={handleConfirmDeleteDepartment} className="space-y-4 px-4 py-4 sm:px-5">
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

                            <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCloseDeleteModal}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-300 sm:py-2 theme-dark-btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busyDepartmentSlug === deleteModal.id}
                                    className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70 sm:py-2"
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
