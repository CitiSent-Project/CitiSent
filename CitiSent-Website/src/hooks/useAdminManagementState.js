import { useMemo, useState } from 'react'
import {
  buildUnreadByAdminId,
  filterOfficeAdmins,
  filterPendingTransferRequests,
  getTotalUnreadCount,
} from '../controllers/adminManagementController'

export function useAdminManagementState({
  officeAdmins,
  pendingRequests,
  notificationsByAdmin,
  departmentOptions,
  onAssignOfficeDepartment,
  onApproveTransfer,
  onRejectTransfer,
  notifyError,
}) {
  const [draftDepartments, setDraftDepartments] = useState({})
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [unreadFilter, setUnreadFilter] = useState('all')

  const unreadByAdminId = useMemo(
    () => buildUnreadByAdminId({ officeAdmins, notificationsByAdmin }),
    [notificationsByAdmin, officeAdmins]
  )

  const totalOfficeUnread = useMemo(
    () => getTotalUnreadCount(unreadByAdminId),
    [unreadByAdminId]
  )

  const filteredOfficeAdmins = useMemo(
    () =>
      filterOfficeAdmins({
        officeAdmins,
        searchTerm,
        departmentFilter,
        unreadFilter,
        unreadByAdminId,
      }),
    [departmentFilter, officeAdmins, searchTerm, unreadByAdminId, unreadFilter]
  )

  const filteredPendingRequests = useMemo(
    () =>
      filterPendingTransferRequests({
        pendingRequests,
        searchTerm,
        departmentFilter,
      }),
    [departmentFilter, pendingRequests, searchTerm]
  )

  function getSelectedDepartmentId(admin) {
    return draftDepartments[admin.id] || admin.departmentId
  }

  function handleDraftDepartmentChange(adminId, departmentId) {
    setDraftDepartments((previous) => ({
      ...previous,
      [adminId]: departmentId,
    }))
  }

  async function handleSaveAssignment(admin) {
    const selectedDepartmentId = getSelectedDepartmentId(admin)
    const selectedDepartment = departmentOptions.find(
      (department) => department.id === selectedDepartmentId
    )

    if (!selectedDepartment) {
      notifyError('Assignment failed.', 'Please select a valid department before saving.')
      return
    }

    if (selectedDepartment.id === admin.departmentId) {
      notifyError('No assignment changes.', 'Choose a different department before saving.')
      return
    }

    await onAssignOfficeDepartment({
      adminId: admin.id,
      departmentId: selectedDepartment.id,
      departmentLabel: selectedDepartment.label,
    })
  }

  function openApprovalModal(request) {
    setReviewModal({
      mode: 'approve',
      request,
      title: 'Approve transfer request',
      prompt: 'Add optional approval notes for this request.',
      cta: 'Approve request',
    })
    setReviewNotes('Approved by superadmin.')
    setReviewError('')
  }

  function openRejectionModal(request) {
    setReviewModal({
      mode: 'reject',
      request,
      title: 'Reject transfer request',
      prompt: 'Provide a rejection reason before continuing.',
      cta: 'Reject request',
    })
    setReviewNotes('')
    setReviewError('')
  }

  function closeReviewModal() {
    setReviewModal(null)
    setReviewNotes('')
    setReviewError('')
  }

  function handleReviewNotesChange(value) {
    setReviewNotes(value)
    if (reviewError) {
      setReviewError('')
    }
  }

  async function submitReviewModal(event) {
    event.preventDefault()

    if (!reviewModal) {
      return
    }

    if (reviewModal.mode === 'reject' && !reviewNotes.trim()) {
      setReviewError('Rejection reason is required.')
      notifyError('Rejection failed.', 'Please provide a rejection reason before continuing.')
      return
    }

    if (reviewModal.mode === 'approve') {
      const result = await onApproveTransfer({
        requestId: reviewModal.request.id,
        reviewNotes,
      })
      if (result && result.ok === false) {
        return
      }
    } else {
      const result = await onRejectTransfer({
        requestId: reviewModal.request.id,
        reviewNotes,
      })
      if (result && result.ok === false) {
        return
      }
    }

    closeReviewModal()
  }

  return {
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
  }
}
