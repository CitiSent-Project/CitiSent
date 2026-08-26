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

  useEffect(() => {
    if (usersQuery.error) notifyErrorWithRetry('Unable to load users.', usersQuery.error.message, () => usersQuery.refetch())
  }, [usersQuery.error, usersQuery.refetch])
  useEffect(() => {
    if (userStatsQuery.error) notifyErrorWithRetry('Unable to load user statistics.', userStatsQuery.error.message, () => userStatsQuery.refetch())
  }, [userStatsQuery.error, userStatsQuery.refetch])

  async function invalidateUsersData() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin-users'] }), queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })])
  }

  const users = usersQuery.data?.users || []
  const totalUsers = usersQuery.data?.totalUsers || 0
  const visibleUsers = useMemo(() => [...users].sort((a, b) => sortBy === 'Name' ? a.name.localeCompare(b.name) : sortBy === 'Oldest' ? a.registeredAtValue - b.registeredAtValue : b.registeredAtValue - a.registeredAtValue), [users, sortBy])
  const selectedVisibleUserIds = useMemo(() => selectedUserIds.filter((id) => visibleUsers.some((user) => user.id === id)), [selectedUserIds, visibleUsers])
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

  async function runBulkAction(action, verb) {
    if (!canToggleBan) return notifyError('Bulk action denied.', `Only superadmins can ${verb} users.`)
    if (!selectedVisibleUserIds.length) return notifyError(`Bulk ${verb} failed.`, 'Select one or more users first.')
    const token = getStoredAccessToken(); if (!token) return notifyError(`Bulk ${verb} failed.`, 'Your session has expired. Please sign in again.')
    const operations = await Promise.allSettled(selectedVisibleUserIds.map((id) => action(token, id)))
    const successfulCount = operations.filter((result) => result.status === 'fulfilled').length; const failedCount = operations.length - successfulCount
    setSelectedUserIds([]); await invalidateUsersData()
    if (failedCount) return notifyError(`Bulk ${verb} partially failed.`, `${successfulCount} user(s) ${verb === 'ban' ? 'banned' : 'unbanned'}, ${failedCount} user(s) failed.`)
    notifySuccess(`${verb === 'ban' ? 'Banned' : 'Unbanned'} ${successfulCount} user(s) successfully.`)
  }
  async function handleBulkBanUsers() { setIsBulkBanning(true); try { await runBulkAction((token, id) => usersApiService.banUser(token, id, { reason: 'Bulk ban from Users page' }), 'ban') } finally { setIsBulkBanning(false) } }
  async function handleBulkUnbanUsers() { setIsBulkUnbanning(true); try { await runBulkAction((token, id) => usersApiService.unbanUser(token, id), 'unban') } finally { setIsBulkUnbanning(false) } }

  return { searchTerm, sortBy, filterBy, visibleUsers, selectedVisibleUserIds, totalPages, activePage, visiblePages, stats: userStatsQuery.data || { active: 0, pending: 0, banned: 0 }, isLoading: usersQuery.isLoading || usersQuery.isFetching, canCreateUsers, canToggleBan, isAddUserModalOpen, setIsAddUserModalOpen, selectedUser, isEditUserOpen, setIsEditUserOpen, userPendingDeletion, setUserPendingDeletion, processingUserIds, isBulkBanning, isBulkUnbanning, handleSortChange, handleFilterChange, handleSearchChange, handlePageChange, handleNextPage, handlePreviousPage, handleAddUserSubmit, handleViewUser, handleEditUser, handleEditUserSubmit, handleToggleBanUser, handleDeleteUser, handleToggleSelectUser, handleToggleSelectAllVisibleUsers, handleBulkBanUsers, handleBulkUnbanUsers, closeEditModal: () => { setIsEditUserOpen(false); setSelectedUser(null) } }
}
