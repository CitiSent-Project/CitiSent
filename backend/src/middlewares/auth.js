import crypto from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { supabase } from "../config/supabase.js";
import { AppError } from "../shared/errors/appError.js";
import { cacheService } from "../shared/cache/cacheService.js";

import { tryVerifyGuestToken } from "../shared/security/guestTokens.js";

const AUTH_CACHE_TTL_SECONDS = 60;

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

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requireAuth(req, _res, next) {
  const authStart = Date.now();
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    // Check if token is a CitiSent signed guest token
    try {
      const guestPayload = tryVerifyGuestToken(token);
      if (guestPayload) {
        req.user = {
          id: guestPayload.guestId,
          role: "guest",
          isGuest: true,
          isVerified: Boolean(guestPayload.isVerified),
          phoneNumber: guestPayload.phoneNumber || null,
        };
        req.accessToken = token;
        req.perf?.add("auth", Date.now() - authStart);
        return next();
      }
    } catch (guestErr) {
      if (guestErr?.isGuestError) {
        return next(
          new AppError(guestErr.message, StatusCodes.UNAUTHORIZED, {
            code: guestErr.code,
          }),
        );
      }
    }

    const tokenHash = hashToken(token);
    const cacheKey = `auth:token:${tokenHash}`;

    // Fast-path: Check Redis / Memory cache for verified user session
    const cacheStart = Date.now();
    const cachedUser = await cacheService.getJSON(cacheKey);
    req.perf?.add("cache", Date.now() - cacheStart);

    if (cachedUser?.id) {
      req.user = cachedUser;
      req.accessToken = token;
      req.perf?.add("auth", Date.now() - authStart);
      return next();
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return next(
        new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED),
      );
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    };

    req.user = user;
    req.accessToken = token;

    // Cache valid auth session for 60s
    await cacheService.setJSON(cacheKey, user, AUTH_CACHE_TTL_SECONDS);

    req.perf?.add("auth", Date.now() - authStart);
    return next();
  } catch (error) {
    req.perf?.add("auth", Date.now() - authStart);
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

