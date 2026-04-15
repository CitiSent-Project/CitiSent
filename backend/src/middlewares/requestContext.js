import crypto from "node:crypto";
import { logger } from "../config/logger.js";

export function requestContext(req, res, next) {
  const requestId = crypto.randomUUID();
  const startTimeMs = Date.now();

  req.requestId = requestId;
  req.requestStartTimeMs = startTimeMs;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    logger.info("Request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTimeMs,
    });
  });

  next();
}
