import { describe, expect, it } from 'vitest'
import {
  buildProfileSubmissionState,
  buildPreferenceUpdateState,
  buildProfileUpdateState,
} from '../profileController'
import { USER_ROLES } from '../../models/roleAccessModel'

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

  it('requires transfer reason when office admin changes department', () => {
    const result = buildProfileSubmissionState({
      profile: {
        role: USER_ROLES.OFFICE_ADMIN,
        department: 'Business Permits and Licensing Office (BPLO)',
      },
      draft: {
        fullName: 'BPLO Admin',
        department: 'City Treasury Office',
        phone: '0900',
        address: 'City Hall',
      },
      transferReason: '',
      departmentCatalog: [
        { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
        { id: 'cto', label: 'City Treasury Office' },
      ],
      hasPendingTransferRequest: false,
    })

    expect(result.ok).toBe(false)
  })

  it('builds transfer request payload for office admin department change', () => {
    const result = buildProfileSubmissionState({
      profile: {
        role: USER_ROLES.OFFICE_ADMIN,
        department: 'Business Permits and Licensing Office (BPLO)',
      },
      draft: {
        fullName: 'BPLO Admin',
        department: 'City Treasury Office',
        phone: '0900',
        address: 'City Hall',
      },
      transferReason: 'Departmental workload balancing.',
      departmentCatalog: [
        { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
        { id: 'cto', label: 'City Treasury Office' },
      ],
      hasPendingTransferRequest: false,
    })

    expect(result.ok).toBe(true)
    expect(result.profileUpdates).toEqual({
      fullName: 'BPLO Admin',
      phone: '0900',
      address: 'City Hall',
    })
    expect(result.transferRequestPayload).toEqual({
      requestedDepartmentId: 'cto',
      requestedDepartmentLabel: 'City Treasury Office',
      reason: 'Departmental workload balancing.',
    })
  })
})
