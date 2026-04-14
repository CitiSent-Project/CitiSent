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
      errorName: err.name,
      message: err.message,
      stack: err.stack,
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
