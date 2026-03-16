import { StatusCodes } from "http-status-codes";

export function notFound(req, res) {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    requestId: req.requestId,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
