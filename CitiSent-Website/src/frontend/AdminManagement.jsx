import { useMemo, useState } from 'react'
import { DEPARTMENT_OPTIONS } from './Data/adminPortalData'
import { getPendingTransferRequests } from '../controllers/departmentTransferController'
import { getOfficeAdmins } from '../controllers/adminManagementController'
import { USER_ROLES } from '../models/roleAccessModel'
import { countUnreadNotifications } from '../controllers/notificationsController'

export function AdminManagement({
  profile,
  adminAccounts,
  notificationsByAdmin,
  transferRequests,
  onAssignOfficeDepartment,
  onApproveTransfer,
  onRejectTransfer,
}) {
  const officeAdmins = useMemo(() => getOfficeAdmins(adminAccounts), [adminAccounts])
  const pendingRequests = useMemo(
    () => getPendingTransferRequests(transferRequests),
    [transferRequests]
  )
  const unreadByAdminId = useMemo(
    () =>
      officeAdmins.reduce((accumulator, admin) => {
        accumulator[admin.id] = countUnreadNotifications(notificationsByAdmin?.[admin.id] || [])
        return accumulator
      }, {}),
    [notificationsByAdmin, officeAdmins]
  )
  const totalOfficeUnread = useMemo(
    () => Object.values(unreadByAdminId).reduce((sum, value) => sum + value, 0),
    [unreadByAdminId]
  )
  const [draftDepartments, setDraftDepartments] = useState({})
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewError, setReviewError] = useState('')

  function getSelectedDepartmentId(admin) {
    return draftDepartments[admin.id] || admin.departmentId
  }

  function handleSaveAssignment(admin) {
    const selectedDepartmentId = getSelectedDepartmentId(admin)
    const selectedDepartment = DEPARTMENT_OPTIONS.find(
      (department) => department.id === selectedDepartmentId
    )

    if (!selectedDepartment) {
      return
    }

    onAssignOfficeDepartment({
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

  function submitReviewModal(event) {
    event.preventDefault()

    if (!reviewModal) {
      return
    }

    if (reviewModal.mode === 'reject' && !reviewNotes.trim()) {
      setReviewError('Rejection reason is required.')
      return
    }

    if (reviewModal.mode === 'approve') {
      onApproveTransfer({
        requestId: reviewModal.request.id,
        reviewNotes,
      })
    } else {
      onRejectTransfer({
        requestId: reviewModal.request.id,
        reviewNotes,
      })
    }

    closeReviewModal()
  }

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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Office admin assignments</h2>
              <p className="mt-1 text-sm text-slate-600">
                Update department assignments for office admins.
              </p>
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
              {totalOfficeUnread} unread admin notifications
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Admin</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Current Department</th>
                  <th className="px-3 py-2">Unread Notifications</th>
                  <th className="px-3 py-2">Assign Department</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {officeAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-800">{admin.fullName}</td>
                    <td className="px-3 py-3 text-slate-600">{admin.email}</td>
                    <td className="px-3 py-3 text-slate-700">{admin.department}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          unreadByAdminId[admin.id] > 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {unreadByAdminId[admin.id]} unread
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={getSelectedDepartmentId(admin)}
                        onChange={(event) =>
                          setDraftDepartments((previous) => ({
                            ...previous,
                            [admin.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                      >
                        {DEPARTMENT_OPTIONS.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSaveAssignment(admin)}
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                      >
                        Save assignment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Transfer request queue</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review pending transfer requests from office admins.
          </p>

          {pendingRequests.length === 0 ? (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              No pending transfer requests.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {pendingRequests.map((request) => (
                <article key={request.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{request.adminName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        {request.status}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          unreadByAdminId[request.adminId] > 0
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {unreadByAdminId[request.adminId] || 0} unread for requester
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    {request.currentDepartmentLabel} to {request.requestedDepartmentLabel}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{request.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openApprovalModal(request)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => openRejectionModal(request)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {reviewModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{reviewModal.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {reviewModal.request.adminName}: {reviewModal.request.currentDepartmentLabel} to{' '}
                {reviewModal.request.requestedDepartmentLabel}
              </p>
            </div>

            <form onSubmit={submitReviewModal} className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1 block text-sm text-slate-700">Review notes</label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(event) => {
                    setReviewNotes(event.target.value)
                    if (reviewError) {
                      setReviewError('')
                    }
                  }}
                  placeholder={reviewModal.prompt}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
                {reviewError ? (
                  <p className="mt-1 text-xs text-rose-600">{reviewError}</p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    reviewModal.mode === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {reviewModal.cta}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}
