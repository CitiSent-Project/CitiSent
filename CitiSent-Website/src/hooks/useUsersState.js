import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ADMIN_STORAGE_KEYS } from '../models/data'
import { getStorageSchemaRule } from '../models/storageSchemaModel'
import { isSuperadmin, normalizeUserRole } from '../models/roleAccessModel'
import { notifyError, notifyErrorWithRetry, notifySuccess } from '../components/ui/toastHelpers'
import { usersApiService } from '../services/api/admin/usersApiService'
import { mapBackendUserToUiRow, mapUiStatusToBackendUserStatus } from '../services/api/admin/accountsApiMappers'
import { loadFromStorageWithSchema } from '../services/storageService'

const PAGE_SIZE = 8

function getStoredAccessToken() {
  const rule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
  return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', rule)
}

function mapFilterToBackendStatus(filter) {
  return { Active: 'active', Banned: 'banned', Pending: 'pending' }[filter]
}

export function useUsersState({ profile, onViewUserProfile }) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('Newest')
  const [filterBy, setFilterBy] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [userPendingDeletion, setUserPendingDeletion] = useState(null)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [processingUserIds, setProcessingUserIds] = useState(new Set())
  const [isBulkBanning, setIsBulkBanning] = useState(false)
  const [isBulkUnbanning, setIsBulkUnbanning] = useState(false)
  const canCreateUsers = isSuperadmin(normalizeUserRole(profile?.role))
  const canToggleBan = canCreateUsers
  const hasAccessToken = Boolean(getStoredAccessToken())

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 250)
    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  const usersQuery = useQuery({
    queryKey: ['admin-users', debouncedSearchTerm, filterBy, currentPage, PAGE_SIZE],
    enabled: hasAccessToken,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const token = getStoredAccessToken()
      if (!token) throw new Error('Your session has expired. Please sign in again.')
      const response = await usersApiService.listUsers(token, { limit: PAGE_SIZE, offset: (currentPage - 1) * PAGE_SIZE, search: debouncedSearchTerm || undefined, status: mapFilterToBackendStatus(filterBy) })
      const users = (response?.data || []).map(mapBackendUserToUiRow)
      const total = Number(response?.pagination?.total)
      return { users, totalUsers: Number.isFinite(total) ? total : users.length }
    },
  })

  const userStatsQuery = useQuery({
    queryKey: ['admin-users-stats'],
    enabled: hasAccessToken,
    queryFn: async () => {
      const token = getStoredAccessToken()
      if (!token) throw new Error('Your session has expired. Please sign in again.')
      const [active, pending, banned] = await Promise.all(['active', 'pending', 'banned'].map((status) => usersApiService.listUsers(token, { limit: 1, offset: 0, status })))
      const total = (response) => Number.isFinite(Number(response?.pagination?.total)) ? Number(response.pagination.total) : 0
      return { active: total(active), pending: total(pending), banned: total(banned) }
    },
  })

  const usersError = usersQuery.error
  const refetchUsers = usersQuery.refetch
  useEffect(() => {
    if (usersError) notifyErrorWithRetry('Unable to load users.', usersError.message, () => refetchUsers())
  }, [usersError, refetchUsers])

  const userStatsError = userStatsQuery.error
  const refetchUserStats = userStatsQuery.refetch
  useEffect(() => {
    if (userStatsError) notifyErrorWithRetry('Unable to load user statistics.', userStatsError.message, () => refetchUserStats())
  }, [userStatsError, refetchUserStats])

  async function invalidateUsersData() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin-users'] }), queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })])
  }

  const users = useMemo(() => usersQuery.data?.users || [], [usersQuery.data?.users])
  const totalUsers = usersQuery.data?.totalUsers || 0
  const visibleUsers = useMemo(() => [...users].sort((a, b) => sortBy === 'Name' ? a.name.localeCompare(b.name) : sortBy === 'Oldest' ? a.registeredAtValue - b.registeredAtValue : b.registeredAtValue - a.registeredAtValue), [users, sortBy])
  const selectedVisibleUserIds = useMemo(() => selectedUserIds.filter((id) => visibleUsers.some((user) => user.id === id)), [selectedUserIds, visibleUsers])
  const selectedVisibleUsers = useMemo(
    () => visibleUsers.filter((user) => selectedVisibleUserIds.includes(user.id)),
    [visibleUsers, selectedVisibleUserIds]
  )
  const selectedActiveUsers = useMemo(
    () => selectedVisibleUsers.filter((user) => user.status !== 'Banned'),
    [selectedVisibleUsers]
  )
  const selectedBannedUsers = useMemo(
    () => selectedVisibleUsers.filter((user) => user.status === 'Banned'),
    [selectedVisibleUsers]
  )
  const selectedActiveCount = selectedActiveUsers.length
  const selectedBannedCount = selectedBannedUsers.length

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const visiblePages = useMemo(() => totalPages <= 3 ? Array.from({ length: totalPages }, (_, index) => index + 1) : activePage <= 2 ? [1, 2, 3] : activePage >= totalPages - 1 ? [totalPages - 2, totalPages - 1, totalPages] : [activePage - 1, activePage, activePage + 1], [activePage, totalPages])

  function handleSortChange(value) { setSortBy(value); setCurrentPage(1) }
  function handleFilterChange(value) { setFilterBy(value); setCurrentPage(1); setSelectedUserIds([]) }
  function handleSearchChange(value) { setSearchTerm(value); setCurrentPage(1); setSelectedUserIds([]) }
  function handlePageChange(page) { setCurrentPage(page); setSelectedUserIds([]) }
  function handleNextPage() { setCurrentPage((page) => Math.min(page + 1, totalPages)) }
  function handlePreviousPage() { setCurrentPage((page) => Math.max(page - 1, 1)) }
  function handleToggleSelectUser(userId) { setSelectedUserIds((ids) => ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]) }
  function handleToggleSelectAllVisibleUsers() {
    const visibleIds = visibleUsers.map((user) => user.id)
    const allSelected = visibleIds.every((id) => selectedVisibleUserIds.includes(id))
    setSelectedUserIds((ids) => allSelected ? ids.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...ids, ...visibleIds])))
  }

  async function handleAddUserSubmit(formData) {
    if (!canCreateUsers) { notifyError('Add user denied.', 'Only superadmins can create new users.'); return false }
    const fname = formData.fname?.trim(); const mname = formData.mname?.trim(); const lname = formData.lname?.trim(); const username = formData.username?.trim().toLowerCase(); const email = formData.email?.trim().toLowerCase(); const barangay = formData.barangay?.trim(); const city = formData.city?.trim(); const province = formData.province?.trim()
    if (!fname || !lname || !username || !email || !barangay) { notifyError('Add user failed.', 'Complete all required fields, including a username, before submitting.'); return false }
    if (!/^[a-z0-9_]{3,40}$/.test(username)) { notifyError('Add user failed.', 'Username must be 3–40 characters and contain only letters, numbers, or underscores.'); return false }
    const token = getStoredAccessToken()
    if (!token) { notifyError('Add user failed.', 'Your session has expired. Please sign in again.'); return false }
    try {
      const response = await usersApiService.createUser(token, { fname, mname: mname || null, lname, username, email, barangay, city: city || null, province: province || null, accountType: 'citizen', status: mapUiStatusToBackendUserStatus(formData.status) })
      setIsAddUserModalOpen(false); setCurrentPage(1); await invalidateUsersData()
      notifySuccess(response?.data?.invitationStatus === 'pending' ? `User added successfully (${email}). Invitation email sent.` : `User added successfully (${email}).`)
      return true
    } catch (error) { notifyError('Add user failed.', error.message); return false }
  }

  async function handleViewUser(user) {
    const token = getStoredAccessToken()
    if (!token) return notifyError('View profile failed.', 'Your session has expired. Please sign in again.')
    try { const response = await usersApiService.getUserById(token, user.id); const detailedUser = mapBackendUserToUiRow(response?.data || {}); setSelectedUser(detailedUser); onViewUserProfile?.(detailedUser) } catch (error) { notifyError('View profile failed.', error.message) }
  }
  function handleEditUser(user) { setSelectedUser(user); setIsEditUserOpen(true) }
  async function handleEditUserSubmit(formData) {
    if (!selectedUser) { notifyError('Edit user failed.', 'Select a user first, then try editing again.'); return false }
    const fname = formData.fname?.trim(); const mname = formData.mname?.trim(); const lname = formData.lname?.trim(); const barangay = formData.barangay?.trim(); const city = formData.city?.trim(); const province = formData.province?.trim()
    if (!fname || !lname || !barangay) { notifyError('Edit user failed.', 'Complete all required fields (first name, last name, and barangay) before saving.'); return false }
    const token = getStoredAccessToken()
    if (!token) { notifyError('Edit user failed.', 'Your session has expired. Please sign in again.'); return false }
    try { const response = await usersApiService.updateUser(token, selectedUser.id, { fname, mname: mname || null, lname, barangay, city: city || null, province: province || null }); setSelectedUser(mapBackendUserToUiRow(response?.data || {})); setIsEditUserOpen(false); await invalidateUsersData(); notifySuccess('User details updated successfully.'); return true } catch (error) { notifyError('Edit user failed.', error.message); return false }
  }

  async function handleToggleBanUser(user) {
    if (!canToggleBan) return notifyError('Action denied.', 'Only superadmins can ban or unban users.')
    if (!user) return notifyError('User update failed.', 'Select a valid user and try again.')
    const token = getStoredAccessToken(); if (!token) return notifyError('User update failed.', 'Your session has expired. Please sign in again.')
    setProcessingUserIds((ids) => new Set(ids).add(user.id))
    try { const response = user.status === 'Banned' ? await usersApiService.unbanUser(token, user.id) : await usersApiService.banUser(token, user.id, { reason: 'Banned by administrator from Users page' }); const updated = mapBackendUserToUiRow(response?.data || {}); if (selectedUser?.id === updated.id) setSelectedUser(updated); await invalidateUsersData(); notifySuccess(updated.status === 'Banned' ? `${updated.name} was banned successfully.` : `${updated.name} was unbanned successfully.`) } catch (error) { notifyError('User update failed.', error.message) } finally { setProcessingUserIds((ids) => { const next = new Set(ids); next.delete(user.id); return next }) }
  }

  async function handleDeleteUser() {
    if (!userPendingDeletion || !canCreateUsers) return
    const token = getStoredAccessToken(); if (!token) return notifyError('Delete user failed.', 'Your session has expired. Please sign in again.')
    const { id, name } = userPendingDeletion; setProcessingUserIds((ids) => new Set(ids).add(id))
    try { await usersApiService.deleteUser(token, id); setUserPendingDeletion(null); setSelectedUser(null); setSelectedUserIds((ids) => ids.filter((userId) => userId !== id)); await invalidateUsersData(); notifySuccess(`${name} was deleted successfully.`) } catch (error) { notifyError('Delete user failed.', error.message) } finally { setProcessingUserIds((ids) => { const next = new Set(ids); next.delete(id); return next }) }
  }

  async function handleBulkBanUsers() {
    setIsBulkBanning(true)
    try {
      if (!canToggleBan) return notifyError('Bulk action denied.', 'Only superadmins can ban users.')
      const targetUserIds = selectedActiveUsers.map((user) => user.id)
      if (!targetUserIds.length) return notifyError('Bulk ban failed.', 'Select one or more active or pending users to ban.')
      const token = getStoredAccessToken()
      if (!token) return notifyError('Bulk ban failed.', 'Your session has expired. Please sign in again.')
      
      await usersApiService.bulkBanUsers(token, { userIds: targetUserIds, reason: 'Bulk ban from Users page' })
      const successfulCount = targetUserIds.length
      setSelectedUserIds((prev) => prev.filter((id) => !targetUserIds.includes(id)))
      await invalidateUsersData()
      notifySuccess(`Banned ${successfulCount} user(s) successfully.`)
    } catch (error) {
      notifyError('Bulk ban failed.', error.message)
    } finally {
      setIsBulkBanning(false)
    }
  }

  async function handleBulkUnbanUsers() {
    setIsBulkUnbanning(true)
    try {
      if (!canToggleBan) return notifyError('Bulk action denied.', 'Only superadmins can unban users.')
      const targetUserIds = selectedBannedUsers.map((user) => user.id)
      if (!targetUserIds.length) return notifyError('Bulk unban failed.', 'Select one or more banned users to activate.')
      const token = getStoredAccessToken()
      if (!token) return notifyError('Bulk unban failed.', 'Your session has expired. Please sign in again.')
      
      await usersApiService.bulkUnbanUsers(token, { userIds: targetUserIds })
      const successfulCount = targetUserIds.length
      setSelectedUserIds((prev) => prev.filter((id) => !targetUserIds.includes(id)))
      await invalidateUsersData()
      notifySuccess(`Unbanned ${successfulCount} user(s) successfully.`)
    } catch (error) {
      notifyError('Bulk unban failed.', error.message)
    } finally {
      setIsBulkUnbanning(false)
    }
  }

  return {
    searchTerm,
    sortBy,
    filterBy,
    visibleUsers,
    selectedVisibleUserIds,
    selectedActiveUsers,
    selectedBannedUsers,
    selectedActiveCount,
    selectedBannedCount,
    totalPages,
    activePage,
    visiblePages,
    stats: userStatsQuery.data || { active: 0, pending: 0, banned: 0 },
    isLoading: usersQuery.isLoading || usersQuery.isFetching,
    canCreateUsers,
    canToggleBan,
    isAddUserModalOpen,
    setIsAddUserModalOpen,
    selectedUser,
    isEditUserOpen,
    setIsEditUserOpen,
    userPendingDeletion,
    setUserPendingDeletion,
    processingUserIds,
    isBulkBanning,
    isBulkUnbanning,
    handleSortChange,
    handleFilterChange,
    handleSearchChange,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    handleAddUserSubmit,
    handleViewUser,
    handleEditUser,
    handleEditUserSubmit,
    handleToggleBanUser,
    handleDeleteUser,
    handleToggleSelectUser,
    handleToggleSelectAllVisibleUsers,
    handleBulkBanUsers,
    handleBulkUnbanUsers,
    closeEditModal: () => { setIsEditUserOpen(false); setSelectedUser(null) },
  }
}
