import { useMemo, useState } from 'react'
import { SettingsSectionCard } from '../Account-Ui'
import { USER_ROLES } from '../../models/roleAccessModel'
import { DropdownButton } from '../ui/DropdownButton'

export function DepartmentTransferTab({
  profile,
  transferRequests,
  departmentOptions,
  onSubmitTransferRequest,
}) {
  const [requestedDepartmentId, setRequestedDepartmentId] = useState('')
  const [reason, setReason] = useState('')

  const ownRequests = useMemo(
    () => transferRequests.filter((request) => request.adminId === profile?.id),
    [profile?.id, transferRequests]
  )

  const availableDepartments = departmentOptions.filter(
    (department) => department.id !== profile?.departmentId
  )

  const requestedDepartmentOptions = [
    { value: '', label: 'Select department' },
    ...availableDepartments.map((department) => ({
      value: department.id,
      label: department.label,
    })),
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    if (!requestedDepartmentId || !reason.trim()) {
      return
    }

    const departmentLabel =
      departmentOptions.find((department) => department.id === requestedDepartmentId)?.label || ''

    const result = await onSubmitTransferRequest({
      requestedDepartmentId,
      requestedDepartmentLabel: departmentLabel,
      reason,
    })

    if (result && result.ok === false) {
      return
    }

    setRequestedDepartmentId('')
    setReason('')
  }

  if (profile?.role === USER_ROLES.SUPERADMIN) {
    return (
      <SettingsSectionCard
        title="Transfer requests"
        description="Superadmin transfer operations are now managed in Admin Management."
      >
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Open the Admin Management page from the sidebar to review and process office-admin assignments and transfer requests.
        </p>
      </SettingsSectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="Request department transfer"
        description="Submit one request at a time for superadmin review."
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Requested department</label>
            <DropdownButton
              className="w-full"
              ariaLabel="Requested department"
              value={requestedDepartmentId}
              onChange={setRequestedDepartmentId}
              options={requestedDepartmentOptions}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Reason</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe why the transfer is needed."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Submit request
          </button>
        </form>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="My transfer requests"
        description="Track the status of your submitted requests."
      >
        {ownRequests.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No transfer requests submitted.
          </p>
        ) : (
          <div className="space-y-3">
            {ownRequests.map((request) => (
              <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {request.currentDepartmentLabel} to {request.requestedDepartmentLabel}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {request.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{request.reason}</p>
                {request.reviewNotes ? (
                  <p className="mt-2 text-xs text-slate-600">Review notes: {request.reviewNotes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SettingsSectionCard>
    </div>
  )
}
