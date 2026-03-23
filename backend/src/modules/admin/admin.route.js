import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { loadActorProfile, requireRole } from "../../middlewares/actor.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { adminController } from "./admin.controller.js";
import {
  assignOfficeDepartmentSchema,
  createTransferRequestSchema,
  getAdminReportByIdSchema,
  listAdminReportsSchema,
  listOfficeAdminsSchema,
  listTransferRequestsSchema,
  rejectTransferRequestSchema,
  reviewTransferRequestSchema,
  updateAdminReportSchema,
} from "./admin.schema.js";
import { USER_ROLES } from "../../shared/auth/roleAccess.js";

const adminRouter = Router();

adminRouter.use(requireAuth, loadActorProfile);

adminRouter.get(
  "/reports",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(listAdminReportsSchema),
  asyncHandler(adminController.listReports),
);

adminRouter.get(
  "/reports/:reportId",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getAdminReportByIdSchema),
  asyncHandler(adminController.getReportById),
);

adminRouter.patch(
  "/reports/:reportId",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(updateAdminReportSchema),
  asyncHandler(adminController.updateReport),
);

adminRouter.get(
  "/transfer-requests",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(listTransferRequestsSchema),
  asyncHandler(adminController.listTransferRequests),
);

adminRouter.post(
  "/transfer-requests",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(createTransferRequestSchema),
  asyncHandler(adminController.createTransferRequest),
);

adminRouter.patch(
  "/transfer-requests/:id/approve",
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(reviewTransferRequestSchema),
  asyncHandler(adminController.approveTransferRequest),
);

adminRouter.patch(
  "/transfer-requests/:id/reject",
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(rejectTransferRequestSchema),
  asyncHandler(adminController.rejectTransferRequest),
);

adminRouter.get(
  "/office-admins",
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(listOfficeAdminsSchema),
  asyncHandler(adminController.listOfficeAdmins),
);

adminRouter.patch(
  "/office-admins/:adminId/department",
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(assignOfficeDepartmentSchema),
  asyncHandler(adminController.assignOfficeDepartment),
);

export { adminRouter };
