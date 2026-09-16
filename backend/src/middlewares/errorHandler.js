import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return _next(err);
  }

  if (err.code === "REQUEST_TIMEOUT") {
    err.isOperational = true;
  }

  const statusCode = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const isOperational = Boolean(err.isOperational);

  if (!isOperational || statusCode >= 500) {
    logger.error("Unhandled application error", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorName: err.name,
      errorCode: err.code,
      message: err.message,
      details: err.details,
      stack: err.stack,
    });
  } else if (statusCode >= StatusCodes.BAD_REQUEST && statusCode < 500) {
    const invalidFields = Array.from(
      new Set(
        (Array.isArray(err.details) ? err.details : [])
          .map((detail) => String(detail?.path || "").trim())
          .filter(Boolean),
      ),
    );

    logger.warn("Request rejected", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorName: err.name,
      errorCode: err.code,
      invalidFields,
    });
  }

  res.status(statusCode).json({
    success: false,
    requestId: req.requestId,
    message: err.message || "Internal server error",
    ...(err.details ? { details: err.details } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}
