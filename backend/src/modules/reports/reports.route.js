import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import {
  createReportSchema,
  deleteReportSchema,
  getReportByIdSchema,
  listReportsSchema,
  updateReportSchema,
} from "./reports.schema.js";
import { reportsController } from "./reports.controller.js";
import { reportMessagesRouter } from "./messages.route.js";

const reportsRouter = Router();

reportsRouter.get(
  "/",
  requireAuth,
  validateRequest(listReportsSchema),
  asyncHandler(reportsController.list),
);

reportsRouter.post(
  "/",
  requireAuth,
  validateRequest(createReportSchema),
  asyncHandler(reportsController.create),
);

reportsRouter.get(
  "/counts",
  requireAuth,
  asyncHandler(reportsController.getCounts),
);

reportsRouter.get(
  "/:reportId",
  requireAuth,
  validateRequest(getReportByIdSchema),
  asyncHandler(reportsController.getById),
);

reportsRouter.patch(
  "/:reportId",
  requireAuth,
  validateRequest(updateReportSchema),
  asyncHandler(reportsController.update),
);

reportsRouter.delete(
  "/:reportId",
  requireAuth,
  validateRequest(deleteReportSchema),
  asyncHandler(reportsController.remove),
);

reportsRouter.use("/:reportId/messages", reportMessagesRouter);

export { reportsRouter };
