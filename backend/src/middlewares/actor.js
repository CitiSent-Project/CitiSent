import { StatusCodes } from "http-status-codes";
import { buildActor, normalizeUserRole } from "../shared/auth/roleAccess.js";
import { profileRepository } from "../shared/repositories/profileRepository.js";
import { AppError } from "../shared/errors/appError.js";

export async function loadActorProfile(req, _res, next) {
  try {
    const profile = await profileRepository.getByUserId({
      userId: req.user.id,
      accessToken: req.accessToken,
    });

    req.actor = buildActor({
      authUser: req.user,
      profile,
    });

    return next();
  } catch (error) {
    return next(
      new AppError(
        "Unable to resolve actor profile",
        StatusCodes.BAD_GATEWAY,
        {
          message: error.message,
        },
      ),
    );
  }
}

export function requireRole(allowedRoles = []) {
  const normalizedAllowedRoles = allowedRoles
    .map((role) => normalizeUserRole(role))
    .filter(Boolean);

  return function roleGuard(req, _res, next) {
    const role = normalizeUserRole(req.actor?.role);

    if (!req.actor?.id || !req.actor?.hasProfile) {
      return next(
        new AppError("Actor profile not found", StatusCodes.FORBIDDEN),
      );
    }

    if (!role || !normalizedAllowedRoles.includes(role)) {
      return next(new AppError("Forbidden", StatusCodes.FORBIDDEN));
    }

    return next();
  };
}
