import { useMemo, useState } from 'react'
import { generateNextUserId, usersFilters, usersRows, usersStats } from '../Data/usersData'
import { notifyError, notifySuccess } from '../../components/ui/toastHelpers'
import {
  AddUserFormModal,
  EditUserFormModal,
  UserStatCard,
  UserProfileModal,
  UsersPagination,
  UsersTable,
  UsersToolbar,
} from '../../components/Users-Ui'

export function Users({ onViewUserProfile }) {
  const pageSize = 8
  const [users, setUsers] = useState(usersRows)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState(usersFilters.sortOptions[0])
  const [filterBy, setFilterBy] = useState(usersFilters.filterOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])

  const filteredAndSortedUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    const filteredUsers = users.filter((user) => {
      const matchesFilter = filterBy === 'All' ? true : user.status === filterBy
      const matchesSearch =
        query.length === 0
          ? true
          : [user.name, user.email, user.address].some((field) =>
              field.toLowerCase().includes(query)
            )

      return matchesFilter && matchesSearch
    })

    return [...filteredUsers].sort((a, b) => {
      if (sortBy === 'Name') {
        return a.name.localeCompare(b.name)
      }

      if (sortBy === 'Oldest') {
        return a.registeredAtValue - b.registeredAtValue
      }

      return b.registeredAtValue - a.registeredAtValue
    })
  }, [users, searchTerm, sortBy, filterBy])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const visibleUsers = filteredAndSortedUsers.slice(startIndex, startIndex + pageSize)

  const visiblePages = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (safeCurrentPage <= 2) {
      return [1, 2, 3]
    }

    if (safeCurrentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages]
    }

    return [safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1]
  }, [safeCurrentPage, totalPages])

  function handleSortChange(value) {
    setSortBy(value)
    setCurrentPage(1)
  }

  function handleFilterChange(value) {
    setFilterBy(value)
    setCurrentPage(1)
  }

  function handleSearchChange(value) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function handleAddUserSubmit(formData) {
    const name = formData.name?.trim()
    const email = formData.email?.trim().toLowerCase()
    const address = formData.address?.trim()

    if (!name || !email || !address) {
      notifyError(
        'Add user failed.',
        'Complete all required fields (name, email, address) before submitting.'
      )
      return
    }

    const isDuplicateEmail = users.some((user) => user.email.toLowerCase() === email)
    if (isDuplicateEmail) {
      notifyError('Add user failed.', 'Use a different email. This email is already registered.')
      return
    }

    const createdAt = Date.now()
    const registeredAt = new Date(createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    })

    setUsers((previousUsers) => [
      {
        id: generateNextUserId(previousUsers),
        name,
        email,
        address,
        status: formData.status,
        registeredAt,
        registeredAtValue: createdAt,
      },
      ...previousUsers,
    ])

    setIsAddUserModalOpen(false)
    setCurrentPage(1)
    notifySuccess(`User added successfully (${email}).`)
  }

  function handlePageChange(page) {
    setCurrentPage(page)
  }

  function handleNextPage() {
    setCurrentPage((previousPage) => Math.min(previousPage + 1, totalPages))
  }

  function handlePreviousPage() {
    setCurrentPage((previousPage) => Math.max(previousPage - 1, 1))
  }

  function handleViewUser(user) {
    setSelectedUser(user)
    if (onViewUserProfile) {
      onViewUserProfile(user)
      return
    }
    setIsViewProfileOpen(true)
  }

  function handleEditUser(user) {
    setSelectedUser(user)
    setIsEditUserOpen(true)
  }

  function handleEditUserSubmit(formData) {
    if (!selectedUser) {
      notifyError('Edit user failed.', 'Select a user first, then try editing again.')
      return
    }

    const name = formData.name?.trim()
    const email = formData.email?.trim().toLowerCase()
    const address = formData.address?.trim()

    if (!name || !email || !address) {
      notifyError(
        'Edit user failed.',
        'Complete all required fields (name, email, address) before saving.'
      )
      return
    }

    const isDuplicateEmail = users.some(
      (user) => user.id !== selectedUser.id && user.email.toLowerCase() === email
    )
    if (isDuplicateEmail) {
      notifyError(
        'Edit user failed.',
        'Use a different email. Another user is already using this email.'
      )
      return
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              name,
              email,
              address,
              status: formData.status,
            }
          : user
      )
    )

    setIsEditUserOpen(false)
    setSelectedUser(null)
    notifySuccess('User details updated successfully.')
  }

  function handleBanUser(targetUser) {
    if (!targetUser) {
      notifyError('Ban user failed.', 'Select a valid user and try again.')
      return
    }

    if (targetUser.status === 'Banned') {
      notifyError('Ban user failed.', 'This user is already banned. No further action is needed.')
      return
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user.id === targetUser.id
          ? {
              ...user,
              status: 'Banned',
            }
          : user
      )
    )

    notifySuccess(`${targetUser.name} was banned successfully.`)
  }

  function handleToggleSelectUser(userId) {
    setSelectedUserIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId]
    )
  }

  function handleToggleSelectAllVisibleUsers() {
    const visibleIds = visibleUsers.map((user) => user.id)
    const allVisibleSelected = visibleIds.every((id) => selectedUserIds.includes(id))

    setSelectedUserIds((previous) => {
      if (allVisibleSelected) {
        return previous.filter((id) => !visibleIds.includes(id))
      }
      const merged = new Set([...previous, ...visibleIds])
      return Array.from(merged)
    })
  }

  function handleBulkStatusUpdate(status) {
    if (!selectedUserIds.length) {
      notifyError('Bulk update failed.', 'Select one or more users first.')
      return
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        selectedUserIds.includes(user.id) ? { ...user, status } : user
      )
    )

    notifySuccess(`Updated status to ${status} for ${selectedUserIds.length} user(s).`)
    setSelectedUserIds([])
  }

  function handleBulkBanUsers() {
    if (!selectedUserIds.length) {
      notifyError('Bulk ban failed.', 'Select one or more users first.')
      return
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        selectedUserIds.includes(user.id) ? { ...user, status: 'Banned' } : user
      )
    )

    notifySuccess(`Banned ${selectedUserIds.length} user(s) successfully.`)
    setSelectedUserIds([])
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 text-xs text-slate-600">
            !
          </span>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {usersStats.map((stat) => (
            <UserStatCard key={stat.id} {...stat} />
          ))}
        </div>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-200">
          <UsersToolbar
            searchPlaceholder={usersFilters.searchPlaceholder}
            primaryAction={usersFilters.primaryAction}
            searchTerm={searchTerm}
            sortBy={sortBy}
            filterBy={filterBy}
            sortOptions={usersFilters.sortOptions}
            filterOptions={usersFilters.filterOptions}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onFilterChange={handleFilterChange}
            onAddUserClick={() => setIsAddUserModalOpen(true)}
          />
          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4 mt-3 pb-3">
              <span className="text-sm text-slate-600">
                {selectedUserIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate('Verified')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Set Verified
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate('Unverified')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Set Unverified
              </button>
              <button
                type="button"
                onClick={handleBulkBanUsers}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Ban Selected
              </button>
            </div>
          )}
          <UsersTable
            users={visibleUsers}
            selectedUserIds={selectedUserIds}
            onToggleSelectUser={handleToggleSelectUser}
            onToggleSelectAllUsers={handleToggleSelectAllVisibleUsers}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onBanUser={handleBanUser}
          />
          <UsersPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            visiblePages={visiblePages}
            onPageChange={handlePageChange}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
          />
        </section>

        <AddUserFormModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSubmit={handleAddUserSubmit}
        />

        <UserProfileModal
          user={selectedUser}
          isOpen={isViewProfileOpen}
          onClose={() => {
            setIsViewProfileOpen(false)
            setSelectedUser(null)
          }}
        />

        <EditUserFormModal
          key={selectedUser?.id ?? 'edit-user-modal'}
          user={selectedUser}
          isOpen={isEditUserOpen}
          onClose={() => {
            setIsEditUserOpen(false)
            setSelectedUser(null)
          }}
          onSubmit={handleEditUserSubmit}
        />
      </div>
    </main>
  )
}