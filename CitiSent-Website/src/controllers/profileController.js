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
