import { useMemo, useRef } from 'react'
import { getPendingTransferRequests } from '../../controllers/departmentTransferController'
import { getOfficeAdmins } from '../../controllers/adminManagementController'
import { USER_ROLES } from '../../models/roleAccessModel'
import { notifyError } from '../../components/ui/toastHelpers'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { useAdminManagementState } from '../../hooks/useAdminManagementState'
import {
  AgencyCatalogSection,
  OfficeAdminAssignmentsSection,
  TransferRequestQueueSection,
  TransferReviewModal,
} from '../../components/AdminManagement-Ui'

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
  departmentOptions,
  departmentCatalog,
}) {
  const officeAdmins = useMemo(() => getOfficeAdmins(adminAccounts), [adminAccounts])
  const pendingRequests = useMemo(
    () => getPendingTransferRequests(transferRequests),
    [transferRequests]
  )

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

  if (profile?.role !== USER_ROLES.SUPERADMIN) {
    return (
      <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            This page is available to superadmins only.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Management</h1>
          <p className="text-sm text-slate-600">
            Assign office admins by department and process transfer queue approvals.
          </p>
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
    </main>
  )
}
