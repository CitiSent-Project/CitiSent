import { StatusCodes } from "http-status-codes";
import { supabase } from "../config/supabase.js";
import { AppError } from "../shared/errors/appError.js";

function isLikelyJwt(value) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
    String(value || ""),
  );
}

function extractBearerToken(headerValue) {
  if (!headerValue?.startsWith("Bearer ")) return null;

  const token = headerValue.slice("Bearer ".length).trim();
  return isLikelyJwt(token) ? token : null;
}

export async function requireAuth(req, _res, next) {
  try {
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
  } catch (error) {
    return next(
      new AppError(
        "Authentication provider is currently unavailable",
        StatusCodes.BAD_GATEWAY,
        {
          message: error.message,
        },
      ),
    );
  }
}
