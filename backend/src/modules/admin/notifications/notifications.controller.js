import { StatusCodes } from "http-status-codes";
import { notificationsService } from "./notifications.service.js";

export const notificationsController = {
  async listNotifications(req, res) {
    const result = await notificationsService.listNotifications({
      actor: req.actor,
      accessToken: req.accessToken,
      adminId: req.query.adminId,
      limit: req.query.limit,
      offset: req.query.offset,
      read: req.query.read,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  },

  async updateNotificationReadState(req, res) {
    const result = await notificationsService.updateNotificationReadState({
      actor: req.actor,
      accessToken: req.accessToken,
      adminId: req.body.adminId,
      notificationId: req.params.notificationId,
      isRead: req.body.isRead,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async bulkUpdateNotificationReadState(req, res) {
    const result = await notificationsService.bulkUpdateNotificationReadState({
      actor: req.actor,
      accessToken: req.accessToken,
      adminId: req.body.adminId,
      notificationIds: req.body.notificationIds,
      markAll: req.body.markAll,
      isRead: req.body.isRead,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async clearNotifications(req, res) {
    const result = await notificationsService.clearNotifications({
      actor: req.actor,
      accessToken: req.accessToken,
      adminId: req.body.adminId,
      notificationIds: req.body.notificationIds,
      clearAll: req.body.clearAll,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },
};
