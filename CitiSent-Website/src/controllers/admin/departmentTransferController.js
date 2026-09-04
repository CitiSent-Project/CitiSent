export const TRANSFER_REQUEST_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export function buildTransferRequestCreation({
  profile,
  requestedDepartmentId,
  requestedDepartmentLabel,
  reason,
}) {
  const requestId = `transfer-${Date.now()}`
  const createdAt = new Date().toISOString()

  return {
    request: {
      id: requestId,
      adminId: profile.id,
      adminName: profile.fullName,
      currentDepartmentId: profile.departmentId,
      currentDepartmentLabel: profile.department,
      requestedDepartmentId,
      requestedDepartmentLabel,
      reason,
      status: TRANSFER_REQUEST_STATUS.PENDING,
      createdAt,
      reviewedAt: '',
      reviewedById: '',
      reviewedByName: '',
      reviewNotes: '',
    },
    activity: {
      action: 'Department transfer requested',
      detail: `${profile.fullName} requested transfer to ${requestedDepartmentLabel}`,
    },
  }
}

export function buildTransferApproval({ request, reviewerProfile, reviewNotes }) {
  return {
    updatedRequest: {
      ...request,
      status: TRANSFER_REQUEST_STATUS.APPROVED,
      reviewedAt: new Date().toISOString(),
      reviewedById: reviewerProfile.id,
      reviewedByName: reviewerProfile.fullName,
      reviewNotes: reviewNotes || 'Approved by superadmin.',
    },
    activity: {
      action: 'Department transfer approved',
      detail: `${request.adminName} moved to ${request.requestedDepartmentLabel}`,
    },
    notification: {
      id: `notif-transfer-approved-${Date.now()}`,
      title: 'Transfer approved',
      message: `Your transfer request to ${request.requestedDepartmentLabel} has been approved.`,
      type: 'Account',
      createdAt: new Date().toISOString(),
      read: false,
    },
  }
}

export function buildTransferRejection({ request, reviewerProfile, reviewNotes }) {
  return {
    updatedRequest: {
      ...request,
      status: TRANSFER_REQUEST_STATUS.REJECTED,
      reviewedAt: new Date().toISOString(),
      reviewedById: reviewerProfile.id,
      reviewedByName: reviewerProfile.fullName,
      reviewNotes: reviewNotes || 'Transfer request rejected.',
    },
    activity: {
      action: 'Department transfer rejected',
      detail: `${request.adminName} transfer request to ${request.requestedDepartmentLabel} was rejected`,
    },
    notification: {
      id: `notif-transfer-rejected-${Date.now()}`,
      title: 'Transfer rejected',
      message: `Your transfer request to ${request.requestedDepartmentLabel} has been rejected.`,
      type: 'Account',
      createdAt: new Date().toISOString(),
      read: false,
    },
  }
}

export function getPendingTransferRequests(requests = []) {
  return requests.filter((request) => request.status === TRANSFER_REQUEST_STATUS.PENDING)
}
