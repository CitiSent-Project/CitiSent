import { useState } from 'react'
import { ProfileSummaryCard } from '../components/Account-Ui'
import { formatDateTime } from './Data/adminPortalData'
import { categoryAgencyCards } from './Data/reportsData'
import { buildProfileSubmissionState } from '../controllers/profileController'
import { TRANSFER_REQUEST_STATUS } from '../controllers/departmentTransferController'
import { normalizeUserRole, USER_ROLES } from '../models/roleAccessModel'

export function ProfileInformation({
  profile,
  activityLog,
  transferRequests,
  onUpdateProfile,
  onSubmitTransferRequest,
}) {
  const departmentCatalog = categoryAgencyCards.map((agency) => ({
    id: agency.id,
    label: agency.label,
  }))
  const departmentOptions = departmentCatalog.map((agency) => agency.label)
  const isOfficeAdmin = normalizeUserRole(profile.role) === USER_ROLES.OFFICE_ADMIN
  const hasPendingTransferRequest = transferRequests.some(
    (request) =>
      request.adminId === profile.id && request.status === TRANSFER_REQUEST_STATUS.PENDING
  )
  const [editing, setEditing] = useState(false)
  const [transferReason, setTransferReason] = useState('')
  const [submissionFeedback, setSubmissionFeedback] = useState(null)
  const [draft, setDraft] = useState({
    fullName: profile.fullName,
    department: profile.department,
    phone: profile.phone,
    address: profile.address,
  })

  function updateDraft(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }))
  }

  function startEditing() {
    setDraft({
      fullName: profile.fullName,
      department: profile.department,
      phone: profile.phone,
      address: profile.address,
    })
    setTransferReason('')
    setSubmissionFeedback(null)
    setEditing(true)
  }

  function saveProfile() {
    const submissionState = buildProfileSubmissionState({
      profile,
      draft,
      transferReason,
      departmentCatalog,
      hasPendingTransferRequest,
    })

    if (!submissionState.ok) {
      setSubmissionFeedback({
        type: 'error',
        message: submissionState.message,
      })
      return
    }

    if (submissionState.shouldUpdateProfile) {
      onUpdateProfile(submissionState.profileUpdates)
    }

    if (submissionState.transferRequestPayload) {
      const requestResult = onSubmitTransferRequest(submissionState.transferRequestPayload)
      if (requestResult && requestResult.ok === false) {
        setSubmissionFeedback({
          type: 'error',
          message: requestResult.message,
        })
        return
      }

      setSubmissionFeedback({
        type: 'success',
        message:
          'Department change request submitted. Your current department remains active until superadmin approval.',
      })
    }

    setEditing(false)
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Profile</h1>
            <p className="text-sm text-slate-600">Profile data is powered by your registration details.</p>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setSubmissionFeedback(null)
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          )}
        </header>

        <ProfileSummaryCard profile={profile} />

        {editing ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Editable details</h2>
            {submissionFeedback ? (
              <p
                className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                  submissionFeedback.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {submissionFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-700">Full name</label>
                <input
                  value={draft.fullName}
                  onChange={(event) => updateDraft('fullName', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Department</label>
                <select
                  value={draft.department}
                  onChange={(event) => updateDraft('department', event.target.value)}
                  disabled={isOfficeAdmin && hasPendingTransferRequest}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  {!departmentOptions.includes(draft.department) ? (
                    <option value={draft.department}>{draft.department}</option>
                  ) : null}
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                {isOfficeAdmin ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Department changes are processed as transfer requests and require superadmin approval.
                  </p>
                ) : null}
                {isOfficeAdmin && hasPendingTransferRequest ? (
                  <p className="mt-1 text-xs text-amber-700">
                    You already have a pending transfer request. Department edits are temporarily locked.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Phone</label>
                <input
                  value={draft.phone}
                  onChange={(event) => updateDraft('phone', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Address</label>
                <input
                  value={draft.address}
                  onChange={(event) => updateDraft('address', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              {isOfficeAdmin && draft.department !== profile.department ? (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm text-slate-700">
                    Transfer request reason
                  </label>
                  <textarea
                    rows={3}
                    value={transferReason}
                    onChange={(event) => setTransferReason(event.target.value)}
                    placeholder="Explain why you are requesting a department change."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          <div className="mt-4 space-y-2">
            {activityLog.length > 0 ? (
              activityLog.slice(0, 6).map((entry) => (
                <article
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.action}</p>
                    <p className="text-xs text-slate-500">{entry.detail}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</span>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-500">
                Activity will appear here as you use the admin portal.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}