import { APP_PAGES } from '../../models/pageModel'
import { composeFullName } from '../../models/nameModel'

export function buildRegistrationState({ currentProfile, payload }) {
  const now = new Date().toISOString()
  const displayName = composeFullName({
    fname: payload.fname,
    mname: payload.mname,
    lname: payload.lname,
  })
  const nextProfile = {
    ...currentProfile,
    ...payload,
    fullName: displayName,
    joinedAt: now,
    lastLoginAt: '',
  }

  const nextPreferencesPatch = {
    displayName: displayName,
    department: payload.department,
  }

  return {
    nextProfile,
    nextPreferencesPatch,
    rememberedEmail: payload.email,
    activity: {
      action: 'Registration',
      detail: `Admin account created for ${payload.email}`,
    },
  }
}

export function validateLoginCredentials({ profile, payload }) {
  const isValid = payload.email === profile.email && payload.password === profile.password

  if (isValid) {
    return { ok: true }
  }

  return {
    ok: false,
    title: 'Login failed.',
    message:
      'Use the registered admin email and password. Check for typing errors and try again.',
    resultMessage: 'Invalid credentials. Use the registered admin email and password.',
  }
}

export function resolveAuthenticatedAdmin({ adminAccounts = [], payload }) {
  const normalizedEmail = String(payload?.email || '').trim().toLowerCase()
  const password = String(payload?.password || '')

  return (
    adminAccounts.find(
      (admin) => admin.email.toLowerCase() === normalizedEmail && admin.password === password
    ) || null
  )
}

export function buildLoginState({ payload, authenticatedAdmin }) {
  const loginAt = new Date().toISOString()

  return {
    loginAt,
    rememberedEmail: payload.rememberMe ? payload.email : '',
    nextActivePage: APP_PAGES.DASHBOARD,
    authenticatedAdmin,
    activity: {
      action: 'Login',
      detail: `Signed in as ${payload.email}`,
    },
  }
}
