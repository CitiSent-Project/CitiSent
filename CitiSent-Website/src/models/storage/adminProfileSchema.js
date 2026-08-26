import { DEFAULT_ADMIN_ACCOUNTS, DEFAULT_ADMIN_PROFILE } from '../data'
import { composeFullName, splitFullName } from '../nameModel'
import { asArray, asString, isObject } from './valueNormalizers'

export function normalizeAdminProfile(profile) {
  const source = isObject(profile) ? profile : {}
  const derivedParts = splitFullName(source.fullName)
  const fname = asString(source.fname, derivedParts.fname || DEFAULT_ADMIN_PROFILE.fname)
  const mname = asString(source.mname, derivedParts.mname || DEFAULT_ADMIN_PROFILE.mname)
  const lname = asString(source.lname, derivedParts.lname || DEFAULT_ADMIN_PROFILE.lname)
  const derivedFullName = composeFullName({ fname, mname, lname })

  return {
    ...DEFAULT_ADMIN_PROFILE,
    ...source,
    id: asString(source.id, DEFAULT_ADMIN_PROFILE.id),
    fname,
    mname,
    lname,
    fullName: derivedFullName || asString(source.fullName, DEFAULT_ADMIN_PROFILE.fullName),
    email: asString(source.email, DEFAULT_ADMIN_PROFILE.email),
    departmentId: asString(source.departmentId, DEFAULT_ADMIN_PROFILE.departmentId),
    department: asString(source.department, DEFAULT_ADMIN_PROFILE.department),
    role: asString(source.role, DEFAULT_ADMIN_PROFILE.role),
    phone: asString(source.phone, DEFAULT_ADMIN_PROFILE.phone),
    barangay: asString(source.barangay, DEFAULT_ADMIN_PROFILE.barangay),
    city: asString(source.city, DEFAULT_ADMIN_PROFILE.city),
    province: asString(source.province, DEFAULT_ADMIN_PROFILE.province),
    accountType: asString(source.accountType, DEFAULT_ADMIN_PROFILE.accountType),
    joinedAt: asString(source.joinedAt, DEFAULT_ADMIN_PROFILE.joinedAt),
    lastLoginAt: asString(source.lastLoginAt, ''),
  }
}

export function normalizeAdminAccounts(accounts) {
  const normalized = asArray(accounts, []).map(normalizeAdminProfile)
  return normalized.length > 0 ? normalized : DEFAULT_ADMIN_ACCOUNTS
}
