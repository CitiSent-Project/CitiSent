import crypto from "crypto";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { AppError } from "../errors/appError.js";

const PASSWORD_RESET_PURPOSE = "password_reset";
const RESET_TOKEN_TTL = "1h";

function requireResetSecret() {
  if (!env.INVITATION_JWT_SECRET) {
    throw new AppError(
      "Password reset is not configured. Set INVITATION_JWT_SECRET.",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }

  return env.INVITATION_JWT_SECRET;
}

export function hashResetTokenId(tokenId) {
  return crypto.createHash("sha256").update(String(tokenId)).digest("hex");
}

export function createPasswordResetToken({ userId, email }) {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    {
      email,
      purpose: PASSWORD_RESET_PURPOSE,
      jti: tokenId,
    },
    requireResetSecret(),
    {
      subject: userId,
      expiresIn: RESET_TOKEN_TTL,
    },
  );

  return {
    token,
    tokenId,
    tokenHash: hashResetTokenId(tokenId),
  };
}

export function verifyPasswordResetToken(token) {
  try {
    const payload = jwt.verify(token, requireResetSecret());

    if (payload?.purpose !== PASSWORD_RESET_PURPOSE) {
      throw new AppError("This reset link is not valid.", StatusCodes.BAD_REQUEST);
    }

    return {
      userId: String(payload.sub || ""),
      email: String(payload.email || "").trim().toLowerCase(),
      tokenId: String(payload.jti || ""),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const isExpired = error?.name === "TokenExpiredError";
    throw new AppError(
      isExpired
        ? "This reset link has expired. Please request a new one."
        : "This reset link is not valid.",
      StatusCodes.BAD_REQUEST,
      error,
    );
  }
}
