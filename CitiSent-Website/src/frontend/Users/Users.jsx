import { useCallback, useEffect, useMemo, useState } from 'react'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { notifyError, notifySuccess } from '../../components/ui/toastHelpers'
import { usersApiService } from '../../services/api/admin/usersApiService'
import {
  mapBackendUserToUiRow,
  mapUiStatusToBackendUserStatus,
} from '../../services/api/admin/accountsApiMappers'
import { loadFromStorageWithSchema } from '../../services/storageService'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'
import { isSuperadmin, normalizeUserRole } from '../../models/roleAccessModel'
import {
  AddUserFormModal,
  EditUserFormModal,
  UserStatCard,
  UserProfileModal,
  UsersPagination,
  UsersTable,
  UsersToolbar,
} from '../../components/Users-Ui'

const USERS_STATS = [
  {
    id: 'active-users',
    label: 'Active Users',
    icon: 'user',
    accent: 'indigo',
  },
  {
    id: 'banned-users',
    label: 'Banned Users',
    icon: 'user-x',
    accent: 'orange',
  },
]

const USERS_FILTERS = {
  searchPlaceholder: 'Search',
  sortOptions: ['Newest', 'Oldest', 'Name'],
  filterOptions: ['All', 'Active', 'Banned'],
  primaryAction: 'Add User',
}

function getStoredAccessToken() {
  const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)

  return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', {
    schemaVersion: schemaRule.schemaVersion,
    migrate: schemaRule.migrate,
    validate: schemaRule.validate,
  })
}

function mapFilterToBackendStatus(filterValue) {
  if (filterValue === 'Active') {
    return 'active'
  }

  if (filterValue === 'Banned') {
    return 'banned'
  }

  return undefined
}

