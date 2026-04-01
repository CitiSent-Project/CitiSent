import { StatusCodes } from "http-status-codes";
import { isSuperadmin } from "../../../shared/auth/roleAccess.js";
import { AppError } from "../../../shared/errors/appError.js";
import { toAdminNotificationResponse } from "./notifications.mapper.js";
import { notificationsRepository } from "./notifications.repository.js";

function resolveNotificationTargetAdminId({ actor, requestedAdminId }) {
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

function normalizeReadFilter(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue === "read" || normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "unread" || normalizedValue === "false") {
    return false;
  }

  return undefined;
}

export const notificationsService = {
  async listNotifications({ actor, accessToken, adminId, limit, offset, read }) {
    const targetAdminId = resolveNotificationTargetAdminId({
      actor,
      requestedAdminId: adminId,
    });
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

    const result = await notificationsRepository.listNotifications({
      accessToken,
      adminUserId: targetAdminId,
      limit: normalizedLimit,
      offset: normalizedOffset,
      isRead: normalizeReadFilter(read),
    });

    return {
      data: result.rows.map(toAdminNotificationResponse),
      pagination: {
        total: result.count,
        limit: normalizedLimit,
        offset: normalizedOffset,
      },
    };
  },

  async updateNotificationReadState({
    actor,
    accessToken,
    adminId,
    notificationId,
    isRead,
  }) {
    const targetAdminId = resolveNotificationTargetAdminId({
      actor,
      requestedAdminId: adminId,
    });

    const updatedNotification = await notificationsRepository.updateNotificationReadState({
      accessToken,
      adminUserId: targetAdminId,
      notificationId,
      isRead,
    });

    if (!updatedNotification) {
      throw new AppError("Notification not found", StatusCodes.NOT_FOUND);
    }

    return toAdminNotificationResponse(updatedNotification);
  },

  async bulkUpdateNotificationReadState({
    actor,
    accessToken,
    adminId,
    notificationIds,
    markAll,
    isRead,
  }) {
    const targetAdminId = resolveNotificationTargetAdminId({
      actor,
      requestedAdminId: adminId,
    });
    const normalizedIds = Array.from(
      new Set(
        (notificationIds || [])
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );

    if (!markAll && normalizedIds.length === 0) {
      throw new AppError(
        "notificationIds is required when markAll is false",
        StatusCodes.BAD_REQUEST,
      );
    }

    const updatedRows = await notificationsRepository.bulkUpdateNotificationReadState({
      accessToken,
      adminUserId: targetAdminId,
      notificationIds: normalizedIds,
      markAll,
      isRead,
    });

    return {
      updatedCount: updatedRows.length,
      data: updatedRows.map(toAdminNotificationResponse),
    };
  },

  async clearNotifications({ actor, accessToken, adminId, notificationIds, clearAll }) {
    const targetAdminId = resolveNotificationTargetAdminId({
      actor,
      requestedAdminId: adminId,
    });
    const normalizedIds = Array.from(
      new Set(
        (notificationIds || [])
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );

    if (!clearAll && normalizedIds.length === 0) {
      throw new AppError(
        "notificationIds is required when clearAll is false",
        StatusCodes.BAD_REQUEST,
      );
    }

    const clearedRows = await notificationsRepository.clearNotifications({
      accessToken,
      adminUserId: targetAdminId,
      notificationIds: normalizedIds,
      clearAll,
    });

    return {
      clearedCount: clearedRows.length,
    };
  },
};
