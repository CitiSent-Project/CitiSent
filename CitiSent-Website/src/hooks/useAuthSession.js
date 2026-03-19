import {
  buildLoginState,
  buildRegistrationState,
  resolveAuthenticatedAdmin,
  validateLoginCredentials,
} from '../controllers/authController'
import {
  buildPostLoginTransition,
  buildPostLogoutTransition,
  buildPostRegistrationTransition,
} from '../controllers/navigationController'

export function useAuthSession({
  profile,
  adminAccounts,
  setAdminAccounts,
  setProfile,
  setPreferences,
  setActivePage,
  setIsAuthenticated,
  setAuthPage,
  setRememberedEmail,
  addActivity,
  notifySuccess,
  notifyError,
}) {
  function handleRegister(payload) {
    const registrationState = buildRegistrationState({
      currentProfile: profile,
      payload,
    })

    setProfile(registrationState.nextProfile)
    setPreferences((previous) => ({
      ...previous,
      ...registrationState.nextPreferencesPatch,
    }))
    setAuthPage(buildPostRegistrationTransition().nextAuthPage)
    setRememberedEmail(registrationState.rememberedEmail)
    addActivity(registrationState.activity.action, registrationState.activity.detail)

    notifySuccess('Registration successful. You can now sign in.')
    return { ok: true, message: 'Registration complete. You can now sign in.' }
  }

  function handleLogin(payload) {
    const authenticatedAdmin = resolveAuthenticatedAdmin({ adminAccounts, payload })
    const loginValidation = validateLoginCredentials({
      profile: authenticatedAdmin || profile,
      payload,
    })

    if (!loginValidation.ok) {
      notifyError(loginValidation.title, loginValidation.message)
      return {
        ok: false,
        message: loginValidation.resultMessage,
      }
    }

    const loginState = buildLoginState({ payload, authenticatedAdmin })
    const transition = buildPostLoginTransition({ nextActivePage: loginState.nextActivePage })

    if (authenticatedAdmin) {
      const nextProfile = {
        ...authenticatedAdmin,
        lastLoginAt: loginState.loginAt,
      }

      setProfile(nextProfile)
      setPreferences((previous) => ({
        ...previous,
        displayName: nextProfile.fullName,
        department: nextProfile.department,
      }))
      setAdminAccounts((previous) =>
        previous.map((admin) =>
          admin.id === authenticatedAdmin.id
            ? {
                ...admin,
                lastLoginAt: loginState.loginAt,
              }
            : admin
        )
      )
    } else {
      setProfile((previous) => ({ ...previous, lastLoginAt: loginState.loginAt }))
    }

    setIsAuthenticated(transition.isAuthenticated)
    setActivePage(transition.nextActivePage)
    addActivity(loginState.activity.action, loginState.activity.detail)
    setRememberedEmail(loginState.rememberedEmail)

    notifySuccess('Login successful. Welcome back.')
    return { ok: true, message: 'Welcome back. Redirecting to dashboard.' }
  }

  function handleLogout() {
    const transition = buildPostLogoutTransition()
    setIsAuthenticated(transition.isAuthenticated)
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
