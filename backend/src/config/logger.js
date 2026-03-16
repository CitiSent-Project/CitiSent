function baseLog(level, message, meta) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info: (message, meta) => baseLog("info", message, meta),
  warn: (message, meta) => baseLog("warn", message, meta),
  error: (message, meta) => baseLog("error", message, meta),
};
