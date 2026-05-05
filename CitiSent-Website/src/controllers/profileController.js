import { normalizeUserRole, USER_ROLES } from '../models/roleAccessModel'
import { composeFullName } from '../models/nameModel'

export function buildProfileUpdateState({ currentPreferences, updates }) {
  const nextDisplayName = composeFullName({
    fname: updates.fname,
    mname: updates.mname,
    lname: updates.lname,
  })
  const shouldSyncPreferences = Boolean(nextDisplayName || updates.department)

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
      displayName: nextDisplayName || currentPreferences.displayName,
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

export function buildProfileSubmissionState({
  profile,
  draft,
  transferReason,
  departmentCatalog = [],
  hasPendingTransferRequest = false,
}) {
  const normalizedFname = String(draft.fname || '').trim()
  const normalizedMname = String(draft.mname || '').trim()
  const normalizedLname = String(draft.lname || '').trim()
  const normalizedRole = normalizeUserRole(profile?.role)
  const didDepartmentChange = draft.department !== profile.department

  if (normalizedRole === USER_ROLES.SUPERADMIN) {
    return {
      ok: true,
      shouldUpdateProfile: true,
      profileUpdates: {
        fname: normalizedFname,
        mname: normalizedMname || null,
        lname: normalizedLname,
        username: draft.username,
        email: draft.email,
        phone: draft.phone,
        address: draft.address,
      },
      transferRequestPayload: null,
    }
  }

  const profileUpdates = {
    fname: normalizedFname,
    mname: normalizedMname || null,
    lname: normalizedLname,
    email: draft.email,
    phone: draft.phone,
    address: draft.address,
  }

  if (!didDepartmentChange) {
    return {
      ok: true,
      shouldUpdateProfile: true,
      profileUpdates: {
        ...profileUpdates,
        department: draft.department,
      },
      transferRequestPayload: null,
    }
  }

  if (hasPendingTransferRequest) {
    return {
      ok: false,
      message: 'You already have a pending department transfer request. Please wait for superadmin review.',
    }
  }

  const trimmedReason = String(transferReason || '').trim()
  if (!trimmedReason) {
    return {
      ok: false,
      message: 'Please provide a reason for your department transfer request.',
    }
  }

  const requestedDepartment = departmentCatalog.find(
    (department) => department.label === draft.department
  )
  if (!requestedDepartment) {
    return {
      ok: false,
      message: 'Select a valid department from the available list.',
    }
  }

  return {
    ok: true,
    shouldUpdateProfile: true,
    profileUpdates,
    transferRequestPayload: {
      requestedDepartmentId: requestedDepartment.id,
      requestedDepartmentLabel: requestedDepartment.label,
      reason: trimmedReason,
    },
  }
}
