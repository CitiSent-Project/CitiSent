import { DropdownButton } from '../ui/DropdownButton'

export function OfficeAdminAssignmentsSection({
  totalOfficeUnread,
  searchTerm,
  onSearchTermChange,
  departmentFilter,
  onDepartmentFilterChange,
  departmentOptions,
  filteredOfficeAdmins,
  unreadByAdminId,
  getSelectedDepartmentId,
  onDraftDepartmentChange,
  onSaveAssignment,
  processingAdminIds = new Set(),
}) {
  const departmentFilterOptions = [
    { value: 'all', label: 'All Departments' },
    ...departmentOptions.map((department) => ({ value: department.id, label: department.label })),
  ]

  const departmentAssignmentOptions = departmentOptions.map((department) => ({
    value: department.id,
    label: department.label,
  }))

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Office admin assignments</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update department assignments for office admins.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-cyan-800">
          {totalOfficeUnread} unread admin notifications
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Search admins
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Name, email, or department"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Department filter
          <DropdownButton
            className="w-full"
            ariaLabel="Department filter"
            value={departmentFilter}
            onChange={onDepartmentFilterChange}
            options={departmentFilterOptions}
          />
        </label>

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
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOfficeAdmins.map((admin) => (
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
                <td className="px-3 py-3 text-center">
                  <DropdownButton
                    className="h-9 w-full rounded-lg px-3"
                    ariaLabel={`Assign department for ${admin.fullName}`}
                    value={getSelectedDepartmentId(admin)}
                    onChange={(nextDepartmentId) => onDraftDepartmentChange(admin.id, nextDepartmentId)}
                    options={departmentAssignmentOptions}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    disabled={processingAdminIds.has(admin.id)}
                    onClick={() => onSaveAssignment(admin)}
                    className="rounded-lg bg-blue-700 px-5 py-2 text-md font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {processingAdminIds.has(admin.id) ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}

            {filteredOfficeAdmins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-600">
                  No office admins match your current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
