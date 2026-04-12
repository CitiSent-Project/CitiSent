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
    errors.identifier = "Username or phone number must be at least 3 characters.";
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

  if (
    error?.response?.status === 401 ||
    error?.response?.status === 403 ||
    error?.response?.status === 404 ||
    error?.message?.toLowerCase().includes("invalid") ||
    error?.message?.toLowerCase().includes("incorrect") ||
    error?.message?.toLowerCase().includes("not found") ||
    apiMessage.toLowerCase().includes("invalid") ||
    apiMessage.toLowerCase().includes("incorrect")
  ) {
    return "Incorrect username, phone number, or password. Please try again.";
  }
  
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
  
  return apiMessage || error?.message || "Unable to login right now. Please try again.";
};
