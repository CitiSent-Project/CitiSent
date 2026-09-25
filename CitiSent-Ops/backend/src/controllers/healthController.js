import { supabaseAdmin } from "../config/supabase.js";

/**
 * Format uptime into a human-readable duration string (e.g., "2d 4h 12m 30s").
 *
 * @param {number} seconds - Process uptime in seconds
 * @returns {string} Human-readable uptime format
 */
function formatUptime(seconds) {
  const sec = Math.floor(seconds % 60);
  const min = Math.floor((seconds / 60) % 60);
  const hours = Math.floor((seconds / 3600) % 24);
  const days = Math.floor(seconds / 86400);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (min > 0) parts.push(`${min}m`);
  parts.push(`${sec}s`);

  return parts.join(" ");
}

/**
 * Health Check Controller (`GET /api/v1/ops/health`)
 *
 * Serves as an observability and liveness/readiness probe for:
 * - Docker container healthchecks (`HEALTHCHECK CMD curl -f http://localhost:5001/api/v1/ops/health || exit 1`)
 * - Cloud container orchestrators (Kubernetes / AWS ECS liveness and readiness probes)
 * - Synthetic uptime monitors (UptimeRobot, BetterUptime)
 *
 * It validates both local process health (memory, uptime) and critical upstream
 * dependencies (Supabase PostgreSQL database connectivity and response latency).
 */
export async function getHealthStatus(req, res) {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = null;
  let dbError = null;

  try {
    // Ping Supabase PostgreSQL via a lightweight single-row query on an indexed table.
    // This verifies both network reachability and database query responsiveness.
    const { error } = await supabaseAdmin
      .from("platform_audit_logs")
      .select("id")
      .limit(1);

    dbLatencyMs = Date.now() - startTime;

    if (error) {
      dbStatus = "degraded";
      dbError = error.message;
    }
  } catch (err) {
    dbStatus = "disconnected";
    dbLatencyMs = Date.now() - startTime;
    dbError = err.message || "Unknown database connection error";
  }

  const isHealthy = dbStatus === "connected";
  const statusCode = isHealthy ? 200 : 503;

  const memUsage = process.memoryUsage();

  return res.status(statusCode).json({
    status: isHealthy ? "healthy" : "unhealthy",
    service: "citisent-ops-backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    },
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError && { error: dbError }),
      },
      system: {
        rssMb: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      },
    },
  });
}
