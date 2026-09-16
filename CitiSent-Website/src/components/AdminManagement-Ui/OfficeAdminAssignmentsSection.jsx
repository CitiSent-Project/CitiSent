import { FiBell, FiFilter, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import { DropdownButton } from '../ui/DropdownButton'

function getAdminInitials(name) {
  if (!name || typeof name !== 'string') return 'AD'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all sm:p-6 dark:border-slate-700/80 dark:bg-slate-800">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight dark:text-white">Office Admin Assignments</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Manage and reassign department responsibilities for office administrators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50">
            <FiBell className="text-blue-500 text-xs" />
            <span>{totalOfficeUnread} unread notifications</span>
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100 dark:bg-slate-900/40 dark:border-slate-700/60">
        <div className="relative flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <label htmlFor="search-admins-input" className="text-slate-600 dark:text-slate-400">Search Admins</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              id="search-admins-input"
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search name, email, or department..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:border-slate-600"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchTermChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <FiX className="text-xs" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <FiFilter className="text-slate-400 text-xs" />
            <span>Department Filter</span>
          </label>
          <DropdownButton
            className="w-full h-8.5 rounded-lg border-slate-200 bg-white text-xs shadow-2xs hover:border-slate-300"
            ariaLabel="Department filter"
            value={departmentFilter}
            onChange={onDepartmentFilterChange}
            options={departmentFilterOptions}
          />
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="mt-4 space-y-3 lg:hidden">
        {filteredOfficeAdmins.map((admin) => {
          const selectedDeptId = getSelectedDepartmentId(admin)
          const hasChanges = Boolean(selectedDeptId && selectedDeptId !== admin.departmentId)
          const isProcessing = processingAdminIds.has(admin.id)
          const isSaveDisabled = !hasChanges || isProcessing

          return (
            <article
              key={admin.id}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs">
                    {getAdminInitials(admin.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{admin.fullName}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    unreadByAdminId[admin.id] > 0
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {unreadByAdminId[admin.id] || 0} unread
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Current:</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {admin.department}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Assign New Department
                </label>
                <DropdownButton
                  className="h-9 w-full rounded-lg text-xs"
                  ariaLabel={`Assign department for ${admin.fullName}`}
                  value={selectedDeptId}
                  onChange={(nextDepartmentId) => onDraftDepartmentChange(admin.id, nextDepartmentId)}
                  options={departmentAssignmentOptions}
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSaveDisabled}
                    onClick={() => onSaveAssignment(admin)}
                    title={
                      !hasChanges
                        ? 'No changes to save'
                        : isProcessing
                        ? 'Saving changes...'
                        : 'Save assignment changes'
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                      hasChanges && !isProcessing
                        ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-xs shadow-blue-500/20 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed opacity-60 shadow-none dark:bg-slate-700/50 dark:text-slate-500 dark:border-slate-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <FiRefreshCw className="animate-spin text-xs" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FiSave className="text-xs" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onDeleteAdmin?.(admin)}
                    title={`Delete ${admin.fullName}`}
                    aria-label={`Delete ${admin.fullName}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                  >
                    <FiTrash2 className="text-xs" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        {filteredOfficeAdmins.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No office admins match your search or filter.</p>
          </div>
        ) : null}
      </div>

      {/* Desktop Table View */}
      <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200/80 shadow-2xs lg:block dark:border-slate-700">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-245 table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[21%]" />
              <col className="w-[22%]" />
              <col className="w-[21%]" />
              <col className="w-[20%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                <th className="pl-6 pr-3 py-3">Admin</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Current Department</th>
                <th className="px-3 py-3">Assign Department</th>
                <th className="pl-3 pr-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700/60 dark:bg-slate-800">
              {filteredOfficeAdmins.map((admin) => {
                const selectedDeptId = getSelectedDepartmentId(admin)
                const hasChanges = Boolean(selectedDeptId && selectedDeptId !== admin.departmentId)
                const isProcessing = processingAdminIds.has(admin.id)
                const isSaveDisabled = !hasChanges || isProcessing

                return (
                  <tr key={admin.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                    <td className="pl-6 pr-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-2xs">
                          {getAdminInitials(admin.fullName)}
                        </div>
                        <span className="font-semibold text-slate-900 truncate max-w-37.5 dark:text-white" title={admin.fullName}>
                          {admin.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 truncate max-w-45 dark:text-slate-300" title={admin.email}>
                      {admin.email}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 max-w-42.5 truncate dark:bg-slate-700 dark:text-slate-300" title={admin.department}>
                        {admin.department}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <DropdownButton
                        className="h-8 w-full min-w-0 rounded-lg text-xs"
                        ariaLabel={`Assign department for ${admin.fullName}`}
                        value={selectedDeptId}
                        onChange={(nextDepartmentId) => onDraftDepartmentChange(admin.id, nextDepartmentId)}
                        options={departmentAssignmentOptions}
                      />
                    </td>
                    <td className="pl-3 pr-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          disabled={isSaveDisabled}
                          onClick={() => onSaveAssignment(admin)}
                          title={
                            !hasChanges
                              ? 'No changes to save'
                              : isProcessing
                              ? 'Saving changes...'
                              : 'Save assignment changes'
                          }
                          aria-label={`Save department assignment for ${admin.fullName}`}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            hasChanges && !isProcessing
                              ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white shadow-xs shadow-blue-500/20 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed opacity-60 shadow-none dark:bg-slate-700/50 dark:text-slate-500 dark:border-slate-700'
                          }`}
                        >
                          {isProcessing ? (
                            <FiRefreshCw className="animate-spin text-xs" />
                          ) : (
                            <FiSave className="text-xs" />
                          )}
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onDeleteAdmin?.(admin)}
                          title={`Delete ${admin.fullName}`}
                          aria-label={`Delete ${admin.fullName}`}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200/80 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                        >
                          <FiTrash2 className="text-xs" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredOfficeAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                    No office admins match your search or filter criteria.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

