import { Router } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { requireRole } from "../../../middlewares/actor.js";
import { validateRequest } from "../../../middlewares/validateRequest.js";
import { USER_ROLES } from "../../../shared/auth/roleAccess.js";
import { notificationsController } from "./notifications.controller.js";
import {
  bulkUpdateNotificationReadStateSchema,
  clearNotificationsSchema,
  listAdminNotificationsSchema,
  updateNotificationReadStateSchema,
} from "./notifications.schema.js";

const adminNotificationsRouter = Router();

adminNotificationsRouter.get(
  "/notifications",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(listAdminNotificationsSchema),
  asyncHandler(notificationsController.listNotifications),
);

adminNotificationsRouter.patch(
  "/notifications/:notificationId/read",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(updateNotificationReadStateSchema),
  asyncHandler(notificationsController.updateNotificationReadState),
);

adminNotificationsRouter.patch(
  "/notifications/read-state",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(bulkUpdateNotificationReadStateSchema),
  asyncHandler(notificationsController.bulkUpdateNotificationReadState),
);

adminNotificationsRouter.post(
  "/notifications/clear",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(clearNotificationsSchema),
  asyncHandler(notificationsController.clearNotifications),
);

export { adminNotificationsRouter };
