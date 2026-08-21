import crypto from "node:crypto";
import { logger } from "../config/logger.js";

export function requestContext(req, res, next) {
  const requestId = crypto.randomUUID();
  const startTimeMs = Date.now();

  const timings = {
    auth: 0,
    db: 0,
    cache: 0,
    ext: 0,
    ser: 0,
  };
  const stages = {};

  req.requestId = requestId;
  req.requestStartTimeMs = startTimeMs;
  req.perf = {
    timings,
    add(category, durationMs) {
      if (timings[category] !== undefined && Number.isFinite(durationMs)) {
        timings[category] += Math.max(0, Math.round(durationMs));
      }
    },
    async track(category, asyncFn) {
      const start = Date.now();
      try {
        return await asyncFn();
      } finally {
        const elapsed = Date.now() - start;
        if (timings[category] !== undefined) {
          timings[category] += elapsed;
        }
      }
    },
    async trackStage(name, asyncFn) {
      const start = Date.now();
      try {
        return await asyncFn();
      } finally {
        stages[name] = (stages[name] || 0) + Math.max(0, Date.now() - start);
      }
    },
  };

  res.setHeader("x-request-id", requestId);

  // Hook into response headers to attach Server-Timing header
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const serverTiming = [
        `total;dur=${Date.now() - startTimeMs}`,
        timings.auth > 0 ? `auth;dur=${timings.auth}` : null,
        timings.db > 0 ? `db;dur=${timings.db}` : null,
        timings.cache > 0 ? `cache;dur=${timings.cache}` : null,
        timings.ext > 0 ? `ext;dur=${timings.ext}` : null,
        ...Object.entries(stages).map(([name, durationMs]) =>
          `login-${name};dur=${durationMs}`,
        ),
      ]
        .filter(Boolean)
        .join(", ");

      if (serverTiming) {
        res.setHeader("Server-Timing", serverTiming);
      }
    }
    return originalWriteHead.apply(this, args);
  };

  res.on("finish", () => {
    const totalDurationMs = Date.now() - startTimeMs;
    logger.info("Request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: totalDurationMs,
      totalDurationMs,
      authDurationMs: timings.auth,
      databaseDurationMs: timings.db,
      cacheDurationMs: timings.cache,
      externalApiDurationMs: timings.ext,
      ...(Object.keys(stages).length > 0 ? { stageDurationsMs: stages } : {}),
    });
  });

  next();
}

