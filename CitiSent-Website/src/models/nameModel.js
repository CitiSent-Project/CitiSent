export const GUEST_LABEL = 'Guest'

export function isGuestEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) {
    return false
  }

  return (
    normalized.endsWith('@citisent.guest') ||
    normalized === 'unknown@citisent.gov' ||
    normalized === 'guest'
  )
}

export function isGuestUser(record = {}) {
  if (!record || typeof record !== 'object') {
    return false
  }

  if (record.isGuest === true || record.is_guest === true) {
    return true
  }

  const role = String(record.role || '').trim().toLowerCase()
  const accountType = String(record.accountType || record.account_type || '').trim().toLowerCase()
  if (role === 'guest' || accountType === 'guest') {
    return true
  }

  const email = record.email ?? record.userEmail ?? record.reporterEmail ?? ''
  if (isGuestEmail(email)) {
    return true
  }

  const nameCandidate = String(
    record.fullName || record.name || record.username || ''
  )
    .trim()
    .toLowerCase()

  if (
    nameCandidate === 'guest' ||
    nameCandidate === 'guest user' ||
    nameCandidate.startsWith('guest_')
  ) {
    return true
  }

  return false
}

export function normalizeNamePart(value) {
  if (value === undefined || value === null) {
    return ''
  }

  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : ''
}

export function composeFullName({ fname, mname, lname }) {
  return [fname, mname, lname]
    .map(normalizeNamePart)
    .filter(Boolean)
    .join(' ')
}

export function splitFullName(fullName) {
  const trimmed = String(fullName || '').trim()
  if (!trimmed) {
    return { fname: '', mname: '', lname: '' }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return { fname: parts[0], mname: '', lname: '' }
  }

  if (parts.length === 2) {
    return { fname: parts[0], mname: '', lname: parts[1] }
  }

  return {
    fname: parts[0],
    mname: parts.slice(1, -1).join(' '),
    lname: parts[parts.length - 1],
  }
}
