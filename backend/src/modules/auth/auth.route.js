import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { requireAuth } from "../../middlewares/auth.js";
import {
  activateAccountSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  meSchema,
  registerSchema,
  requestOtpSchema,
  resetPasswordSchema,
  resetPasswordWithOtpSchema,
  sendGuestOtpSchema,
  verifyGuestOtpSchema,
  verifyOtpSchema,
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

authRouter.post(
  "/change-password",
  requireAuth,
  validateRequest(changePasswordSchema),
  asyncHandler(authController.changePassword),
);

// OTP-based forgot-password routes (mobile)
authRouter.post(
  "/request-otp",
  validateRequest(requestOtpSchema),
  asyncHandler(authController.requestOtp),
);

authRouter.post(
  "/verify-otp",
  validateRequest(verifyOtpSchema),
  asyncHandler(authController.verifyOtp),
);

authRouter.post(
  "/reset-password-otp",
  validateRequest(resetPasswordWithOtpSchema),
  asyncHandler(authController.resetPasswordWithOtp),
);

// Guest authentication & phone OTP verification routes
authRouter.post(
  "/guest",
  asyncHandler(authController.createGuestSession),
);

authRouter.post(
  "/guest/send-otp",
  validateRequest(sendGuestOtpSchema),
  asyncHandler(authController.sendGuestOtp),
);

authRouter.post(
  "/guest/verify-otp",
  validateRequest(verifyGuestOtpSchema),
  asyncHandler(authController.verifyGuestOtp),
);

export { authRouter };

