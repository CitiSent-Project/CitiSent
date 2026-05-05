import { useMemo, useRef, useState } from 'react'
import { FiEdit2, FiToggleLeft, FiToggleRight, FiTrash2 } from 'react-icons/fi'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'

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
        onClose: () => {
            setDeleteModal(null)
            setDeleteError('')
        },
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
    }

    function handleCloseDeleteModal() {
        setDeleteModal(null)
        setDeleteError('')
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

    async function handleConfirmDeleteDepartment(event) {
        event.preventDefault()

        if (!deleteModal) {
            return
        }

        setDeleteError('')
        setBusyDepartmentSlug(deleteModal.id)
        const result = await onDeleteDepartment({
            departmentSlug: deleteModal.id,
            departmentLabel: deleteModal.label,
        })
        setBusyDepartmentSlug('')

        if (result?.ok) {
            handleCloseDeleteModal()
            return
        }

        setDeleteError(result?.message || 'Unable to delete agency.')
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Agency catalog</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Add new agencies and manage whether they are active for future assignments.
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

            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-180 text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-2">Agency</th>
                            <th className="px-3 py-2">Slug</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCatalog.map((department) => {
                            const isBusy = busyDepartmentSlug === department.id

                            return (
                                <tr key={department.id} className="border-b border-slate-100">
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
                                <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-600">
                                    No agencies found in catalog.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
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
                        <form onSubmit={handleConfirmDeleteDepartment} className="space-y-4 px-5 py-4">
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
