import { useState, useEffect, useRef } from 'react'
import { ProfileSummaryCard } from '../../components/Account-Ui'
import { ReloginModal } from '../../components/Account-Ui/ReloginModal'
import { formatDateTime } from '../../models/data'
import { buildProfileSubmissionState } from '../../controllers/profileController'
import { TRANSFER_REQUEST_STATUS } from '../../controllers/departmentTransferController'
import { normalizeUserRole, USER_ROLES } from '../../models/roleAccessModel'
import { getStructuredInputError } from '../../utils/structuredInputValidation'

export function ProfileInformation({
  profile,
  activityLog,
  transferRequests,
  onUpdateProfile,
  onSubmitTransferRequest,
  onLogout,
  departmentOptions,
}) {
  const departmentCatalog = departmentOptions.map((agency) => ({
    id: agency.id,
    label: agency.label,
  }))
  const departmentLabels = departmentCatalog.map((agency) => agency.label)
  const isSuperAdmin = normalizeUserRole(profile.role) === USER_ROLES.SUPERADMIN
  const isOfficeAdmin = normalizeUserRole(profile.role) === USER_ROLES.OFFICE_ADMIN
  const hasPendingTransferRequest = transferRequests.some(
    (request) =>
      request.adminId === profile.id && request.status === TRANSFER_REQUEST_STATUS.PENDING
  )
  const [editing, setEditing] = useState(false)
  const editFormRef = useRef(null)

  useEffect(() => {
    if (editing && editFormRef.current) {
      editFormRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [editing])

  const [transferReason, setTransferReason] = useState('')
  const [submissionFeedback, setSubmissionFeedback] = useState(null)
  const [inputError, setInputError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showRelogin, setShowRelogin] = useState(false)
  const [draft, setDraft] = useState({
    fname: profile.fname || '',
    mname: profile.mname || '',
    lname: profile.lname || '',
    username: profile.username,
    email: profile.email,
    department: profile.department,
    phone: profile.phone,
    barangay: profile.barangay,
    city: profile.city,
    province: profile.province,
  })

  function updateDraft(field, value) {
    const ruleByField = {
      fname: 'name',
      mname: 'name',
      lname: 'name',
      username: 'username',
      email: 'email',
      barangay: 'location',
    }
    const error = getStructuredInputError(value, ruleByField[field])

    if (error) {
      setInputError(error)
      return
    }

    setInputError('')
    setDraft((previous) => ({ ...previous, [field]: value }))
  }

  const displayPhone = draft.phone?.startsWith('+63')
    ? draft.phone.slice(3)
    : draft.phone?.startsWith('0')
      ? draft.phone.slice(1)
      : draft.phone || ''

  function handlePhoneChange(event) {
    const inputError = getStructuredInputError(event.target.value, 'phone')
    if (inputError) {
      setInputError(inputError)
      return
    }

    setInputError('')
    let cleanValue = event.target.value.replace(/\D/g, '')
    if (cleanValue.startsWith('0')) {
      cleanValue = cleanValue.slice(1)
    }
    const truncated = cleanValue.slice(0, 10)
    updateDraft('phone', truncated ? `+63${truncated}` : '')
  }

  function startEditing() {
    setDraft({
      fname: profile.fname || '',
      mname: profile.mname || '',
      lname: profile.lname || '',
      username: profile.username,
      email: profile.email,
      department: profile.department,
      phone: profile.phone,
      barangay: profile.barangay,
      city: profile.city,
      province: profile.province,
    })
    setTransferReason('')
    setSubmissionFeedback(null)
    setEditing(true)
  }

  async function saveProfile() {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
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

      // Track whether the email was changed before saving
      const emailWasChanged = draft.email !== profile.email

      if (submissionState.shouldUpdateProfile) {
        const profileUpdateResult = await onUpdateProfile(submissionState.profileUpdates)
        if (profileUpdateResult && profileUpdateResult.ok === false) {
          setSubmissionFeedback({
            type: 'error',
            message: profileUpdateResult.message,
          })
          return
        }
      }

      if (submissionState.transferRequestPayload) {
        const requestResult = await onSubmitTransferRequest(submissionState.transferRequestPayload)
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

      // If email was changed, show re-login modal for security
      if (emailWasChanged) {
        setShowRelogin(true)
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
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
          <section ref={editFormRef} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Editable details</h2>
            {submissionFeedback ? (
              <p
                className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                  submissionFeedback.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-red-900'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {submissionFeedback.message}
              </p>
            ) : null}
            {inputError ? (
              <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {inputError}
              </p>
            ) : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-700">First name</label>
                <input
                  value={draft.fname}
                  onChange={(event) => updateDraft('fname', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Middle name (optional)</label>
                <input
                  value={draft.mname}
                  onChange={(event) => updateDraft('mname', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Last name</label>
                <input
                  value={draft.lname}
                  onChange={(event) => updateDraft('lname', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Email</label>
                <input
                  value={draft.email}
                  onChange={(event) => updateDraft('email', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              {isSuperAdmin ? (
                <div>
                  <label className="mb-1 block text-sm text-slate-700">Username</label>
                  <input
                    value={draft.username}
                    onChange={(event) => updateDraft('username', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm text-slate-700">Department</label>
                  <select
                    value={draft.department}
                    onChange={(event) => updateDraft('department', event.target.value)}
                    disabled={isOfficeAdmin && hasPendingTransferRequest}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  >
                    {!departmentLabels.includes(draft.department) ? (
                      <option value={draft.department}>{draft.department}</option>
                    ) : null}
                    {departmentLabels.map((department) => (
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
              )}
              <div>
                <label className="mb-1 block text-sm text-slate-700">Phone</label>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-slate-400">
                  <span className="bg-slate-100 px-3 py-2 text-sm text-slate-500 border-r border-slate-200 select-none flex items-center">
                    +63
                  </span>
                  <input
                    type="text"
                    value={displayPhone}
                    onChange={handlePhoneChange}
                    className="w-full bg-transparent px-3 py-2 text-sm text-slate-700 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Barangay</label>
                <input
                  value={draft.barangay}
                  onChange={(event) => updateDraft('barangay', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">City</label>
                <input
                  value={draft.city}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Province</label>
                <input
                  value={draft.province}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
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
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
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
                disabled={isSaving}
                className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
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
    <ReloginModal isOpen={showRelogin} onConfirmLogout={onLogout} />
    </>
  )
}
