export function mapBackendTransferRequest(payload = {}) {
  const statusMap = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  return {
    id: payload.id || '',
    adminId: payload.adminId || '',
    adminName: payload.adminName || '',
    currentDepartmentId: payload.currentDepartmentId || '',
    currentDepartmentLabel: payload.currentDepartmentLabel || '',
    requestedDepartmentId: payload.requestedDepartmentId || '',
    requestedDepartmentLabel: payload.requestedDepartmentLabel || '',
    reason: payload.reason || '',
    status: statusMap[payload.status] || payload.status || 'Pending',
    requestedAt: payload.createdAt || '',
    reviewedAt: payload.reviewedAt || '',
    reviewedById: payload.reviewerId || '',
    reviewedByName: payload.reviewerName || '',
    reviewNotes: payload.reviewNotes || '',
  }
}
