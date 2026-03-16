import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info("Backend server started", {
    port: env.PORT,
    env: env.NODE_ENV,
    apiPrefix: env.API_PREFIX,
  });
});

const SHUTDOWN_TIMEOUT_MS = 10_000;
let isShuttingDown = false;

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("Shutdown signal received", { signal });

  const forceExitTimer = setTimeout(() => {
    logger.error("Forced shutdown due to timeout", {
      timeoutMs: SHUTDOWN_TIMEOUT_MS,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  server.close((error) => {
    clearTimeout(forceExitTimer);

    if (error) {
      logger.error("Error while shutting down server", {
        message: error.message,
      });
      process.exit(1);
      return;
    }

    logger.info("HTTP server closed gracefully");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
