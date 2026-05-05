export function normalizeNamePart(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

export function composeFullName({ fname, mname, lname }) {
  const parts = [fname, mname, lname]
    .map(normalizeNamePart)
    .filter(Boolean);

  return parts.join(" ");
}
