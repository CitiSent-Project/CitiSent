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

  it('builds synced preference patch when name or department changes', () => {
    const result = buildProfileUpdateState({
      currentPreferences: { displayName: 'Admin', department: 'Ops' },
      updates: { fname: 'New', mname: '', lname: 'Name', department: 'Safety' },
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
        fname: 'BPLO',
        mname: '',
        lname: 'Admin',
        department: 'City Treasury Office',
        phone: '0900',
        barangay: 'San Isidro Norte',
        city: 'Sto. Tomas',
        province: 'Batangas',
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
        fname: 'BPLO',
        mname: '',
        lname: 'Admin',
        email: 'bplo.admin@citisent.gov',
        department: 'City Treasury Office',
        phone: '0900',
        barangay: 'San Isidro Norte',
        city: 'Sto. Tomas',
        province: 'Batangas',
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
      fname: 'BPLO',
      mname: null,
      lname: 'Admin',
      email: 'bplo.admin@citisent.gov',
      phone: '0900',
      barangay: 'San Isidro Norte',
      city: 'Sto. Tomas',
      province: 'Batangas',
    })
    expect(result.transferRequestPayload).toEqual({
      requestedDepartmentId: 'cto',
      requestedDepartmentLabel: 'City Treasury Office',
      reason: 'Departmental workload balancing.',
    })
  })

  it('keeps office admin email editable when the department is unchanged', () => {
    const result = buildProfileSubmissionState({
      profile: {
        role: USER_ROLES.OFFICE_ADMIN,
        department: 'Business Permits and Licensing Office (BPLO)',
      },
      draft: {
        fname: 'BPLO',
        mname: '',
        lname: 'Admin',
        email: 'updated.bplo.admin@citisent.gov',
        department: 'Business Permits and Licensing Office (BPLO)',
        phone: '0900',
        barangay: 'San Isidro Norte',
        city: 'Sto. Tomas',
        province: 'Batangas',
      },
      transferReason: '',
      departmentCatalog: [
        { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
        { id: 'cto', label: 'City Treasury Office' },
      ],
      hasPendingTransferRequest: false,
    })

    expect(result.ok).toBe(true)
    expect(result.profileUpdates).toEqual({
      fname: 'BPLO',
      mname: null,
      lname: 'Admin',
      email: 'updated.bplo.admin@citisent.gov',
      phone: '0900',
      barangay: 'San Isidro Norte',
      city: 'Sto. Tomas',
      province: 'Batangas',
      department: 'Business Permits and Licensing Office (BPLO)',
    })
    expect(result.transferRequestPayload).toBeNull()
  })

  it('lets superadmins update account identity fields without department changes', () => {
    const result = buildProfileSubmissionState({
      profile: {
        role: USER_ROLES.SUPERADMIN,
        department: 'All Departments',
      },
      draft: {
        fname: 'City',
        mname: '',
        lname: 'Superadmin',
        username: 'city_superadmin',
        email: 'superadmin@citisent.gov',
        department: 'All Departments',
        phone: '+639000000000',
        barangay: 'San Isidro Norte',
        city: 'Sto. Tomas',
        province: 'Batangas',
      },
      transferReason: '',
      departmentCatalog: [],
      hasPendingTransferRequest: false,
    })

    expect(result.ok).toBe(true)
    expect(result.profileUpdates).toEqual({
      fname: 'City',
      mname: null,
      lname: 'Superadmin',
      username: 'city_superadmin',
      email: 'superadmin@citisent.gov',
      phone: '+639000000000',
      barangay: 'San Isidro Norte',
      city: 'Sto. Tomas',
      province: 'Batangas',
    })
    expect(result.transferRequestPayload).toBeNull()
  })
})
