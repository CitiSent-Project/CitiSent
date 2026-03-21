function parseBooleanEnv(value, defaultValue) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return defaultValue;
}

export const runtimeFlags = Object.freeze({
  allowTempAuthLogin: parseBooleanEnv(
    process.env.EXPO_PUBLIC_ALLOW_TEMP_AUTH_LOGIN,
    true,
  ),
  allowLocalReportsFallback: parseBooleanEnv(
    process.env.EXPO_PUBLIC_ALLOW_LOCAL_REPORTS_FALLBACK,
    true,
  ),
});
