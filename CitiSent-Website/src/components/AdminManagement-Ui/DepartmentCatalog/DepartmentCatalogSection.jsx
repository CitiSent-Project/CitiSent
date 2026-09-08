import { useMemo, useState } from 'react'
import { validateLogoFile } from './utils'
import { CreateAgencyForm } from './CreateAgencyForm'
import { AgencyMobileCard } from './AgencyMobileCard'
import { AgencyDesktopTable } from './AgencyDesktopTable'
import { RenameAgencyModal } from './RenameAgencyModal'
import { DeleteAgencyModal } from './DeleteAgencyModal'
import { RemoveLogoModal } from './RemoveLogoModal'

export function AgencyCatalogSection({
    departmentCatalog = [],
    onCreateDepartment,
    onUpdateDepartment,
    onSetDepartmentActive,
    onUpdateDepartmentLogo,
    onDeleteDepartmentLogo,
    onDeleteDepartment,
}) {
    const [busyDepartmentSlug, setBusyDepartmentSlug] = useState('')
    const [renameModal, setRenameModal] = useState(null)
    const [deleteModal, setDeleteModal] = useState(null)
    const [removeLogoModal, setRemoveLogoModal] = useState(null)
    const [logoErrorBySlug, setLogoErrorBySlug] = useState({})

    const sortedCatalog = useMemo(
        () =>
            [...departmentCatalog].sort((left, right) =>
                String(left?.label || '').localeCompare(String(right?.label || ''))
            ),
        [departmentCatalog]
    )

    function handleOpenRenameModal(department) {
        setRenameModal(department)
    }

    function handleCloseRenameModal() {
        setRenameModal(null)
    }

    function handleOpenDeleteModal(department) {
        setDeleteModal(department)
    }

    function handleCloseDeleteModal() {
        setDeleteModal(null)
    }

    function handleOpenRemoveLogoModal(department) {
        if (!department.logoPath && !department.logoUrl) {
            return
        }
        clearLogoError(department.id)
        setRemoveLogoModal(department)
    }

    function handleCloseRemoveLogoModal() {
        setRemoveLogoModal(null)
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

    async function handleUpdateDepartmentWrapper(payload) {
        setBusyDepartmentSlug(payload.departmentSlug)
        const result = await onUpdateDepartment(payload)
        setBusyDepartmentSlug('')
        return result
    }

    async function handleDeleteDepartmentWrapper(payload) {
        setBusyDepartmentSlug(payload.departmentSlug)
        const result = await onDeleteDepartment(payload)
        setBusyDepartmentSlug('')
        return result
    }

    async function handleDeleteDepartmentLogoWrapper(payload) {
        setBusyDepartmentSlug(payload.departmentSlug)
        const result = await onDeleteDepartmentLogo(payload)
        setBusyDepartmentSlug('')
        
        if (!result?.ok) {
            setLogoError(payload.departmentSlug, result?.message || 'Unable to remove agency logo.')
        }
        return result
    }

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all sm:p-6 dark:border-slate-700/80 dark:bg-slate-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Agency Catalog</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Manage agency names, availability, and official logos shown across CitiSent.
                    </p>
                </div>
            </div>

            <CreateAgencyForm onCreateDepartment={onCreateDepartment} />

            {/* Mobile Card List View */}
            <div className="mt-5 space-y-3 md:hidden">
                {sortedCatalog.map((department) => (
                    <AgencyMobileCard
                        key={department.id}
                        department={department}
                        isBusy={busyDepartmentSlug === department.id}
                        logoError={logoErrorBySlug[department.id]}
                        onLogoFileChange={handleLogoFileChange}
                        onOpenRemoveLogoModal={handleOpenRemoveLogoModal}
                        onOpenRenameModal={handleOpenRenameModal}
                        onToggleDepartmentActive={handleToggleDepartmentActive}
                        onOpenDeleteModal={handleOpenDeleteModal}
                    />
                ))}

                {sortedCatalog.length === 0 ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No agencies found in catalog.</p>
                    </div>
                ) : null}
            </div>

            {/* Desktop Table View */}
            <AgencyDesktopTable
                catalog={sortedCatalog}
                busyDepartmentSlug={busyDepartmentSlug}
                logoErrorBySlug={logoErrorBySlug}
                onLogoFileChange={handleLogoFileChange}
                onOpenRemoveLogoModal={handleOpenRemoveLogoModal}
                onOpenRenameModal={handleOpenRenameModal}
                onToggleDepartmentActive={handleToggleDepartmentActive}
                onOpenDeleteModal={handleOpenDeleteModal}
            />

            <RenameAgencyModal
                department={renameModal}
                onClose={handleCloseRenameModal}
                onUpdateDepartment={handleUpdateDepartmentWrapper}
                isBusy={renameModal ? busyDepartmentSlug === renameModal.id : false}
            />

            <DeleteAgencyModal
                department={deleteModal}
                onClose={handleCloseDeleteModal}
                onDeleteDepartment={handleDeleteDepartmentWrapper}
                isBusy={deleteModal ? busyDepartmentSlug === deleteModal.id : false}
            />

            <RemoveLogoModal
                department={removeLogoModal}
                onClose={handleCloseRemoveLogoModal}
                onDeleteDepartmentLogo={handleDeleteDepartmentLogoWrapper}
                isBusy={removeLogoModal ? busyDepartmentSlug === removeLogoModal.id : false}
                logoError={removeLogoModal ? logoErrorBySlug[removeLogoModal.id] : ''}
            />
        </section>
    )
}
