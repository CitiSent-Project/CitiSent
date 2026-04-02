import { StatusCodes } from "http-status-codes";
import { AppError } from "../../shared/errors/appError.js";
import { notificationsRepository } from "../admin/notifications/notifications.repository.js";
import { toNotificationResponse } from "./notifications.mapper.js";

function normalizeReadFilter(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue === "read") {
    return true;
  }

  if (normalizedValue === "unread") {
    return false;
  }

  return undefined;
}

export const notificationsService = {
  async listNotifications({ userId, accessToken, limit, offset, read, reportId }) {
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

    const result = await notificationsRepository.listNotifications({
      accessToken,
      userId,
      limit: normalizedLimit,
      offset: normalizedOffset,
      isRead: normalizeReadFilter(read),
      reportId,
    });

    return {
      data: result.rows.map(toNotificationResponse),
      pagination: {
        total: result.count,
        limit: normalizedLimit,
        offset: normalizedOffset,
      },
    };
  },

  async updateNotificationReadState({ userId, accessToken, notificationId, isRead }) {
    const updated = await notificationsRepository.updateNotificationReadState({
      accessToken,
      userId,
      notificationId,
      isRead,
    });

    if (!updated) {
      throw new AppError("Notification not found", StatusCodes.NOT_FOUND);
    }

    return toNotificationResponse(updated);
  },

  async bulkUpdateNotificationReadState({
    userId,
    accessToken,
    notificationIds,
    markAll,
    isRead,
  }) {
    const updatedRows = await notificationsRepository.bulkUpdateNotificationReadState({
      accessToken,
      userId,
      notificationIds,
      markAll,
      isRead,
    });

    return {
      updatedCount: updatedRows.length,
      data: updatedRows.map(toNotificationResponse),
    };
  },
};
