import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildLoginState,
  buildRegistrationState,
  resolveAuthenticatedAdmin,
  validateLoginCredentials,
} from '../authController'
import { APP_PAGES } from '../../models/pageModel'

describe('authController', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds registration state with profile merge and preference patch', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T10:00:00.000Z'))

    const currentProfile = { fullName: 'Old Name', role: 'Administrator' }
    const payload = {
      fname: 'New',
      mname: '',
      lname: 'Admin',
      email: 'admin@citisent.gov',
      department: 'Operations',
    }

    const result = buildRegistrationState({ currentProfile, payload })

    expect(result.nextProfile).toEqual({
      fname: 'New',
      mname: '',
      lname: 'Admin',
      fullName: 'New Admin',
      role: 'Administrator',
      email: 'admin@citisent.gov',
      department: 'Operations',
      joinedAt: '2026-03-14T10:00:00.000Z',
      lastLoginAt: '',
    })
    expect(result.nextPreferencesPatch).toEqual({
      displayName: 'New Admin',
      department: 'Operations',
    })
    expect(result.rememberedEmail).toBe('admin@citisent.gov')
    expect(result.activity).toEqual({
      action: 'Registration',
      detail: 'Admin account created for admin@citisent.gov',
    })
  })

  it('validates login credentials correctly', () => {
    const profile = { email: 'admin@citisent.gov', password: 'secret' }

    expect(
      validateLoginCredentials({
        profile,
        payload: { email: 'admin@citisent.gov', password: 'secret' },
      })
    ).toEqual({ ok: true })

    expect(
      validateLoginCredentials({
        profile,
        payload: { email: 'wrong@citisent.gov', password: 'secret' },
      })
    ).toMatchObject({ ok: false, title: 'Login failed.' })
  })

  it('builds login state and applies remember me behavior', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T11:20:00.000Z'))

    const rememberState = buildLoginState({
      payload: { email: 'admin@citisent.gov', rememberMe: true },
      authenticatedAdmin: { id: 'admin-1' },
    })

    expect(rememberState).toEqual({
      loginAt: '2026-03-14T11:20:00.000Z',
      rememberedEmail: 'admin@citisent.gov',
      nextActivePage: APP_PAGES.DASHBOARD,
      authenticatedAdmin: { id: 'admin-1' },
      activity: {
        action: 'Login',
        detail: 'Signed in as admin@citisent.gov',
      },
    })

    const noRememberState = buildLoginState({
      payload: { email: 'admin@citisent.gov', rememberMe: false },
    })
    expect(noRememberState.rememberedEmail).toBe('')
  })

  it('resolves an authenticated admin by email and password', () => {
    const admins = [
      { id: 'a-1', email: 'superadmin@citisent.gov', password: 'superadmin123' },
      { id: 'a-2', email: 'office@citisent.gov', password: 'office123' },
    ]

    expect(
      resolveAuthenticatedAdmin({
        adminAccounts: admins,
        payload: { email: 'OFFICE@citisent.gov', password: 'office123' },
      })
    ).toEqual(admins[1])

    expect(
      resolveAuthenticatedAdmin({
        adminAccounts: admins,
        payload: { email: 'OFFICE@citisent.gov', password: 'wrong' },
      })
    ).toBeNull()
  })
})
