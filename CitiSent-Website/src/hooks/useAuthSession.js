import { authApiService } from '../services/authApiService'
import { mapBackendProfileToAdminProfile } from '../services/adminApiMappers'
import {
  buildPostLoginTransition,
  buildPostLogoutTransition,
  buildPostRegistrationTransition,
} from '../controllers/navigationController'
import { DEFAULT_ADMIN_PROFILE } from '../models/data'
import { APP_PAGES } from '../models/pageModel'

export function useAuthSession({
  setAccessToken,
  setProfile,
  setAdminAccounts,
  setTransferRequests,
  setSelectedReport,
  setSelectedUserProfile,
  setPreferences,
  setActivePage,
  setIsAuthenticated,
  setAuthPage,
  setRememberedEmail,
  addActivity,
  notifySuccess,
  notifyError,
}) {
  async function handleRegister(payload) {
    try {
      await authApiService.register({
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName,
        phoneNumber: payload.phone,
        address: payload.address,
        role: payload.role,
        departmentId: payload.departmentId,
        departmentLabel: payload.departmentLabel,
        accountType: 'admin',
      })

      setAuthPage(buildPostRegistrationTransition().nextAuthPage)
      setRememberedEmail(payload.email)
      addActivity('Registration', `Admin account created for ${payload.email}`)
      notifySuccess('Registration successful. You can now sign in.')
      return { ok: true, message: 'Registration complete. You can now sign in.' }
    } catch (error) {
      notifyError('Registration failed.', error.message)
      return {
        ok: false,
        message: error.message || 'Unable to create the admin account.',
      }
    }
  }

  async function handleLogin(payload) {
    try {
      const response = await authApiService.login({
        email: payload.email,
        identifier: payload.email,
        password: payload.password,
      })
      const nextProfile = mapBackendProfileToAdminProfile(response?.data?.user)
      const token = response?.data?.token || ''

      if (!token) {
        throw new Error('Login succeeded but no session token was returned.')
      }

      if (nextProfile.accountType !== 'admin' || !nextProfile.role) {
        throw new Error('This account does not have admin workspace access.')
      }

      const transition = buildPostLoginTransition({ nextActivePage: APP_PAGES.DASHBOARD })

      setAccessToken(token)
      setProfile(nextProfile)
      setPreferences((previous) => ({
        ...previous,
        displayName: nextProfile.fullName || previous.displayName,
        department: nextProfile.department || previous.department,
      }))
      setIsAuthenticated(transition.isAuthenticated)
      setActivePage(transition.nextActivePage)
      setRememberedEmail(payload.rememberMe ? payload.email : '')
      addActivity('Login', `Signed in as ${payload.email}`)

      notifySuccess('Login successful. Welcome back.')
      return { ok: true, message: 'Welcome back. Redirecting to dashboard.' }
    } catch (error) {
      notifyError('Login failed.', error.message)
      return {
        ok: false,
        message: error.message || 'Unable to sign in with this account.',
      }
    }
  }

  function handleLogout() {
    const transition = buildPostLogoutTransition()

    setAccessToken('')
    setProfile(DEFAULT_ADMIN_PROFILE)
    setAdminAccounts([])
    setTransferRequests([])
    setSelectedReport(null)
    setSelectedUserProfile(null)
    setIsAuthenticated(transition.isAuthenticated)
    setActivePage(APP_PAGES.DASHBOARD)
    setAuthPage(transition.nextAuthPage)
    addActivity('Logout', 'Signed out from admin workspace')
    notifySuccess('Logout successful.')
  }

  return {
    handleRegister,
    handleLogin,
    handleLogout,
  }
}
