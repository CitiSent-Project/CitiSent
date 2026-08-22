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

export function getLiveness(_req, res) {
  return res.status(StatusCodes.OK).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export async function getReadiness(_req, res) {
  const supabaseReadiness = await healthService.getSupabaseReadiness();

  const isReady = supabaseReadiness.connected;
  const statusCode = isReady ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE;

  return res.status(statusCode).json({
    status: isReady ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    dependencies: {
      supabase: supabaseReadiness,
    },
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
