import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { notificationsController } from "./notifications.controller.js";
import {
  bulkUpdateNotificationReadStateSchema,
  listNotificationsSchema,
  updateNotificationReadStateSchema,
} from "./notifications.schema.js";

const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  validateRequest(listNotificationsSchema),
  asyncHandler(notificationsController.listNotifications),
);

notificationsRouter.patch(
  "/:notificationId/read",
  requireAuth,
  validateRequest(updateNotificationReadStateSchema),
  asyncHandler(notificationsController.updateNotificationReadState),
);

notificationsRouter.patch(
  "/read-state",
  requireAuth,
  validateRequest(bulkUpdateNotificationReadStateSchema),
  asyncHandler(notificationsController.bulkUpdateNotificationReadState),
);

export { notificationsRouter };
