import { useMemo, useRef, useState } from 'react'
import { getPendingTransferRequests } from '../../controllers/departmentTransferController'
import { getOfficeAdmins } from '../../controllers/adminManagementController'
import { USER_ROLES } from '../../models/roleAccessModel'
import { notifyError, notifySuccess } from '../../components/ui/toastHelpers'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { useAdminManagementState } from '../../hooks/useAdminManagementState'
import { usersApiService } from '../../services/api/admin/usersApiService'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'
import { loadFromStorageWithSchema } from '../../services/storageService'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import {
  AgencyCatalogSection,
  OfficeAdminAssignmentsSection,
  TransferRequestQueueSection,
  TransferReviewModal,
  AddAdminFormModal,
} from '../../components/AdminManagement-Ui'

function getStoredAccessToken() {
  const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)

  return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', {
    schemaVersion: schemaRule.schemaVersion,
    migrate: schemaRule.migrate,
    validate: schemaRule.validate,
  })
}

export function AdminManagement({
  profile,
  adminAccounts,
  notificationsByAdmin,
  transferRequests,
  onAssignOfficeDepartment,
  onCreateDepartment,
  onUpdateDepartment,
  onSetDepartmentActive,
  onUpdateDepartmentLogo,
  onDeleteDepartmentLogo,
  onDeleteDepartment,
  onApproveTransfer,
  onRejectTransfer,
  onRefreshAdminAccounts,
  departmentOptions,
  departmentCatalog,
}) {
  const officeAdmins = useMemo(() => getOfficeAdmins(adminAccounts), [adminAccounts])
  const pendingRequests = useMemo(
    () => getPendingTransferRequests(transferRequests),
    [transferRequests]
  )

  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false)

  const {
    reviewModal,
    reviewNotes,
    reviewError,
    searchTerm,
    departmentFilter,
    unreadFilter,
    unreadByAdminId,
    totalOfficeUnread,
    filteredOfficeAdmins,
    filteredPendingRequests,
    processingAdminIds,
    isSubmittingReview,
    setSearchTerm,
    setDepartmentFilter,
    setUnreadFilter,
    getSelectedDepartmentId,
    handleDraftDepartmentChange,
    handleSaveAssignment,
    openApprovalModal,
    openRejectionModal,
    closeReviewModal,
    submitReviewModal,
    handleReviewNotesChange,
  } = useAdminManagementState({
    officeAdmins,
    pendingRequests,
    notificationsByAdmin,
    departmentOptions,
    onAssignOfficeDepartment,
    onApproveTransfer,
    onRejectTransfer,
    notifyError,
  })

  const reviewModalRef = useRef(null)

  useModalAccessibility({
    isOpen: !!reviewModal,
    onClose: closeReviewModal,
    containerRef: reviewModalRef,
  })

  async function handleAddAdminSubmit(form) {
    const token = getStoredAccessToken()
    if (!token) {
      notifyError('Action failed.', 'Your session has expired. Please sign in again.')
      return false
    }

    const selectedDepartment = departmentOptions.find((dep) => dep.id === form.departmentId)

    try {
      await usersApiService.createUser(token, {
        ...form,
        accountType: 'admin',
        role: USER_ROLES.OFFICE_ADMIN,
        departmentLabel: selectedDepartment?.label,
      })
      notifySuccess(
        'Admin account created.',
        `An activation email has been sent to ${form.email}.`
      )
      if (onRefreshAdminAccounts) {
        onRefreshAdminAccounts()
      }
      setIsAddAdminModalOpen(false)
      return true
    } catch (error) {
      notifyError('Failed to create admin account.', error.message)
      return false
    }
  }

  if (profile?.role !== USER_ROLES.SUPERADMIN) {
    return (
      <main className="mx-auto w-full max-w-[1400px] flex-1 overflow-hidden bg-[#eef2f8] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Admin Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            This page is available to superadmins only.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 overflow-hidden bg-[#eef2f8] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Admin Management</h1>
            <p className="text-sm text-slate-600">
              Assign office admins by department and process transfer queue approvals.
            </p>
          </div>
          <button
            onClick={() => setIsAddAdminModalOpen(true)}
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 sm:w-auto sm:py-2"
          >
            Add Admin
          </button>
        </header>

        <OfficeAdminAssignmentsSection
          totalOfficeUnread={totalOfficeUnread}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={setDepartmentFilter}
          unreadFilter={unreadFilter}
          onUnreadFilterChange={setUnreadFilter}
          departmentOptions={departmentOptions}
          filteredOfficeAdmins={filteredOfficeAdmins}
          unreadByAdminId={unreadByAdminId}
          getSelectedDepartmentId={getSelectedDepartmentId}
          onDraftDepartmentChange={handleDraftDepartmentChange}
          onSaveAssignment={handleSaveAssignment}
          processingAdminIds={processingAdminIds}
        />

        <AgencyCatalogSection
          departmentCatalog={departmentCatalog}
          onCreateDepartment={onCreateDepartment}
          onUpdateDepartment={onUpdateDepartment}
          onSetDepartmentActive={onSetDepartmentActive}
          onUpdateDepartmentLogo={onUpdateDepartmentLogo}
          onDeleteDepartmentLogo={onDeleteDepartmentLogo}
          onDeleteDepartment={onDeleteDepartment}
        />

        <TransferRequestQueueSection
          filteredPendingRequests={filteredPendingRequests}
          unreadByAdminId={unreadByAdminId}
          onOpenApprovalModal={openApprovalModal}
          onOpenRejectionModal={openRejectionModal}
        />
      </div>

      <TransferReviewModal
        reviewModal={reviewModal}
        reviewModalRef={reviewModalRef}
        reviewNotes={reviewNotes}
        reviewError={reviewError}
        onClose={closeReviewModal}
        onSubmit={submitReviewModal}
        onReviewNotesChange={handleReviewNotesChange}
        isSubmittingReview={isSubmittingReview}
      />

      <AddAdminFormModal
        isOpen={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
        onSubmit={handleAddAdminSubmit}
        departmentOptions={departmentOptions}
      />
    </main>
  )
}
