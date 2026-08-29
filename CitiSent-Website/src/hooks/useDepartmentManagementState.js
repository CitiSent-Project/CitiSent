import { canReviewTransferRequest } from '../models/roleAccessModel'
import { departmentsApiService } from '../services/api/admin/departmentsApiService'
import { normalizeDepartmentOption } from './useDepartmentState'

/**
 * Builds the delete options for deleting a department.
 * @param {Object} params 
 * @returns {Object|undefined}
 */
function buildDeleteDepartmentOptions({ cleanup, reassignTo } = {}) {
  const options = {}

  if (cleanup === true) {
    options.cleanup = true
  }

  if (reassignTo) {
    options.reassignTo = reassignTo
  }

  return Object.keys(options).length > 0 ? options : undefined
}

/**
 * Custom hook to manage department CRUD operations.
 * Extracts department creation, updating, and deletion logic from the main orchestrator.
 */
export function useDepartmentManagementState({
  accessToken,
  profile,
  refreshDepartmentsState,
  addActivity,
  notifySuccess,
  notifyError,
}) {
  async function handleCreateDepartment({ slug, name, description }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Creation denied.', 'Only superadmins can add departments.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Creation denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.createDepartment(accessToken, {
        slug,
        name,
        description,
      })
      const createdDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department created',
        `${createdDepartment?.label || name} added to department catalog`
      )
      notifySuccess('Department added successfully.')
      return { ok: true, department: createdDepartment }
    } catch (error) {
      notifyError('Creation denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleUpdateDepartment({ departmentSlug, name, slug, description }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Update denied.', 'Only superadmins can update departments.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Update denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.updateDepartment(
        accessToken,
        departmentSlug,
        {
          ...(name !== undefined ? { name } : {}),
          ...(slug !== undefined ? { slug } : {}),
          ...(description !== undefined ? { description } : {}),
        }
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department updated',
        `${updatedDepartment?.label || departmentSlug} details updated`
      )
      notifySuccess('Department updated successfully.')
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Update denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleSetDepartmentActive({ departmentSlug, isActive }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Status update denied.', 'Only superadmins can manage department status.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Status update denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.setDepartmentActive(
        accessToken,
        departmentSlug,
        isActive
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        isActive ? 'Department activated' : 'Department deactivated',
        `${updatedDepartment?.label || departmentSlug} status set to ${
          isActive ? 'active' : 'inactive'
        }`
      )
      notifySuccess(
        `Department ${isActive ? 'activated' : 'deactivated'} successfully.`
      )
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Status update denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleUpdateDepartmentLogo({ departmentSlug, departmentLabel, file }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Logo update denied.', 'Only superadmins can manage department logos.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Logo update denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.updateDepartmentLogo(
        accessToken,
        departmentSlug,
        file
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department logo updated',
        `${updatedDepartment?.label || departmentLabel || departmentSlug} logo updated`
      )
      notifySuccess('Department logo updated successfully.')
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Logo update denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleDeleteDepartmentLogo({ departmentSlug, departmentLabel }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Logo delete denied.', 'Only superadmins can manage department logos.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Logo delete denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.deleteDepartmentLogo(
        accessToken,
        departmentSlug
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department logo removed',
        `${updatedDepartment?.label || departmentLabel || departmentSlug} logo removed`
      )
      notifySuccess('Department logo removed successfully.')
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Logo delete denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleDeleteDepartment({
    departmentSlug,
    departmentLabel,
    cleanup,
    reassignTo,
  }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Delete denied.', 'Only superadmins can delete departments.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Delete denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const deleteOptions = buildDeleteDepartmentOptions({
        cleanup,
        reassignTo,
      })

      const response = await departmentsApiService.deleteDepartment(
        accessToken,
        departmentSlug,
        deleteOptions
      )
      const deletedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department deleted',
        `${deletedDepartment?.label || departmentLabel || departmentSlug} removed from department catalog`
      )
      notifySuccess('Department deleted successfully.')
      return { ok: true, department: deletedDepartment }
    } catch (error) {
      notifyError('Delete denied.', error.message)
      return {
        ok: false,
        message: error.message,
        details: error?.details || null,
        status: error?.status || null,
      }
    }
  }

  return {
    handleCreateDepartment,
    handleUpdateDepartment,
    handleSetDepartmentActive,
    handleUpdateDepartmentLogo,
    handleDeleteDepartmentLogo,
    handleDeleteDepartment,
  }
}
