import {
  buildLoginState,
  buildRegistrationState,
  validateLoginCredentials,
} from '../controllers/authController'
import {
  buildPostLoginTransition,
  buildPostLogoutTransition,
  buildPostRegistrationTransition,
} from '../controllers/navigationController'

export function useAuthSession({
  profile,
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
    const loginValidation = validateLoginCredentials({ profile, payload })

    if (!loginValidation.ok) {
      notifyError(loginValidation.title, loginValidation.message)
      return {
        ok: false,
        message: loginValidation.resultMessage,
      }
    }

    const loginState = buildLoginState({ payload })
    const transition = buildPostLoginTransition({ nextActivePage: loginState.nextActivePage })

    setProfile((previous) => ({ ...previous, lastLoginAt: loginState.loginAt }))
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
