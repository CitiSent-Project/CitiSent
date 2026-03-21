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
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Office admin assignments</h2>676
          <p className="mt-1 text-sm text-slate-600">
            Update department assignments for office admins.
          </p>
        </div>
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800">
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
          <select
            value={departmentFilter}
            onChange={(event) => onDepartmentFilterChange(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.label}
              </option>
            ))}
          </select>
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
                  <select
                    value={getSelectedDepartmentId(admin)}
                    onChange={(event) => onDraftDepartmentChange(admin.id, event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                  >
                    {departmentOptions.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onSaveAssignment(admin)}
                    className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                  >
                    Save assignment
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
