import { useState, useEffect, useRef } from 'react'
import {
  FiEdit3,
  FiCheck,
  FiX,
  FiUser,
  FiMail,
  FiBriefcase,
  FiPhone,
  FiMapPin,
  FiLock,
  FiActivity,
  FiClock,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi'
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
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Profile</h1>
            <p className="mt-0.5 text-sm text-slate-600">Profile data is powered by your registration details.</p>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150 active:scale-95"
            >
              <FiEdit3 className="h-4 w-4" />
              Edit profile
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setSubmissionFeedback(null)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition active:scale-95"
              >
                <FiX className="h-4 w-4 text-slate-500" />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          )}
        </header>

        <ProfileSummaryCard profile={profile} />

        {editing ? (
          <section ref={editFormRef} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <FiEdit3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Editable details</h2>
                <p className="text-xs text-slate-500">Update your account information below.</p>
              </div>
            </div>

            {submissionFeedback ? (
              <div
                className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm font-medium ${
                  submissionFeedback.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {submissionFeedback.type === 'error' ? (
                  <FiAlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span>{submissionFeedback.message}</span>
              </div>
            ) : null}

            {inputError ? (
              <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-800">
                <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{inputError}</span>
              </div>
            ) : null}

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">First name</label>
                <input
                  value={draft.fname}
                  onChange={(event) => updateDraft('fname', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Middle name (optional)</label>
                <input
                  value={draft.mname}
                  onChange={(event) => updateDraft('mname', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Last name</label>
                <input
                  value={draft.lname}
                  onChange={(event) => updateDraft('lname', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Username
                </label>
                {isSuperAdmin ? (
                  <input
                    value={draft.username}
                    onChange={(event) => updateDraft('username', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                  />
                ) : (
                  <div className="relative">
                    <input
                      value={draft.username ? `@${draft.username.replace(/^@/, '')}` : ''}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-600 cursor-not-allowed select-none"
                    />
                    <FiLock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                )}
                {!isSuperAdmin ? (
                  <p className="mt-1 text-xs text-slate-400">Username is permanent and managed by system admins.</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Email</label>
                <input
                  value={draft.email}
                  onChange={(event) => updateDraft('email', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Department</label>
                <select
                  value={draft.department}
                  onChange={(event) => updateDraft('department', event.target.value)}
                  disabled={isOfficeAdmin && hasPendingTransferRequest}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-all"
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
                    Department changes are processed as transfer requests requiring superadmin approval.
                  </p>
                ) : null}
                {isOfficeAdmin && hasPendingTransferRequest ? (
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    Pending transfer request exists. Department edits are locked.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Phone</label>
                <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
                  <span className="bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-600 border-r border-slate-200 select-none flex items-center">
                    +63
                  </span>
                  <input
                    type="text"
                    value={displayPhone}
                    onChange={handlePhoneChange}
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Barangay</label>
                <input
                  value={draft.barangay}
                  onChange={(event) => updateDraft('barangay', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">City</label>
                <div className="relative">
                  <input
                    value={draft.city}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-600 cursor-not-allowed"
                  />
                  <FiLock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Province</label>
                <div className="relative">
                  <input
                    value={draft.province}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 pr-8 text-sm font-medium text-slate-600 cursor-not-allowed"
                  />
                  <FiLock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {isOfficeAdmin && draft.department !== profile.department ? (
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Transfer request reason
                  </label>
                  <textarea
                    rows={3}
                    value={transferReason}
                    onChange={(event) => setTransferReason(event.target.value)}
                    placeholder="Explain why you are requesting a department change."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setSubmissionFeedback(null)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition active:scale-95"
              >
                <FiX className="h-4 w-4 text-slate-500" />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
              >
                {isSaving ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <FiActivity className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Recent activity</h2>
          </div>

          <div className="mt-5 space-y-2.5">
            {activityLog.length > 0 ? (
              activityLog.slice(0, 6).map((entry) => (
                <article
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white text-blue-700 border border-slate-200">
                      <FiActivity className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
                      <p className="text-xs text-slate-500">{entry.detail}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                    <FiClock className="h-3 w-3" />
                    {formatDateTime(entry.createdAt)}
                  </span>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
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
