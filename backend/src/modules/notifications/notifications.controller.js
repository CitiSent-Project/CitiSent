import { StatusCodes } from "http-status-codes";
import { notificationsService } from "./notifications.service.js";

export const notificationsController = {
  async listNotifications(req, res) {
    const result = await notificationsService.listNotifications({
      userId: req.user.id,
      accessToken: req.accessToken,
      limit: req.query.limit,
      offset: req.query.offset,
      read: req.query.read,
      reportId: req.query.reportId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  },

  async updateNotificationReadState(req, res) {
    const result = await notificationsService.updateNotificationReadState({
      userId: req.user.id,
      accessToken: req.accessToken,
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
      userId: req.user.id,
      accessToken: req.accessToken,
      notificationIds: req.body.notificationIds,
      markAll: req.body.markAll,
      isRead: req.body.isRead,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },
};
