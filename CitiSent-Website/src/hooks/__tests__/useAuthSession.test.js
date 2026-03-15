import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthSession } from '../useAuthSession'

describe('useAuthSession', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function buildDependencies() {
    return {
      profile: { email: 'admin@citisent.gov', password: 'secret' },
      setProfile: vi.fn(),
      setPreferences: vi.fn(),
      setActivePage: vi.fn(),
      setIsAuthenticated: vi.fn(),
      setAuthPage: vi.fn(),
      setRememberedEmail: vi.fn(),
      addActivity: vi.fn(),
      notifySuccess: vi.fn(),
      notifyError: vi.fn(),
    }
  }

  it('handles successful registration flow', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T12:00:00.000Z'))

    const deps = buildDependencies()
    const { handleRegister } = useAuthSession(deps)

    const result = handleRegister({
      fullName: 'Admin Name',
      email: 'admin@citisent.gov',
      department: 'Operations',
    })

    expect(result.ok).toBe(true)
    expect(deps.setProfile).toHaveBeenCalledTimes(1)
    expect(deps.setPreferences).toHaveBeenCalledTimes(1)
    expect(deps.setAuthPage).toHaveBeenCalledTimes(1)
    expect(deps.addActivity).toHaveBeenCalledWith(
      'Registration',
      'Admin account created for admin@citisent.gov'
    )
    expect(deps.notifySuccess).toHaveBeenCalledWith('Registration successful. You can now sign in.')
  })

  it('handles failed login with validation message', () => {
    const deps = buildDependencies()
    const { handleLogin } = useAuthSession(deps)

    const result = handleLogin({ email: 'wrong@citisent.gov', password: 'secret' })

    expect(result.ok).toBe(false)
    expect(deps.notifyError).toHaveBeenCalledWith(
      'Login failed.',
      'Use the registered admin email and password. Check for typing errors and try again.'
    )
    expect(deps.setIsAuthenticated).not.toHaveBeenCalled()
  })

  it('handles successful login and logout transitions', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T13:00:00.000Z'))

    const deps = buildDependencies()
    const { handleLogin, handleLogout } = useAuthSession(deps)

    const loginResult = handleLogin({
      email: 'admin@citisent.gov',
      password: 'secret',
      rememberMe: true,
    })

    expect(loginResult.ok).toBe(true)
    expect(deps.setProfile).toHaveBeenCalledTimes(1)
    expect(deps.setIsAuthenticated).toHaveBeenCalledWith(true)
    expect(deps.setActivePage).toHaveBeenCalledTimes(1)
    expect(deps.setRememberedEmail).toHaveBeenCalledWith('admin@citisent.gov')
    expect(deps.addActivity).toHaveBeenCalledWith('Login', 'Signed in as admin@citisent.gov')

    handleLogout()

    expect(deps.setIsAuthenticated).toHaveBeenCalledWith(false)
    expect(deps.setAuthPage).toHaveBeenCalledTimes(1)
    expect(deps.addActivity).toHaveBeenCalledWith('Logout', 'Signed out from admin workspace')
    expect(deps.notifySuccess).toHaveBeenCalledWith('Logout successful.')
  })
})
