import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthSession } from '../useAuthSession'
import { authApiService } from '../../services/api/auth/authApiService'

vi.mock('../../services/api/auth/authApiService', () => ({
  authApiService: {
    register: vi.fn(),
    login: vi.fn(),
  },
}))

describe('useAuthSession', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  function buildDependencies() {
    return {
      setAccessToken: vi.fn(),
      setProfile: vi.fn(),
      setAdminAccounts: vi.fn(),
      setTransferRequests: vi.fn(),
      setSelectedReport: vi.fn(),
      setSelectedUserProfile: vi.fn(),
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

  it('handles successful registration flow', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T12:00:00.000Z'))
    authApiService.register.mockResolvedValue({
      data: {
        token: 'token-123',
        user: {
          id: 'admin-1',
          email: 'admin@citisent.gov',
          fullName: 'Admin Name',
          role: 'Office Admin',
          accountType: 'admin',
          departmentId: 'cto',
          departmentLabel: 'City Treasury Office',
        },
      },
    })

    const deps = buildDependencies()
    const { handleRegister } = useAuthSession(deps)

    const result = await handleRegister({
      fullName: 'Admin Name',
      email: 'admin@citisent.gov',
      departmentId: 'cto',
      departmentLabel: 'City Treasury Office',
      role: 'Office Admin',
      phone: '+63 900 000 0000',
      address: 'City Hall',
      password: 'supersecret',
    })

    expect(result.ok).toBe(true)
    expect(deps.setAuthPage).toHaveBeenCalledTimes(1)
    expect(deps.setRememberedEmail).toHaveBeenCalledWith('admin@citisent.gov')
    expect(deps.addActivity).toHaveBeenCalledWith(
      'Registration',
      'Admin account created for admin@citisent.gov'
    )
    expect(deps.notifySuccess).toHaveBeenCalledWith('Registration successful. You can now sign in.')
  })

  it('handles failed login with validation message', async () => {
    authApiService.login.mockRejectedValue(new Error('Invalid credentials'))
    const deps = buildDependencies()
    const { handleLogin } = useAuthSession(deps)

    const result = await handleLogin({ identifier: 'cityadmin', password: 'secret' })

    expect(result.ok).toBe(false)
    expect(authApiService.login).toHaveBeenCalledWith({
      identifier: 'cityadmin',
      password: 'secret',
    })
    expect(deps.notifyError).toHaveBeenCalledWith(
      'Login failed.',
      'Invalid credentials'
    )
    expect(deps.setIsAuthenticated).not.toHaveBeenCalled()
  })

  it('handles successful login and logout transitions', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T13:00:00.000Z'))
    authApiService.login.mockResolvedValue({
      data: {
        token: 'token-abc',
        user: {
          id: 'admin-1',
          email: 'admin@citisent.gov',
          fullName: 'Admin Name',
          role: 'Office Admin',
          accountType: 'admin',
          departmentId: 'cto',
          departmentLabel: 'City Treasury Office',
        },
      },
    })

    const deps = buildDependencies()
    const { handleLogin, handleLogout } = useAuthSession(deps)

    const loginResult = await handleLogin({
      identifier: 'Admin@citisent.gov',
      password: 'secret',
      rememberMe: true,
    })

    expect(loginResult.ok).toBe(true)
    expect(authApiService.login).toHaveBeenCalledWith({
      email: 'admin@citisent.gov',
      identifier: 'admin@citisent.gov',
      password: 'secret',
    })
    expect(deps.setAccessToken).toHaveBeenCalledWith('token-abc')
    expect(deps.setProfile).toHaveBeenCalledTimes(1)
    expect(deps.setIsAuthenticated).toHaveBeenCalledWith(true)
    expect(deps.setActivePage).toHaveBeenCalledTimes(1)
    expect(deps.setRememberedEmail).toHaveBeenCalledWith('admin@citisent.gov')
    expect(deps.addActivity).toHaveBeenCalledWith('Login', 'Signed in as admin@citisent.gov')

    handleLogout()

    expect(deps.setAccessToken).toHaveBeenLastCalledWith('')
    expect(deps.setIsAuthenticated).toHaveBeenCalledWith(false)
    expect(deps.setAuthPage).toHaveBeenCalledTimes(1)
    expect(deps.addActivity).toHaveBeenCalledWith('Logout', 'Signed out from admin workspace')
    expect(deps.notifySuccess).toHaveBeenCalledWith('Logout successful.')
  })
})