export function Users({ onViewUserProfile, profile, onTemporaryPasswordCreated }) {
  const pageSize = 8
  const [users, setUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ active: 0, banned: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState(USERS_FILTERS.sortOptions[0])
  const [filterBy, setFilterBy] = useState(USERS_FILTERS.filterOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const resolvedRole = normalizeUserRole(profile?.role)
  const canCreateUsers = isSuperadmin(resolvedRole)
  const canToggleBan = isSuperadmin(resolvedRole)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, filterBy])

  const fetchUsersPage = useCallback(
    async (pageNumber) => {
      const token = getStoredAccessToken()
      if (!token) {
        setUsers([])
        setTotalUsers(0)
        setIsLoading(false)
        notifyError('Users unavailable.', 'Your session has expired. Please sign in again.')
        return
      }

      setIsLoading(true)

      try {
        const response = await usersApiService.listUsers(token, {
          limit: pageSize,
          offset: (pageNumber - 1) * pageSize,
          search: debouncedSearchTerm || undefined,
          status: mapFilterToBackendStatus(filterBy),
        })

        const mappedUsers = (response?.data || []).map(mapBackendUserToUiRow)
        const total = Number(response?.pagination?.total)

        setUsers(mappedUsers)
        setTotalUsers(Number.isFinite(total) ? total : mappedUsers.length)
        setSelectedUserIds((previousIds) =>
          previousIds.filter((id) => mappedUsers.some((user) => user.id === id))
        )
      } catch (error) {
        setUsers([])
        setTotalUsers(0)
        notifyError('Unable to load users.', error.message)
      } finally {
        setIsLoading(false)
      }
    },
    [debouncedSearchTerm, filterBy]
  )

  const refreshUserStats = useCallback(async () => {
    const token = getStoredAccessToken()
    if (!token) {
      return
    }

    try {
      const [activeResponse, bannedResponse] = await Promise.all([
        usersApiService.listUsers(token, { limit: 1, offset: 0, status: 'active' }),
        usersApiService.listUsers(token, { limit: 1, offset: 0, status: 'banned' }),
      ])

      const activeTotal = Number(activeResponse?.pagination?.total)
      const bannedTotal = Number(bannedResponse?.pagination?.total)

      setStats({
        active: Number.isFinite(activeTotal) ? activeTotal : 0,
        banned: Number.isFinite(bannedTotal) ? bannedTotal : 0,
      })
    } catch {
      setStats({ active: 0, banned: 0 })
    }
  }, [])

  useEffect(() => {
    fetchUsersPage(currentPage)
  }, [currentPage, fetchUsersPage])

  useEffect(() => {
    refreshUserStats()
  }, [refreshUserStats])

  const visibleUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (sortBy === 'Name') {
        return a.name.localeCompare(b.name)
      }

      if (sortBy === 'Oldest') {
        return a.registeredAtValue - b.registeredAtValue
      }

      return b.registeredAtValue - a.registeredAtValue
    })
  }, [users, sortBy])

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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
  }

  function handleSearchChange(value) {
    setSearchTerm(value)
  }

  async function handleAddUserSubmit(formData) {
    if (!canCreateUsers) {
      notifyError('Add user denied.', 'Only superadmins can create new users.')
      return false
    }

    const name = formData.name?.trim()
    const email = formData.email?.trim().toLowerCase()
    const address = formData.address?.trim()

    if (!name || !email || !address) {
      notifyError(
        'Add user failed.',
        'Complete all required fields (name, email, address) before submitting.'
      )
      return false
    }

    const token = getStoredAccessToken()
    if (!token) {
      notifyError('Add user failed.', 'Your session has expired. Please sign in again.')
      return false
    }

    try {
      const response = await usersApiService.createUser(token, {
        fullName: name,
        email,
        address,
        accountType: 'citizen',
        status: mapUiStatusToBackendUserStatus(formData.status),
      })

      const temporaryPassword = response?.data?.temporaryPassword
      let wasStoredInNotifications = false

      if (temporaryPassword && onTemporaryPasswordCreated) {
        const notificationResult = await onTemporaryPasswordCreated({
          fullName: name,
          email,
          temporaryPassword,
        })
        wasStoredInNotifications = Boolean(notificationResult?.ok)
      }

      setIsAddUserModalOpen(false)
      setCurrentPage(1)
      await Promise.all([fetchUsersPage(1), refreshUserStats()])
      notifySuccess(
        temporaryPassword
          ? wasStoredInNotifications
            ? `User added successfully (${email}). Temporary password saved in Notifications.`
            : `User added successfully (${email}). Temporary password: ${temporaryPassword}`
          : `User added successfully (${email}).`
      )
      return true
    } catch (error) {
      notifyError('Add user failed.', error.message)
      return false
    }
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

  async function handleViewUser(user) {
    const token = getStoredAccessToken()
    if (!token) {
      notifyError('View profile failed.', 'Your session has expired. Please sign in again.')
      return
    }

    try {
      const response = await usersApiService.getUserById(token, user.id)
      const detailedUser = mapBackendUserToUiRow(response?.data || {})
      setSelectedUser(detailedUser)

      if (onViewUserProfile) {
        onViewUserProfile(detailedUser)
        return
      }

      setIsViewProfileOpen(true)
    } catch (error) {
      notifyError('View profile failed.', error.message)
    }
  }

  function handleEditUser(user) {
    setSelectedUser(user)
    setIsEditUserOpen(true)
  }

  async function handleEditUserSubmit(formData) {
    if (!selectedUser) {
      notifyError('Edit user failed.', 'Select a user first, then try editing again.')
      return false
    }

    const name = formData.name?.trim()
    const address = formData.address?.trim()

    if (!name || !address) {
      notifyError(
        'Edit user failed.',
        'Complete all required fields (name and address) before saving.'
      )
      return false
    }

    const token = getStoredAccessToken()
    if (!token) {
      notifyError('Edit user failed.', 'Your session has expired. Please sign in again.')
      return false
    }

    try {
      const response = await usersApiService.updateUser(token, selectedUser.id, {
        fullName: name,
        address,
      })

      const updatedUser = mapBackendUserToUiRow(response?.data || {})
      setUsers((previousUsers) =>
        previousUsers.map((user) => (user.id === selectedUser.id ? updatedUser : user))
      )
      setSelectedUser(updatedUser)
      setIsEditUserOpen(false)
      notifySuccess('User details updated successfully.')
      return true
    } catch (error) {
      notifyError('Edit user failed.', error.message)
      return false
    }
  }

  async function handleToggleBanUser(targetUser) {
    if (!canToggleBan) {
      notifyError('Action denied.', 'Only superadmins can ban or unban users.')
      return
    }

    if (!targetUser) {
      notifyError('User update failed.', 'Select a valid user and try again.')
      return
    }

    const token = getStoredAccessToken()
    if (!token) {
      notifyError('User update failed.', 'Your session has expired. Please sign in again.')
      return
    }

    try {
      const response =
        targetUser.status === 'Banned'
          ? await usersApiService.unbanUser(token, targetUser.id)
          : await usersApiService.banUser(token, targetUser.id, {
              reason: 'Banned by administrator from Users page',
            })

      const updatedUser = mapBackendUserToUiRow(response?.data || {})
      setUsers((previousUsers) =>
        previousUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )

      await refreshUserStats()
      notifySuccess(
        updatedUser.status === 'Banned'
          ? `${updatedUser.name} was banned successfully.`
          : `${updatedUser.name} was unbanned successfully.`
      )
    } catch (error) {
      notifyError('User update failed.', error.message)
    }
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

  async function handleBulkBanUsers() {
    if (!canToggleBan) {
      notifyError('Bulk action denied.', 'Only superadmins can ban users.')
      return
    }

    if (!selectedUserIds.length) {
      notifyError('Bulk ban failed.', 'Select one or more users first.')
      return
    }

    const token = getStoredAccessToken()
    if (!token) {
      notifyError('Bulk ban failed.', 'Your session has expired. Please sign in again.')
      return
    }

    const operations = await Promise.allSettled(
      selectedUserIds.map((userId) =>
        usersApiService.banUser(token, userId, {
          reason: 'Bulk ban from Users page',
        })
      )
    )

    const successfulCount = operations.filter((result) => result.status === 'fulfilled').length
    const failedCount = operations.length - successfulCount

    setSelectedUserIds([])
    await Promise.all([fetchUsersPage(safeCurrentPage), refreshUserStats()])

    if (failedCount > 0) {
      notifyError(
        'Bulk ban partially failed.',
        `${successfulCount} user(s) banned, ${failedCount} user(s) failed.`
      )
      return
    }

    notifySuccess(`Banned ${successfulCount} user(s) successfully.`)
  }

  async function handleBulkUnbanUsers() {
    if (!canToggleBan) {
      notifyError('Bulk action denied.', 'Only superadmins can unban users.')
      return
    }

    if (!selectedUserIds.length) {
      notifyError('Bulk unban failed.', 'Select one or more users first.')
      return
    }

    const token = getStoredAccessToken()
    if (!token) {
      notifyError('Bulk unban failed.', 'Your session has expired. Please sign in again.')
      return
    }

    const operations = await Promise.allSettled(
      selectedUserIds.map((userId) => usersApiService.unbanUser(token, userId))
    )

    const successfulCount = operations.filter((result) => result.status === 'fulfilled').length
    const failedCount = operations.length - successfulCount

    setSelectedUserIds([])
    await Promise.all([fetchUsersPage(safeCurrentPage), refreshUserStats()])

    if (failedCount > 0) {
      notifyError(
        'Bulk unban partially failed.',
        `${successfulCount} user(s) unbanned, ${failedCount} user(s) failed.`
      )
      return
    }

    notifySuccess(`Unbanned ${successfulCount} user(s) successfully.`)
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
          {USERS_STATS.map((stat) => {
            const value = stat.id === 'active-users' ? String(stats.active) : String(stats.banned)
            return <UserStatCard key={stat.id} {...stat} value={value} />
          })}
        </div>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-200">
          <UsersToolbar
            searchPlaceholder={USERS_FILTERS.searchPlaceholder}
            primaryAction={USERS_FILTERS.primaryAction}
            searchTerm={searchTerm}
            sortBy={sortBy}
            filterBy={filterBy}
            sortOptions={USERS_FILTERS.sortOptions}
            filterOptions={USERS_FILTERS.filterOptions}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onFilterChange={handleFilterChange}
            onAddUserClick={() => setIsAddUserModalOpen(true)}
            disableAddUser={!canCreateUsers}
          />
          {isLoading ? (
            <div className="px-4 pt-3 text-sm text-slate-500">Loading users...</div>
          ) : null}
          {selectedUserIds.length > 0 && canToggleBan && (
            <div className="flex flex-wrap items-center gap-2 px-4 mt-3 pb-3">
              <span className="text-sm text-slate-600">
                {selectedUserIds.length} selected
              </span>
              <button
                type="button"
                onClick={handleBulkUnbanUsers}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Activate Selected
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
            onToggleBanUser={handleToggleBanUser}
            canToggleBan={canToggleBan}
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
