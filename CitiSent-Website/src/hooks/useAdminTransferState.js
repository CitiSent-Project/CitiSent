/**
 * useAdminTransferState.js
 *
 * Encapsulates the transfer-request and office-admin assignment workflows
 * that were previously inlined inside useAppStateOrchestrator.
 *
 * Every dependency is received through the `deps` configuration object so
 * the hook remains decoupled from global application state and is
 * straightforward to unit-test.
 *
 * Public contract (returned action names) is intentionally kept identical
 * to what the orchestrator previously exposed, so callers do not need
 * any migration.
 */
import { TRANSFER_REQUEST_STATUS } from '../controllers/departmentTransferController'
import { canReviewTransferRequest } from '../models/roleAccessModel'
import {
  appendNotificationForAdmin,
  appendNotificationForAdmins,
  buildNotification,
} from '../controllers/notificationsController'
import { transferRequestsApiService } from '../services/api/admin/transferRequestsApiService'
import { officeAdminsApiService } from '../services/api/admin/officeAdminsApiService'
import { mapBackendOfficeAdmin } from '../services/api/admin/accountsApiMappers'
import { mapBackendTransferRequest } from '../services/api/admin/transferRequestsApiMappers'

/**
 * @param {object} deps - All external state and setters the hook needs.
 * @param {string}   deps.accessToken            - Current auth token (empty string = expired).
 * @param {object}   deps.profile                - Current admin profile ({ id, fullName, role, departmentId, department }).
 * @param {object[]} deps.adminAccounts           - List of all office-admin accounts.
 * @param {object[]} deps.transferRequests        - List of all transfer requests.
 * @param {string[]} deps.superadminRecipientIds  - IDs of superadmins to notify (excludes current user).
 * @param {Function} deps.setAdminAccounts        - Setter for adminAccounts state.
 * @param {Function} deps.setTransferRequests     - Setter for transferRequests state.
 * @param {Function} deps.setProfile              - Setter for profile state.
 * @param {Function} deps.setPreferences          - Setter for preferences state.
 * @param {Function} deps.setNotificationsByAdmin - Setter for notifications-by-admin map.
 * @param {Function} deps.addActivity             - Appends an entry to the audit activity log.
 * @param {Function} deps.notifySuccess           - Shows a success toast.
 * @param {Function} deps.notifyError             - Shows an error toast.
 */
