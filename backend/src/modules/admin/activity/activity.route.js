import { Router } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { requireRole } from "../../../middlewares/actor.js";
import { validateRequest } from "../../../middlewares/validateRequest.js";
import { USER_ROLES } from "../../../shared/auth/roleAccess.js";
import { activityController } from "./activity.controller.js";
import {
  createAdminActivityLogSchema,
  listAdminActivityLogSchema,
} from "./activity.schema.js";

const adminActivityRouter = Router();

adminActivityRouter.get(
  "/activity-log",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(listAdminActivityLogSchema),
  asyncHandler(activityController.listActivityLog),
);

adminActivityRouter.post(
  "/activity-log",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(createAdminActivityLogSchema),
  asyncHandler(activityController.createActivityLogEntry),
);

export { adminActivityRouter };
