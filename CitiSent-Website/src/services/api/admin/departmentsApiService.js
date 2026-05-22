import { apiClient } from '../core/apiClient'

function buildDepartmentsQuery({ includeInactive = false } = {}) {
  const params = new URLSearchParams()

  if (includeInactive) {
    params.set('includeInactive', 'true')
  }

  return params.toString() ? `?${params.toString()}` : ''
}

function buildDeleteDepartmentQuery({ cleanup = false, reassignTo } = {}) {
  const params = new URLSearchParams()

  if (cleanup) {
    params.set('cleanup', 'true')
  }

  if (reassignTo) {
    params.set('reassignTo', reassignTo)
  }

  return params.toString() ? `?${params.toString()}` : ''
}

export const departmentsApiService = {
  getDepartments: (token, options = {}) =>
    apiClient.get(`/departments${buildDepartmentsQuery(options)}`, { token }),
  getDepartmentsCatalog: (token, options = {}) =>
    apiClient.get(`/departments/catalog${buildDepartmentsQuery(options)}`, { token }),
  createDepartment: (token, payload) =>
    apiClient.post('/departments', payload, {
      token,
    }),
  updateDepartment: (token, departmentSlug, payload) =>
    apiClient.patch(`/departments/${departmentSlug}`, payload, {
      token,
    }),
  setDepartmentActive: (token, departmentSlug, isActive) =>
    apiClient.patch(
      `/departments/${departmentSlug}/active`,
      {
        isActive,
      },
      {
        token,
      }
    ),
  updateDepartmentLogo: (token, departmentSlug, file) => {
    const formData = new FormData()
    formData.append('logo', file)

    return apiClient.patch(`/departments/${departmentSlug}/logo`, formData, {
      token,
    })
  },
  deleteDepartmentLogo: (token, departmentSlug) =>
    apiClient.delete(`/departments/${departmentSlug}/logo`, {
      token,
    }),
  deleteDepartment: (token, departmentSlug, options = {}) =>
    apiClient.delete(`/departments/${departmentSlug}${buildDeleteDepartmentQuery(options)}`, {
      token,
    }),
}
