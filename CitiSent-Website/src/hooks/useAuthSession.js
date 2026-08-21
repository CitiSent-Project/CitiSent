import { authApiService } from '../services/api/auth/authApiService'
import { mapBackendProfileToAdminProfile } from '../services/api/admin/accountsApiMappers'
import {
  buildPostLoginTransition,
  buildPostLogoutTransition,
  buildPostRegistrationTransition,
} from '../controllers/navigationController'
import { DEFAULT_ADMIN_PROFILE } from '../models/data'
import { APP_PAGES } from '../models/pageModel'
import { composeFullName } from '../models/nameModel'
import { USER_ROLES } from '../models/roleAccessModel'
import { createLoginPerformance } from '../services/loginPerformance'

function normalizeLoginIdentifier(payload = {}) {
  const candidate = String(payload.identifier || payload.email || '').trim()

  if (!candidate) {
    return ''
  }

  return candidate.includes('@') ? candidate.toLowerCase() : candidate
}

function buildRegistrationUsername(payload = {}) {
  const emailLocalPart = String(payload.email || '')
    .trim()
    .toLowerCase()
    .split('@')[0]
  const fullNameCandidate = composeFullName({
    fname: payload.fname,
    mname: payload.mname,
    lname: payload.lname,
  })
    .trim()
    .toLowerCase()
  const baseCandidate = emailLocalPart || fullNameCandidate || 'admin_user'

  const normalized = baseCandidate
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!normalized) {
    return 'admin_user'
  }

  if (normalized.length < 3) {
    return `${normalized}_admin`
  }

  return normalized.slice(0, 40)
}

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
        username: buildRegistrationUsername(payload),
        email: payload.email,
        password: payload.password,
        fname: payload.fname,
        mname: payload.mname,
        lname: payload.lname,
        phoneNumber: String(payload.phone || '').trim() || null,
        barangay: payload.barangay,
        city: payload.city,
        province: payload.province,
        role: USER_ROLES.OFFICE_ADMIN,
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
    const performance = createLoginPerformance()
    try {
      const loginIdentifier = normalizeLoginIdentifier(payload)
      performance.mark('requestStarted')
      const response = await authApiService.login({
        ...(loginIdentifier.includes('@') ? { email: loginIdentifier } : {}),
        identifier: loginIdentifier,
        password: payload.password,
      })
      const nextProfile = mapBackendProfileToAdminProfile(response?.data?.user)
      const token = response?.data?.token || ''
      performance.mark('authenticationCompleted')
      performance.mark('sessionObtained')

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
      performance.mark('navigationCompleted')
      performance.finish()
      setRememberedEmail(payload.rememberMe ? loginIdentifier : '')
      addActivity('Login', `Signed in as ${loginIdentifier}`)

      notifySuccess('Login successful. Welcome back.')
      return { ok: true, message: 'Welcome back. Redirecting to dashboard.' }
    } catch (error) {
      performance.finish()
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

  async function handleForgotPassword(payload) {
    try {
      await authApiService.forgotPassword({
        email: payload.email,
      })
      notifySuccess('Reset link sent. Please check your email inbox.')
      return { ok: true }
    } catch (error) {
      notifyError('Request failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  return {
    handleRegister,
    handleLogin,
    handleLogout,
    handleForgotPassword,
  }
}
