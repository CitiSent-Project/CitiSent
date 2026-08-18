import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { loadActorProfile, requireRole } from "../../middlewares/actor.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { adminController } from "./admin.controller.js";
import { adminActivityRouter } from "./activity/activity.route.js";
import { adminNotificationsRouter } from "./notifications/notifications.route.js";
import {
  banAdminUserSchema,
  assignOfficeDepartmentSchema,
  createAdminUserSchema,
  createTransferRequestSchema,
  getDashboardRecentAdminsSchema,
  getDashboardRecentUsersSchema,
  getDashboardReportsByCategorySchema,
  getDashboardReportsByStatusSchema,
  getDashboardSummarySchema,
  getDashboardWeeklyTrendSchema,
  getAdminReportByIdSchema,
  getAdminNoteSuggestionsSchema,
  getAdminUserByIdSchema,
  listAdminReportsSchema,
  listAdminConversationsSchema,
  listAdminUsersSchema,
  listOfficeAdminsSchema,
  listTransferRequestsSchema,
  rejectTransferRequestSchema,
  reviewTransferRequestSchema,
  unbanAdminUserSchema,
  updateAdminReportSchema,
  updateAdminUserSchema,
} from "./admin.schema.js";
import { USER_ROLES } from "../../shared/auth/roleAccess.js";

const adminRouter = Router();

adminRouter.use(requireAuth, loadActorProfile);
adminRouter.use(adminActivityRouter);
adminRouter.use(adminNotificationsRouter);

adminRouter.get(
  "/users",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(listAdminUsersSchema),
  asyncHandler(adminController.listUsers),
);

adminRouter.get(
  "/users/:userId",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getAdminUserByIdSchema),
  asyncHandler(adminController.getUserById),
);

adminRouter.post(
  "/users",
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(createAdminUserSchema),
  asyncHandler(adminController.createUser),
);

adminRouter.patch(
  "/users/:userId",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(updateAdminUserSchema),
  asyncHandler(adminController.updateUser),
);

adminRouter.patch(
  "/users/:userId/ban",
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(banAdminUserSchema),
  asyncHandler(adminController.banUser),
);

adminRouter.patch(
  "/users/:userId/unban",
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(unbanAdminUserSchema),
  asyncHandler(adminController.unbanUser),
);

adminRouter.get(
  "/reports",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(listAdminReportsSchema),
  asyncHandler(adminController.listReports),
);

adminRouter.get(
  "/conversations",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(listAdminConversationsSchema),
  asyncHandler(adminController.listConversations),
);

adminRouter.get(
  "/reports/:reportId",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getAdminReportByIdSchema),
  asyncHandler(adminController.getReportById),
);

adminRouter.get(
  "/reports/:reportId/admin-note-suggestions",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getAdminNoteSuggestionsSchema),
  asyncHandler(adminController.getAdminNoteSuggestions),
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

adminRouter.get(
  "/dashboard/summary",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getDashboardSummarySchema),
  asyncHandler(adminController.getDashboardSummary),
);

adminRouter.get(
  "/dashboard/reports/status",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getDashboardReportsByStatusSchema),
  asyncHandler(adminController.getDashboardReportsByStatus),
);

adminRouter.get(
  "/dashboard/reports/category",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getDashboardReportsByCategorySchema),
  asyncHandler(adminController.getDashboardReportsByCategory),
);

adminRouter.get(
  "/dashboard/reports/weekly-trend",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getDashboardWeeklyTrendSchema),
  asyncHandler(adminController.getDashboardWeeklyTrend),
);

adminRouter.get(
  "/dashboard/admins/recent",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getDashboardRecentAdminsSchema),
  asyncHandler(adminController.getDashboardRecentAdmins),
);

adminRouter.get(
  "/dashboard/users/recent",
  requireRole([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]),
  validateRequest(getDashboardRecentUsersSchema),
  asyncHandler(adminController.getDashboardRecentUsers),
);

export { adminRouter };
