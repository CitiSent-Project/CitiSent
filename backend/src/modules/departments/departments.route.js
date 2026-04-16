import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { loadActorProfile, requireRole } from "../../middlewares/actor.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { USER_ROLES } from "../../shared/auth/roleAccess.js";
import { departmentsController } from "./departments.controller.js";
import {
  createDepartmentSchema,
  deleteDepartmentSchema,
  listDepartmentsSchema,
  setDepartmentActiveSchema,
  updateDepartmentSchema,
} from "./departments.schema.js";

const departmentsRouter = Router();

// Public active departments list used by unauthenticated flows.
departmentsRouter.get(
  "/",
  validateRequest(listDepartmentsSchema),
  asyncHandler(departmentsController.listDepartments),
);

// Superadmin catalog routes include inactive departments for management.
departmentsRouter.get(
  "/catalog",
  requireAuth,
  loadActorProfile,
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(listDepartmentsSchema),
  asyncHandler(departmentsController.listDepartments),
);

departmentsRouter.post(
  "/",
  requireAuth,
  loadActorProfile,
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(createDepartmentSchema),
  asyncHandler(departmentsController.createDepartment),
);

departmentsRouter.patch(
  "/:departmentSlug",
  requireAuth,
  loadActorProfile,
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(updateDepartmentSchema),
  asyncHandler(departmentsController.updateDepartment),
);

departmentsRouter.patch(
  "/:departmentSlug/active",
  requireAuth,
  loadActorProfile,
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(setDepartmentActiveSchema),
  asyncHandler(departmentsController.setDepartmentActive),
);

departmentsRouter.delete(
  "/:departmentSlug",
  requireAuth,
  loadActorProfile,
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(deleteDepartmentSchema),
  asyncHandler(departmentsController.deleteDepartment),
);

export { departmentsRouter };