export function useAdminTransferState(deps) {
  const {
    accessToken,
    profile,
    transferRequests,
    superadminRecipientIds,
    setAdminAccounts,
    setTransferRequests,
    setProfile,
    setPreferences,
    setNotificationsByAdmin,
    addActivity,
    notifySuccess,
    notifyError,
  } = deps

  // ---------------------------------------------------------------------------
  // handleSubmitTransferRequest
  // ---------------------------------------------------------------------------
  // Allows any authenticated admin to submit ONE pending transfer request.
  // If the admin already has a pending request, the submission is rejected
  // client-side before hitting the API.
  // ---------------------------------------------------------------------------
  async function handleSubmitTransferRequest({
    requestedDepartmentId,
    requestedDepartmentLabel,
    reason,
  }) {
    // Guard: expired session
    if (!accessToken) {
      const message = 'Your session has expired. Please sign in again.'
      notifyError('Transfer request blocked.', message)
      return { ok: false, message }
    }

    // Guard: duplicate pending request
    const hasPendingRequest = transferRequests.some(
      (request) =>
        request.adminId === profile.id && request.status === TRANSFER_REQUEST_STATUS.PENDING
    )
    if (hasPendingRequest) {
      const message = 'You already have a pending transfer request.'
      notifyError('Transfer request blocked.', message)
      return { ok: false, message }
    }

    try {
      const response = await transferRequestsApiService.createTransferRequest(accessToken, {
        requestedDepartmentId,
        requestedDepartmentLabel,
        reason,
      })
      const createdRequest = mapBackendTransferRequest(response?.data)

      // Append the new request to local state.
      setTransferRequests((previous) => [createdRequest, ...previous])

      // Notify the requester and all superadmins.
      setNotificationsByAdmin((previous) => {
        let next = appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: profile.id,
          notification: buildNotification({
            title: 'Transfer request submitted',
            message: `Your request to transfer to ${requestedDepartmentLabel} is pending review.`,
            type: 'Account',
          }),
        })

        if (superadminRecipientIds.length > 0) {
          next = appendNotificationForAdmins({
            notificationsByAdmin: next,
            adminIds: superadminRecipientIds,
            notification: buildNotification({
              title: 'New transfer request',
              message: `${profile.fullName} requested transfer to ${requestedDepartmentLabel}.`,
              type: 'Account',
            }),
          })
        }

        return next
      })

      addActivity(
        'Department transfer requested',
        `${profile.fullName} requested transfer to ${requestedDepartmentLabel}`
      )
      notifySuccess('Transfer request submitted successfully.')
      return { ok: true, message: 'Transfer request submitted successfully.' }
    } catch (error) {
      notifyError('Transfer request blocked.', error.message)
      return { ok: false, message: error.message }
    }
  }

  // ---------------------------------------------------------------------------
  // handleAssignOfficeDepartment
  // ---------------------------------------------------------------------------
  // Only superadmins can reassign an office-admin's department directly.
  // Updates the target admin's account record, and if the reassigned admin
  // is the current user, also patches profile/preferences.
  // ---------------------------------------------------------------------------
  async function handleAssignOfficeDepartment({ adminId, departmentId, departmentLabel }) {
    // Guard: role check
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Assignment denied.', 'Only superadmins can update office-admin assignments.')
      return { ok: false }
    }

    // Guard: expired session
    if (!accessToken) {
      notifyError('Assignment denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await officeAdminsApiService.assignOfficeDepartment(accessToken, adminId, {
        departmentId,
        departmentLabel,
      })
      const updatedAdmin = mapBackendOfficeAdmin(response?.data)

      // Update the admin accounts list.
      setAdminAccounts((previous) =>
        previous.map((admin) => (admin.id === adminId ? { ...admin, ...updatedAdmin } : admin))
      )

      // If the reassigned admin is the current user, sync profile + preferences.
      if (profile.id === adminId) {
        setProfile((previous) => ({
          ...previous,
          departmentId: updatedAdmin.departmentId,
          department: updatedAdmin.department,
        }))
        setPreferences((previous) => ({
          ...previous,
          department: updatedAdmin.department,
        }))
      }

      // Notify the affected admin.
      setNotificationsByAdmin((previous) =>
        appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId,
          notification: buildNotification({
            title: 'Department assignment updated',
            message: `Your assigned department is now ${updatedAdmin.department}.`,
            type: 'Account',
          }),
        })
      )

      addActivity('Office admin reassigned', `${updatedAdmin.fullName} moved to ${updatedAdmin.department}`)
      notifySuccess('Office-admin assignment updated.')
      return { ok: true, admin: updatedAdmin }
    } catch (error) {
      notifyError('Assignment denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  // ---------------------------------------------------------------------------
  // handleApproveTransfer
  // ---------------------------------------------------------------------------
  // Approving a transfer is a multi-step workflow:
  //   1. Validate the request exists and is still pending.
  //   2. Call the API to approve.
  //   3. Update the transfer request in local state.
  //   4. Update the target admin's department in adminAccounts.
  //   5. If the target admin is the current user, sync profile/preferences.
  //   6. Notify the requester and the reviewer.
  //   7. Log the activity.
  // ---------------------------------------------------------------------------
  async function handleApproveTransfer({ requestId, reviewNotes }) {
    // Guard: role check
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Approval denied.', 'Only superadmins can approve transfer requests.')
      return { ok: false }
    }

    // Guard: expired session
    if (!accessToken) {
      notifyError('Approval denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    // Guard: request must exist and be pending
    const request = transferRequests.find((entry) => entry.id === requestId)
    if (!request || request.status !== TRANSFER_REQUEST_STATUS.PENDING) {
      notifyError('Approval failed.', 'The selected request is no longer pending.')
      return { ok: false }
    }

    try {
      const response = await transferRequestsApiService.approveTransferRequest(
        accessToken,
        requestId,
        {
        reviewNotes,
        }
      )
      const reviewedRequest = mapBackendTransferRequest(response?.data)

      // 1. Update the request in local state.
      setTransferRequests((previous) =>
        previous.map((entry) => (entry.id === requestId ? reviewedRequest : entry))
      )

      // 2. Update the target admin's department.
      setAdminAccounts((previous) =>
        previous.map((admin) =>
          admin.id === request.adminId
            ? {
                ...admin,
                departmentId: reviewedRequest.requestedDepartmentId,
                department: reviewedRequest.requestedDepartmentLabel,
              }
            : admin
        )
      )

      // 3. If the affected admin is the current user, sync profile + preferences.
      if (profile.id === request.adminId) {
        setProfile((previous) => ({
          ...previous,
          departmentId: reviewedRequest.requestedDepartmentId,
          department: reviewedRequest.requestedDepartmentLabel,
        }))
        setPreferences((previous) => ({
          ...previous,
          department: reviewedRequest.requestedDepartmentLabel,
        }))
      }

      // 4. Notify the requester and the reviewing superadmin.
      setNotificationsByAdmin((previous) => {
        let next = appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: request.adminId,
          notification: buildNotification({
            title: 'Transfer approved',
            message: `Your transfer request to ${reviewedRequest.requestedDepartmentLabel} has been approved.`,
            type: 'Account',
          }),
        })

        next = appendNotificationForAdmin({
          notificationsByAdmin: next,
          adminId: profile.id,
          notification: buildNotification({
            title: 'Transfer processed',
            message: `Approved transfer of ${reviewedRequest.adminName} to ${reviewedRequest.requestedDepartmentLabel}.`,
            type: 'Account',
          }),
        })

        return next
      })

      // 5. Log audit activity.
      addActivity(
        'Department transfer approved',
        `${reviewedRequest.adminName} moved to ${reviewedRequest.requestedDepartmentLabel}`
      )
      notifySuccess('Transfer request approved.')
      return { ok: true, request: reviewedRequest }
    } catch (error) {
      notifyError('Approval failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  // ---------------------------------------------------------------------------
  // handleRejectTransfer
  // ---------------------------------------------------------------------------
  // Rejecting a transfer updates the request status, notifies both parties,
  // and logs the activity — but does NOT change department assignments.
  // ---------------------------------------------------------------------------
  async function handleRejectTransfer({ requestId, reviewNotes }) {
    // Guard: role check
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Rejection denied.', 'Only superadmins can reject transfer requests.')
      return { ok: false }
    }

    // Guard: expired session
    if (!accessToken) {
      notifyError('Rejection denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    // Guard: request must exist and be pending
    const request = transferRequests.find((entry) => entry.id === requestId)
    if (!request || request.status !== TRANSFER_REQUEST_STATUS.PENDING) {
      notifyError('Rejection failed.', 'The selected request is no longer pending.')
      return { ok: false }
    }

    try {
      const response = await transferRequestsApiService.rejectTransferRequest(
        accessToken,
        requestId,
        {
        reviewNotes,
        }
      )
      const reviewedRequest = mapBackendTransferRequest(response?.data)

      // Update the request in local state.
      setTransferRequests((previous) =>
        previous.map((entry) => (entry.id === requestId ? reviewedRequest : entry))
      )

      // Notify both parties.
      setNotificationsByAdmin((previous) => {
        let next = appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: request.adminId,
          notification: buildNotification({
            title: 'Transfer rejected',
            message: `Your transfer request to ${reviewedRequest.requestedDepartmentLabel} has been rejected.`,
            type: 'Account',
          }),
        })

        next = appendNotificationForAdmin({
          notificationsByAdmin: next,
          adminId: profile.id,
          notification: buildNotification({
            title: 'Transfer processed',
            message: `Rejected transfer of ${reviewedRequest.adminName} to ${reviewedRequest.requestedDepartmentLabel}.`,
            type: 'Account',
          }),
        })

        return next
      })

      // Log audit activity.
      addActivity(
        'Department transfer rejected',
        `${reviewedRequest.adminName} transfer request to ${reviewedRequest.requestedDepartmentLabel} was rejected`
      )
      notifySuccess('Transfer request rejected.')
      return { ok: true, request: reviewedRequest }
    } catch (error) {
      notifyError('Rejection failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  return {
    handleSubmitTransferRequest,
    handleAssignOfficeDepartment,
    handleApproveTransfer,
    handleRejectTransfer,
  }
}
