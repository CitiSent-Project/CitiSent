import { useCallback, useState, useEffect } from 'react'
import { USER_ROLES, normalizeUserRole } from '../../models/roleAccessModel'
import { departmentsApiService } from '../../services/api/admin/departmentsApiService'

export function normalizeDepartmentOption(department) {
  if (!department || typeof department !== 'object') return null

  const id = String(department.id || department.slug || '').trim()
  const label = String(department.label || department.name || '').trim()
  if (!id || !label) return null

  return {
    id,
    agencyId: String(department.agencyId || department.agency_id || '').trim(),
    label,
    slug: String(department.slug || id).trim(),
    name: String(department.name || label).trim(),
    description: String(department.description || '').trim(),
    isActive: department.isActive !== false && department.is_active !== false && department.is_active !== 0,
    logoPath: department.logoPath || department.logo_path || null,
    logoUrl: department.logoUrl || department.logo_url || null,
    createdAt: department.createdAt || null,
    updatedAt: department.updatedAt || null,
  }
}

export function normalizeDepartmentOptions(departments) {
  return (Array.isArray(departments) ? departments : []).map(normalizeDepartmentOption).filter(Boolean)
}

export function useDepartmentState({ accessToken, role }) {
  const [departmentOptions, setDepartmentOptions] = useState([])
  const [departmentCatalog, setDepartmentCatalog] = useState([])

  const refreshDepartmentsState = useCallback(async () => {
    if (!accessToken) {
      setDepartmentOptions([])
      setDepartmentCatalog([])
      return
    }

    const activeResponse = await departmentsApiService.getDepartments(accessToken)
    const options = normalizeDepartmentOptions(activeResponse?.departments)
    setDepartmentOptions(options.filter((department) => department.isActive))

    if (normalizeUserRole(role) !== USER_ROLES.SUPERADMIN) {
      setDepartmentCatalog([])
      return
    }

    const catalogResponse = await departmentsApiService.getDepartmentsCatalog(accessToken, { includeInactive: true })
    setDepartmentCatalog(normalizeDepartmentOptions(catalogResponse?.departments))
  }, [accessToken, role])

  useEffect(() => {
    let isActive = true

    const syncDepartments = async () => {
      if (!accessToken) {
        if (isActive) {
          setDepartmentOptions([])
          setDepartmentCatalog([])
        }
        return
      }

      try {
        const activeResponse = await departmentsApiService.getDepartments(accessToken)
        const options = normalizeDepartmentOptions(activeResponse?.departments)

        if (isActive) {
          setDepartmentOptions(options.filter((department) => department.isActive))
        }

        if (normalizeUserRole(role) !== USER_ROLES.SUPERADMIN) {
          if (isActive) {
            setDepartmentCatalog([])
          }
          return
        }

        const catalogResponse = await departmentsApiService.getDepartmentsCatalog(accessToken, { includeInactive: true })

        if (isActive) {
          setDepartmentCatalog(normalizeDepartmentOptions(catalogResponse?.departments))
        }
      } catch {
        if (isActive) {
          setDepartmentOptions([])
          setDepartmentCatalog([])
        }
      }
    }

    void syncDepartments()

    return () => {
      isActive = false
    }
  }, [accessToken, role])

  return {
    departmentOptions,
    departmentCatalog,
    refreshDepartmentsState,
    setDepartmentOptions,
    setDepartmentCatalog,
  }
}
