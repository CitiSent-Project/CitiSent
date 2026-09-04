import { useEffect } from 'react'
import { authApiService } from '../services/api/auth/authApiService'
import {
  buildPreferenceUpdateState,
  buildProfileUpdateState,
} from '../controllers/auth/profileController'
import { buildAppearanceState } from '../controllers/shared/appearanceController'
import { mapBackendProfileToAdminProfile } from '../services/api/admin/accountsApiMappers'

/**
 * Helper to find a department by ID or label
 */
function findDepartmentOption(value, departmentOptions) {
  return (
    departmentOptions.find(
      (department) => department.id === value || department.label === value
    ) || null
  )
}

/**
 * Custom hook to manage profile and preference update logic,
 * as well as side-effects for applying themes (appearance).
 */
export function useProfileAndPreferencesState({
  accessToken,
  isAuthenticated,
  preferences,
  departmentOptions,
  setProfile,
  setAdminAccounts,
  setPreferences,
  addActivity,
  notifySuccess,
  notifyError,
}) {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function applyAppearance(systemPrefersDark) {
      const appearanceState = buildAppearanceState({
        themePreference: isAuthenticated ? preferences.theme : 'Light',
        fontSizePreference: preferences.fontSize,
        animationsEnabled: preferences.animationsEnabled,
        systemPrefersDark,
      })

      const root = document.documentElement
      root.dataset.theme = appearanceState.effectiveTheme
      root.style.fontSize = `${appearanceState.rootFontSizePx}px`
      root.classList.toggle('reduced-motion', !appearanceState.animationsEnabled)
    }

    applyAppearance(mediaQuery.matches)

    if (preferences.theme !== 'System' || !isAuthenticated) {
      return undefined
    }

    function handleSystemThemeChange(event) {
      applyAppearance(event.matches)
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [
    isAuthenticated,
    preferences.theme,
    preferences.fontSize,
    preferences.animationsEnabled,
  ])

  async function handleProfileUpdate(updates) {
    if (!accessToken) {
      const message = 'Your session has expired. Please sign in again.'
      notifyError('Profile update failed.', message)
      return { ok: false, message }
    }

    const profileUpdateState = buildProfileUpdateState({
      currentPreferences: preferences,
      updates,
    })
    const selectedDepartment = findDepartmentOption(
      updates.department || updates.departmentId,
      departmentOptions
    )

    try {
      const response = await authApiService.updateCurrentUser(accessToken, {
        ...(updates.fname !== undefined ? { fname: updates.fname } : {}),
        ...(updates.mname !== undefined ? { mname: updates.mname } : {}),
        ...(updates.lname !== undefined ? { lname: updates.lname } : {}),
        ...(updates.username !== undefined ? { username: updates.username } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.phone !== undefined ? { phoneNumber: updates.phone } : {}),
        ...(updates.barangay !== undefined ? { barangay: updates.barangay } : {}),
        ...(updates.city !== undefined ? { city: updates.city } : {}),
        ...(updates.province !== undefined ? { province: updates.province } : {}),
        ...(selectedDepartment
          ? {
              departmentId: selectedDepartment.id,
              departmentLabel: selectedDepartment.label,
            }
          : {}),
      })

      const nextProfile = mapBackendProfileToAdminProfile(response?.data)

      setProfile(nextProfile)
      setAdminAccounts((previous) =>
        previous.map((admin) => (admin.id === nextProfile.id ? { ...admin, ...nextProfile } : admin))
      )

      if (profileUpdateState.nextPreferencesPatch) {
        setPreferences((previous) => ({
          ...previous,
          ...profileUpdateState.nextPreferencesPatch,
        }))
      }

      addActivity(profileUpdateState.activity.action, profileUpdateState.activity.detail)
      notifySuccess('Profile updated successfully.')
      return { ok: true, profile: nextProfile }
    } catch (error) {
      notifyError('Profile update failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  function handlePreferenceUpdate(updates) {
    const preferenceUpdateState = buildPreferenceUpdateState()
    setPreferences((previous) => ({ ...previous, ...updates }))
    addActivity(preferenceUpdateState.activity.action, preferenceUpdateState.activity.detail)
    notifySuccess('Settings updated successfully.')
  }

  return {
    handleProfileUpdate,
    handlePreferenceUpdate,
  }
}
