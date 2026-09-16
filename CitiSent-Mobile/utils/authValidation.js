import { isEmptyIdentifier } from "./authIdentifier";

export const validateLoginFields = (identifier, password) => {
  const errors = {
    identifier: "",
    password: "",
  };

  const trimmedIdentifier = identifier.trim();

  if (isEmptyIdentifier(trimmedIdentifier)) {
    errors.identifier = "Username or phone number is required.";
  } else if (trimmedIdentifier.length < 3) {
    errors.identifier =
      "Username or phone number must be at least 3 characters.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return {
    errors,
    isValid: !errors.identifier && !errors.password,
  };
};

export const getLoginErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.message || "";

  if (error?.response?.status === 429) {
    return "Too many login attempts. Please try again later.";
  }

  if (
    error?.message?.toLowerCase().includes("network") ||
    error?.code === "ECONNABORTED" ||
    (!error?.response && error?.request)
  ) {
    return "Network error. Please check your internet connection and try again.";
  }

  return (
    apiMessage ||
    error?.message ||
    "Unable to login right now. Please try again."
  );
};

export function validateNameInput(value, fieldLabel, { isOptional = false } = {}) {
  const str = value === undefined || value === null ? "" : String(value);

  if (str === "") {
    if (isOptional) return "";
    return `${fieldLabel} is required.`;
  }

  if (str.trim().length === 0) {
    return `${fieldLabel} cannot be only spaces.`;
  }

  if (/^\s/.test(str) && /\s$/.test(str)) {
    return `${fieldLabel} cannot have leading or trailing spaces.`;
  }

  if (/^\s/.test(str)) {
    return `${fieldLabel} cannot start with a space.`;
  }

  if (/\s$/.test(str)) {
    return `${fieldLabel} cannot end with a space.`;
  }

  if (/\s{2,}/.test(str)) {
    return `${fieldLabel} cannot contain consecutive spaces.`;
  }

  if (str.length > 120) {
    return `${fieldLabel} must not exceed 120 characters.`;
  }

  return "";
}

