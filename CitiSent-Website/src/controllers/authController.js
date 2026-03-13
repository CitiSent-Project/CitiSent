import { APP_PAGES } from '../models/pageModel'

export function buildRegistrationState({ currentProfile, payload }) {
  const now = new Date().toISOString()
  const nextProfile = {
    ...currentProfile,
    ...payload,
    joinedAt: now,
    lastLoginAt: '',
  }

  const nextPreferencesPatch = {
    displayName: payload.fullName,
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

export function buildLoginState({ payload }) {
  const loginAt = new Date().toISOString()

  return {
    loginAt,
    rememberedEmail: payload.rememberMe ? payload.email : '',
    nextActivePage: APP_PAGES.DASHBOARD,
    activity: {
      action: 'Login',
      detail: `Signed in as ${payload.email}`,
    },
  }
}

export function buildProfileUpdateState({ currentPreferences, updates }) {
  const shouldSyncPreferences = Boolean(updates.fullName || updates.department)

  if (!shouldSyncPreferences) {
    return {
      nextPreferencesPatch: null,
      activity: {
        action: 'Profile update',
        detail: 'Updated admin profile information',
      },
    }
  }

  return {
    nextPreferencesPatch: {
      displayName: updates.fullName || currentPreferences.displayName,
      department: updates.department || currentPreferences.department,
    },
    activity: {
      action: 'Profile update',
      detail: 'Updated admin profile information',
    },
  }
}

export function buildPreferenceUpdateState() {
  return {
    activity: {
      action: 'Settings update',
      detail: 'Updated account preferences',
    },
  }
}
