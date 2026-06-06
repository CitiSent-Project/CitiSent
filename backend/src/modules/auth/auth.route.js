import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { requireAuth } from "../../middlewares/auth.js";
import {
  activateAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  meSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import { authController } from "./auth.controller.js";

const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(authController.register),
);

authRouter.post(
  "/login",
  validateRequest(loginSchema),
  asyncHandler(authController.login),
);

authRouter.post(
  "/request-password-reset",
  validateRequest(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

authRouter.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

authRouter.post(
  "/activate-account",
  validateRequest(activateAccountSchema),
  asyncHandler(authController.activateAccount),
);

authRouter.get(
  "/me",
  requireAuth,
  validateRequest(meSchema),
  asyncHandler(authController.me),
);

authRouter.post("/logout", asyncHandler(authController.logout));

export { authRouter };
