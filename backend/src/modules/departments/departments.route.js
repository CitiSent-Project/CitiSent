import { Router } from "express";
import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { loadActorProfile, requireRole } from "../../middlewares/actor.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { USER_ROLES } from "../../shared/auth/roleAccess.js";
import { AppError } from "../../shared/errors/appError.js";
import { departmentsController } from "./departments.controller.js";
import {
  createDepartmentSchema,
  departmentLogoSchema,
  deleteDepartmentSchema,
  listDepartmentsSchema,
  setDepartmentActiveSchema,
  updateDepartmentSchema,
} from "./departments.schema.js";

const departmentsRouter = Router();
const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024;
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_LOGO_UPLOAD_BYTES,
    files: 1,
  },
}).single("logo");

function parseDepartmentLogoUpload(req, res, next) {
  logoUpload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError("Logo image must be 2MB or smaller.", StatusCodes.BAD_REQUEST),
      );
    }

    return next(
      new AppError("Unable to read uploaded logo image.", StatusCodes.BAD_REQUEST, {
        message: error.message,
      }),
    );
  });
}

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

departmentsRouter.patch(
  "/:departmentSlug/logo",
  requireAuth,
  loadActorProfile,
  requireRole([USER_ROLES.SUPERADMIN]),
  parseDepartmentLogoUpload,
  validateRequest(departmentLogoSchema),
  asyncHandler(departmentsController.updateDepartmentLogo),
);

departmentsRouter.delete(
  "/:departmentSlug/logo",
  requireAuth,
  loadActorProfile,
  requireRole([USER_ROLES.SUPERADMIN]),
  validateRequest(departmentLogoSchema),
  asyncHandler(departmentsController.deleteDepartmentLogo),
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
