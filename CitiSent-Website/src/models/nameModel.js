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
