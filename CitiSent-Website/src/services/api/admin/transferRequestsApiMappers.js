export function mapBackendTransferRequest(payload = {}) {
  const statusMap = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  return {
    id: payload.id || '',
    adminId: payload.adminId || payload.admin_id || '',
    adminName: payload.adminName || payload.admin_name || '',
    currentDepartmentId: payload.currentDepartmentId || payload.current_department_id || '',
    currentDepartmentLabel: payload.currentDepartmentLabel || payload.current_department_label || '',
    requestedDepartmentId: payload.requestedDepartmentId || payload.requested_department_id || '',
    requestedDepartmentLabel: payload.requestedDepartmentLabel || payload.requested_department_label || '',
    reason: payload.reason || '',
    status: statusMap[payload.status] || payload.status || 'Pending',
    requestedAt: payload.createdAt || payload.created_at || '',
    reviewedAt: payload.reviewedAt || payload.reviewed_at || '',
    reviewedById: payload.reviewerId || payload.reviewer_id || '',
    reviewedByName: payload.reviewerName || payload.reviewer_name || '',
    reviewNotes: payload.reviewNotes || payload.review_notes || '',
  }
}
