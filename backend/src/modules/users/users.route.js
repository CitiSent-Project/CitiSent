import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { usersController } from "./users.controller.js";
import {
  deleteCurrentUserSchema,
  getCurrentUserSchema,
  updateCurrentUserSchema,
} from "./users.schema.js";

const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  validateRequest(getCurrentUserSchema),
  asyncHandler(usersController.getCurrentUser),
);

usersRouter.patch(
  "/me",
  requireAuth,
  validateRequest(updateCurrentUserSchema),
  asyncHandler(usersController.updateCurrentUser),
);

usersRouter.delete(
  "/me",
  requireAuth,
  validateRequest(deleteCurrentUserSchema),
  asyncHandler(usersController.deleteCurrentUser),
);

export { usersRouter };
