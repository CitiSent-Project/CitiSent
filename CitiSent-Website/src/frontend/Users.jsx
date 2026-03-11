import { useMemo, useState } from 'react'
import { usersFilters, usersRows, usersStats } from './Data/usersData'
import {
  AddUserFormModal,
  EditUserFormModal,
  UserStatCard,
  UserProfileModal,
  UsersPagination,
  UsersTable,
  UsersToolbar,
} from '../components/Users-Ui'

export function Users() {
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

  function buildUserId(previousUsers) {
    const maxNumericId = previousUsers.reduce((max, user) => {
      const numericPart = Number(user.id.replace('USR-', ''))
      return Number.isNaN(numericPart) ? max : Math.max(max, numericPart)
    }, 1200)

    return `USR-${String(maxNumericId + 1)}`
  }

  function handleAddUserSubmit(formData) {
    const createdAt = Date.now()
    const registeredAt = new Date(createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    })

    setUsers((previousUsers) => [
      {
        id: buildUserId(previousUsers),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        status: formData.status,
        registeredAt,
        registeredAtValue: createdAt,
      },
      ...previousUsers,
    ])

    setIsAddUserModalOpen(false)
    setCurrentPage(1)
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
    setIsViewProfileOpen(true)
  }

  function handleEditUser(user) {
    setSelectedUser(user)
    setIsEditUserOpen(true)
  }

  function handleEditUserSubmit(formData) {
    if (!selectedUser) {
      return
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              name: formData.name,
              email: formData.email,
              address: formData.address,
              status: formData.status,
            }
          : user
      )
    )

    setIsEditUserOpen(false)
    setSelectedUser(null)
  }

  function handleBanUser(targetUser) {
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
          <UsersTable
            users={visibleUsers}
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