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
  onDeleteAdmin,
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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Office admin assignments</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update department assignments for office admins.
          </p>
        </div>
        <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-cyan-800">
          {totalOfficeUnread} unread admin notifications
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="mt-4 space-y-3 md:hidden">
        {filteredOfficeAdmins.map((admin) => (
          <article key={admin.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-slate-900">{admin.fullName}</p>
              <p className="break-all text-sm text-slate-600">{admin.email}</p>
              <p className="text-sm text-slate-700">{admin.department}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  unreadByAdminId[admin.id] > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {unreadByAdminId[admin.id]} unread
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <DropdownButton
                className="h-10 w-full rounded-lg px-3"
                ariaLabel={`Assign department for ${admin.fullName}`}
                value={getSelectedDepartmentId(admin)}
                onChange={(nextDepartmentId) => onDraftDepartmentChange(admin.id, nextDepartmentId)}
                options={departmentAssignmentOptions}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={processingAdminIds.has(admin.id)}
                  onClick={() => onSaveAssignment(admin)}
                  className="flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingAdminIds.has(admin.id) ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  disabled={processingAdminIds.has(admin.id)}
                  onClick={() => onDeleteAdmin?.(admin)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}

        {filteredOfficeAdmins.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            No office admins match your current filters.
          </p>
        ) : null}
      </div>

      <div className="mt-4 hidden max-w-full overflow-x-auto lg:block">
        <table className="w-full min-w-[980px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[18%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[26%]" />
            <col className="w-[16%]" />
          </colgroup>
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
                <td className="break-words px-3 py-3 font-medium text-slate-800">{admin.fullName}</td>
                <td className="break-all px-3 py-3 text-slate-600">{admin.email}</td>
                <td className="break-words px-3 py-3 text-slate-700">{admin.department}</td>
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
                    className="h-9 w-full min-w-0 rounded-lg px-3"
                    ariaLabel={`Assign department for ${admin.fullName}`}
                    value={getSelectedDepartmentId(admin)}
                    onChange={(nextDepartmentId) => onDraftDepartmentChange(admin.id, nextDepartmentId)}
                    options={departmentAssignmentOptions}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      disabled={processingAdminIds.has(admin.id)}
                      onClick={() => onSaveAssignment(admin)}
                      className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAdminIds.has(admin.id) ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={processingAdminIds.has(admin.id)}
                      onClick={() => onDeleteAdmin?.(admin)}
                      title={`Delete ${admin.fullName}`}
                      aria-label={`Delete ${admin.fullName}`}
                      className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
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
