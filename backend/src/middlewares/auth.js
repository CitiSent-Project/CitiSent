import { StatusCodes } from "http-status-codes";
import { supabase } from "../config/supabase.js";
import { AppError } from "../shared/errors/appError.js";

function extractBearerToken(headerValue) {
  if (!headerValue?.startsWith("Bearer ")) return null;
  return headerValue.slice("Bearer ".length).trim();
}

export async function requireAuth(req, _res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return next(
      new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED),
    );
  }

  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.role,
  };
  req.accessToken = token;

  return next();
}
