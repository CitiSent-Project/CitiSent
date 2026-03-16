import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { createReportSchema, listReportsSchema } from "./reports.schema.js";
import { reportsController } from "./reports.controller.js";

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

export { reportsRouter };
