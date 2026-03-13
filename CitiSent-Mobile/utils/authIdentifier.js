function normalizeValue(value) {
  return String(value || "").trim();
}

function normalizePhoneNumber(value) {
  return normalizeValue(value).replace(/\D/g, "");
}

function isLikelyPhoneNumber(value) {
  const normalizedPhone = normalizePhoneNumber(value);
  return normalizedPhone.length >= 10 && normalizedPhone.length <= 15;
}

export function parseLoginIdentifier(value) {
  const normalizedValue = normalizeValue(value);
  const normalizedPhoneNumber = normalizePhoneNumber(value);
  const phoneLogin = isLikelyPhoneNumber(value);

  return {
    raw: normalizedValue,
    username: phoneLogin ? "" : normalizedValue,
    phoneNumber: phoneLogin ? normalizedPhoneNumber : "",
    loginWithPhone: phoneLogin,
  };
}

export function isEmptyIdentifier(value) {
  return normalizeValue(value).length === 0;
}
