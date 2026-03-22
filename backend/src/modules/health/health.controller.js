import { StatusCodes } from "http-status-codes";
import { healthService } from "./health.service.js";

export function getHealth(_req, res) {
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Backend is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export async function getSupabaseHealth(_req, res) {
  const readiness = await healthService.getSupabaseReadiness();

  const statusCode = readiness.connected
    ? StatusCodes.OK
    : StatusCodes.SERVICE_UNAVAILABLE;

  return res.status(statusCode).json({
    success: readiness.connected,
    message: readiness.connected
      ? "Supabase is reachable"
      : "Supabase is not reachable",
    timestamp: new Date().toISOString(),
    supabase: readiness,
  });
}
