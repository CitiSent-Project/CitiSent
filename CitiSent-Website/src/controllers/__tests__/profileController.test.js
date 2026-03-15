import { describe, expect, it } from 'vitest'
import {
  buildPreferenceUpdateState,
  buildProfileUpdateState,
} from '../profileController'

describe('profileController', () => {
  it('returns null preference patch when no synced fields are updated', () => {
    const result = buildProfileUpdateState({
      currentPreferences: { displayName: 'Admin', department: 'Ops' },
      updates: { phone: '123456' },
    })

    expect(result.nextPreferencesPatch).toBeNull()
    expect(result.activity.action).toBe('Profile update')
  })

  it('builds synced preference patch when fullName or department changes', () => {
    const result = buildProfileUpdateState({
      currentPreferences: { displayName: 'Admin', department: 'Ops' },
      updates: { fullName: 'New Name', department: 'Safety' },
    })

    expect(result.nextPreferencesPatch).toEqual({
      displayName: 'New Name',
      department: 'Safety',
    })
  })

  it('builds preference update activity payload', () => {
    expect(buildPreferenceUpdateState()).toEqual({
      activity: {
        action: 'Settings update',
        detail: 'Updated account preferences',
      },
    })
  })
})
