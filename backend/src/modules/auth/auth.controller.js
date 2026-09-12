import { StatusCodes } from "http-status-codes";
import { authService } from "./auth.service.js";

export const authController = {
  async register(req, res) {
    const result = await authService.register(req.body);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  },

  async login(req, res) {
    const result = await authService.login(req.body, req.perf);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async forgotPassword(req, res) {
    const result = await authService.forgotPassword(req.body.email);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async resetPassword(req, res) {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async requestOtp(req, res) {
    const result = await authService.requestOtp(req.body.email);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  },

  async verifyOtp(req, res) {
    const { email, otp } = req.body;
    const result = await authService.verifyOtp(email, otp);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  },

  async resetPasswordWithOtp(req, res) {
    const { resetToken, password } = req.body;
    const result = await authService.resetPasswordWithOtp(resetToken, password);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  },

  async activateAccount(req, res) {
    const result = await authService.activateAccount(req.body);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async me(req, res) {
    const result = await authService.me(req.user, req.accessToken);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async logout(_req, res) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  },

  async changePassword(req, res) {
    const result = await authService.changePassword(req.user, req.body);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async createGuestSession(req, res) {
    const result = await authService.createGuestSession(req.body?.guestId);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  },
};
