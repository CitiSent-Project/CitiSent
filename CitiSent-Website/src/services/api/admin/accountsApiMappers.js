function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

import { composeFullName, splitFullName } from '../../../models/nameModel'

const BACKEND_TO_UI_USER_STATUS = {
  active: 'Active',
  pending: 'Pending',
  banned: 'Banned',
}

const UI_TO_BACKEND_USER_STATUS = {
  Active: 'active',
  Pending: 'pending',
  Banned: 'banned',
}

function normalizeUserStatusLabel(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  return BACKEND_TO_UI_USER_STATUS[normalizedStatus] || 'Active'
}

export function mapBackendProfileToAdminProfile(payload = {}) {
  const derivedParts = splitFullName(payload.fullName)
  const fname = payload.fname || derivedParts.fname || ''
  const mname = payload.mname || derivedParts.mname || ''
  const lname = payload.lname || derivedParts.lname || ''
  const derivedFullName = composeFullName({ fname, mname, lname })

  return {
    id: payload.id || '',
    fname,
    mname,
    lname,
    fullName: derivedFullName || payload.fullName || payload.username || '',
    username: payload.username || '',
    email: payload.email || '',
    departmentId: payload.departmentId || '',
    department: payload.departmentLabel || '',
    role: payload.role || '',
    phone: payload.phoneNumber || '',
    barangay: payload.barangay || '',
    city: payload.city || '',
    province: payload.province || '',
    joinedAt: payload.joinedAt || '',
    lastLoginAt: payload.lastLoginAt || '',
    accountType: payload.accountType || '',
  }
}

export function mapBackendUserToUiRow(payload = {}) {
  const joinedAtValue = Date.parse(payload.joinedAt || payload.updatedAt || '')
  const derivedFullName = composeFullName({
    fname: payload.fname,
    mname: payload.mname,
    lname: payload.lname,
  })

  return {
    id: payload.id || '',
    name:
      derivedFullName || payload.fullName || payload.username || payload.email || 'Unknown User',
    fname: payload.fname || '',
    mname: payload.mname || '',
    lname: payload.lname || '',
    email: payload.email || 'Not available',
    barangay: payload.barangay || '',
    city: payload.city || '',
    province: payload.province || '',
    status: normalizeUserStatusLabel(payload.status),
    registeredAt: formatDate(payload.joinedAt),
    registeredAtValue: Number.isNaN(joinedAtValue) ? 0 : joinedAtValue,
    username: payload.username || '',
    role: payload.role || '',
    accountType: payload.accountType || '',
    phoneNumber: payload.phoneNumber || '',
    gender: payload.gender || '',
    departmentLabel: payload.departmentLabel || '',
    departmentId: payload.departmentId || '',
    ban: payload.ban || null,
    joinedAt: payload.joinedAt || '',
    updatedAt: payload.updatedAt || '',
  }
}

export function mapUiStatusToBackendUserStatus(status) {
  return UI_TO_BACKEND_USER_STATUS[String(status || '').trim()] || 'active'
}

export function mapBackendOfficeAdmin(payload = {}) {
  const derivedFullName = composeFullName({
    fname: payload.fname,
    mname: payload.mname,
    lname: payload.lname,
  })

  return {
    id: payload.id || '',
    fname: payload.fname || '',
    mname: payload.mname || '',
    lname: payload.lname || '',
    fullName: derivedFullName || payload.fullName || '',
    email: payload.email || '',
    departmentId: payload.departmentId || '',
    department: payload.departmentLabel || '',
    role: payload.role || '',
    phone: payload.phoneNumber || '',
    barangay: payload.barangay || '',
    city: payload.city || '',
    province: payload.province || '',
    joinedAt: payload.joinedAt || '',
    lastLoginAt: payload.lastLoginAt || '',
  }
}
