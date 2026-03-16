import { StatusCodes } from "http-status-codes";

export function getHealth(_req, res) {
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Backend is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
