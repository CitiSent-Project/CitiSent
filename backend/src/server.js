import dns from "node:dns";
import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
import { logger } from "./config/logger.js";
import { healthService } from "./modules/health/health.service.js";
import { initSocketIO } from "./realtime/socket.js";
import { cacheService } from "./shared/cache/cacheService.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;
let isShuttingDown = false;
let server = null;
let runtimeMetricsTimer = null;

function toMemoryMetricsMb(memoryUsage) {
  return {
    rssMb: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
    heapUsedMb: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
    heapTotalMb: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
    externalMb: Number((memoryUsage.external / 1024 / 1024).toFixed(2)),
  };
}

function logRuntimeMetrics() {
  const memory = process.memoryUsage();

  logger.info("Runtime process metrics", {
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    ...toMemoryMetricsMb(memory),
  });
}

function startRuntimeMetricsLogging() {
  if (!env.ENABLE_RUNTIME_METRICS) {
    return;
  }

  runtimeMetricsTimer = setInterval(() => {
    logRuntimeMetrics();
  }, env.RUNTIME_METRICS_INTERVAL_MS);

  if (typeof runtimeMetricsTimer.unref === "function") {
    runtimeMetricsTimer.unref();
  }

  logger.info("Runtime metrics logging enabled", {
    intervalMs: env.RUNTIME_METRICS_INTERVAL_MS,
  });
}

function stopRuntimeMetricsLogging() {
  if (!runtimeMetricsTimer) {
    return;
  }

  clearInterval(runtimeMetricsTimer);
  runtimeMetricsTimer = null;
}

async function withTimeout(promise, timeoutMs, label) {
  let timeoutHandle;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function verifyStartupDependencies() {
  const supabaseReadiness = await withTimeout(
    healthService.getSupabaseReadiness(),
    env.STARTUP_SUPABASE_TIMEOUT_MS,
    "Supabase readiness check",
  );

  if (!supabaseReadiness.connected) {
    throw new Error(
      `Supabase startup check failed: ${supabaseReadiness.error?.message || "unknown error"}`,
    );
  }

  logger.info("Startup dependencies verified", {
    supabaseLatencyMs: supabaseReadiness.latencyMs,
  });
}

async function shutdown(signal, options = {}) {
  const { exitCode = 0, error = null } = options;

  if (isShuttingDown) return;
  isShuttingDown = true;

  stopRuntimeMetricsLogging();

  logger.info("Shutdown signal received", {
    signal,
    ...(error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : {}),
  });

  const forceExitTimer = setTimeout(() => {
    logger.error("Forced shutdown due to timeout", {
      timeoutMs: SHUTDOWN_TIMEOUT_MS,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  // Gracefully close cache connection first
  try {
    await cacheService.close();
  } catch (err) {
    logger.warn("Failed to close cache service gracefully on shutdown", { message: err.message });
  }

  if (!server) {
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
    return;
  }

  // If the server is not in a listening state, avoid calling close()
  // to prevent attempting to close handles that are already closing/closed.
  if (!server.listening) {
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
    return;
  }

  try {
    server.close((error) => {
      clearTimeout(forceExitTimer);

      if (error) {
        logger.error("Error while shutting down server", {
          message: error.message,
        });
        process.exit(1);
        return;
      }

      logger.info("HTTP & Socket.IO server closed gracefully");
      server = null;
      process.exit(exitCode);
    });
  } catch (err) {
    // Defensive: if close throws synchronously, log and exit.
    clearTimeout(forceExitTimer);
    logger.error("Error while shutting down server (sync)", { message: err.message });
    process.exit(1);
  }
}

async function startServer() {
  try {
    await verifyStartupDependencies();
    await cacheService.initialize();
  } catch (error) {
    logger.error("Startup dependency verification failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
    return;
  }

  const httpServer = createServer(app);
  initSocketIO(httpServer);

  server = httpServer.listen(env.PORT, () => {
    logger.info("Backend HTTP & Socket.IO server started", {
      port: env.PORT,
      env: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
      requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    });
  });

  startRuntimeMetricsLogging();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  shutdown("UNHANDLED_REJECTION", {
    exitCode: 1,
    error,
  });
});
process.on("uncaughtException", (error) => {
  shutdown("UNCAUGHT_EXCEPTION", {
    exitCode: 1,
    error,
  });
});

startServer();
