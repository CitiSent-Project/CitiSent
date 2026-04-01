import { StatusCodes } from "http-status-codes";
import { isSuperadmin } from "../../../shared/auth/roleAccess.js";
import { AppError } from "../../../shared/errors/appError.js";
import { toAdminActivityLogResponse } from "./activity.mapper.js";
import { activityRepository } from "./activity.repository.js";

function resolveTargetAdminId({ actor, requestedAdminId }) {
  const actorId = String(actor?.id || "").trim();
  const normalizedRequestedAdminId = String(requestedAdminId || "").trim();

  if (!actorId) {
    throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
  }

  if (!normalizedRequestedAdminId || normalizedRequestedAdminId === actorId) {
    return actorId;
  }

  if (!isSuperadmin(actor?.role)) {
    throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
  }

  return normalizedRequestedAdminId;
}

export const activityService = {
  async listActivityLog({ actor, accessToken, adminId, limit, offset }) {
    const targetAdminId = resolveTargetAdminId({
      actor,
      requestedAdminId: adminId,
    });

    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 100;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

    const result = await activityRepository.listActivityLog({
      accessToken,
      adminUserId: targetAdminId,
      limit: normalizedLimit,
      offset: normalizedOffset,
    });

    return {
      data: result.rows.map(toAdminActivityLogResponse),
      pagination: {
        total: result.count,
        limit: normalizedLimit,
        offset: normalizedOffset,
      },
    };
  },

  async createActivityLogEntry({ actor, accessToken, adminId, action, detail }) {
    const targetAdminId = resolveTargetAdminId({
      actor,
      requestedAdminId: adminId,
    });

    const createdEntry = await activityRepository.createActivityLogEntry({
      accessToken,
      adminUserId: targetAdminId,
      action,
      detail,
    });

    return toAdminActivityLogResponse(createdEntry);
  },
};
