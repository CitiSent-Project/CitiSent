import { Spinner } from '../../components/ui/Spinner'
import { AddUserFormModal, DeleteUserConfirmModal, EditUserFormModal, UserStatCard, UsersPagination, UsersTable, UsersToolbar } from '../../components/Users-Ui'
import { useUsersState } from '../../hooks/useUsersState'

const stats = [{ id: 'active-users', label: 'Active Users', icon: 'user', accent: 'blue' }, { id: 'pending-users', label: 'Pending Users', icon: 'user', accent: 'cyan' }, { id: 'banned-users', label: 'Banned Users', icon: 'user-x', accent: 'orange' }]

export function Users({ onViewUserProfile, profile }) {
  const s = useUsersState({ profile, onViewUserProfile })
  return (
    <main className="w-full flex-1 min-w-0 bg-[#eef2f8] dark:bg-slate-900 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Users</h1>
          <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400">
            !
          </span>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <UserStatCard
              key={item.id}
              {...item}
              value={String(
                item.id === 'active-users'
                  ? s.stats.active
                  : item.id === 'pending-users'
                  ? s.stats.pending
                  : s.stats.banned
              )}
            />
          ))}
        </div>
        <section className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700/80">
          <UsersToolbar
            searchPlaceholder="Search"
            primaryAction="Add User"
            searchTerm={s.searchTerm}
            sortBy={s.sortBy}
            filterBy={s.filterBy}
            sortOptions={['Newest', 'Oldest', 'Name']}
            filterOptions={['All', 'Active', 'Pending', 'Banned']}
            onSearchChange={s.handleSearchChange}
            onSortChange={s.handleSortChange}
            onFilterChange={s.handleFilterChange}
            onAddUserClick={() => s.setIsAddUserModalOpen(true)}
            disableAddUser={!s.canCreateUsers}
          />
          {s.selectedVisibleUserIds.length > 0 && s.canToggleBan && (
            <div className="flex flex-wrap items-center gap-2 px-4 mt-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {s.selectedVisibleUserIds.length} selected
              </span>
              <button
                type="button"
                onClick={s.handleBulkUnbanUsers}
                disabled={s.selectedBannedCount === 0 || s.isBulkUnbanning || s.isBulkBanning}
                className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s.isBulkUnbanning && <Spinner size="sm" />}
                {s.selectedBannedCount > 0
                  ? `Activate Selected (${s.selectedBannedCount})`
                  : 'Activate Selected'}
              </button>
              <button
                type="button"
                onClick={s.handleBulkBanUsers}
                disabled={s.selectedActiveCount === 0 || s.isBulkBanning || s.isBulkUnbanning}
                className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s.isBulkBanning && <Spinner size="sm" />}
                {s.selectedActiveCount > 0
                  ? `Ban Selected (${s.selectedActiveCount})`
                  : 'Ban Selected'}
              </button>
            </div>
          )}
          <UsersTable
            users={s.visibleUsers}
            selectedUserIds={s.selectedVisibleUserIds}
            onToggleSelectUser={s.handleToggleSelectUser}
            onToggleSelectAllUsers={s.handleToggleSelectAllVisibleUsers}
            onViewUser={s.handleViewUser}
            onEditUser={s.handleEditUser}
            onToggleBanUser={s.handleToggleBanUser}
            onDeleteUser={s.setUserPendingDeletion}
            canToggleBan={s.canToggleBan}
            isLoading={s.isLoading}
            processingUserIds={s.processingUserIds}
          />
          <UsersPagination
            currentPage={s.activePage}
            totalPages={s.totalPages}
            visiblePages={s.visiblePages}
            onPageChange={s.handlePageChange}
            onNextPage={s.handleNextPage}
            onPreviousPage={s.handlePreviousPage}
          />
        </section>
        <AddUserFormModal
          isOpen={s.isAddUserModalOpen}
          onClose={() => s.setIsAddUserModalOpen(false)}
          onSubmit={s.handleAddUserSubmit}
        />
        <EditUserFormModal
          key={s.selectedUser?.id ?? 'edit-user-modal'}
          user={s.selectedUser}
          isOpen={s.isEditUserOpen}
          onClose={s.closeEditModal}
          onSubmit={s.handleEditUserSubmit}
        />
        <DeleteUserConfirmModal
          user={s.userPendingDeletion}
          isOpen={Boolean(s.userPendingDeletion)}
          isDeleting={s.userPendingDeletion ? s.processingUserIds.has(s.userPendingDeletion.id) : false}
          onCancel={() => s.setUserPendingDeletion(null)}
          onConfirm={s.handleDeleteUser}
        />
      </div>
    </main>
  )
}
