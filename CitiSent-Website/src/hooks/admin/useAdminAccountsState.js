import { useCallback } from 'react'
import { USER_ROLES, normalizeUserRole } from '../../models/roleAccessModel'
import { officeAdminsApiService } from '../../services/api/admin/officeAdminsApiService'
import { mapBackendOfficeAdmin } from '../../services/api/admin/accountsApiMappers'

export function useAdminAccountsState({ accessToken, role, setAdminAccounts, notifyError }) {
  const handleRefreshAdminAccounts = useCallback(async () => {
    if (!accessToken || normalizeUserRole(role) !== USER_ROLES.SUPERADMIN) return
    try {
      const response = await officeAdminsApiService.listOfficeAdmins(accessToken)
      setAdminAccounts((response?.data || []).map(mapBackendOfficeAdmin))
    } catch (error) {
      notifyError('Failed to refresh admin accounts.', error.message)
    }
  }, [accessToken, notifyError, role, setAdminAccounts])

  return { handleRefreshAdminAccounts }
}
