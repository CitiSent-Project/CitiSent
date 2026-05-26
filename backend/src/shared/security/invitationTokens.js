import crypto from "crypto";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { AppError } from "../errors/appError.js";

const ACCOUNT_ACTIVATION_PURPOSE = "account_activation";
const ACTIVATION_TOKEN_TTL = "24h";

function requireInvitationSecret() {
  if (!env.INVITATION_JWT_SECRET) {
    throw new AppError(
      "Account invitations are not configured. Set INVITATION_JWT_SECRET.",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }

  return env.INVITATION_JWT_SECRET;
}

export function hashInvitationTokenId(tokenId) {
  return crypto.createHash("sha256").update(String(tokenId)).digest("hex");
}

export function createAccountActivationToken({ userId, email }) {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    {
      email,
      purpose: ACCOUNT_ACTIVATION_PURPOSE,
      jti: tokenId,
    },
    requireInvitationSecret(),
    {
      subject: userId,
      expiresIn: ACTIVATION_TOKEN_TTL,
    },
  );

  return {
    token,
    tokenId,
    tokenHash: hashInvitationTokenId(tokenId),
  };
}

export function verifyAccountActivationToken(token) {
  try {
    const payload = jwt.verify(token, requireInvitationSecret());

    if (payload?.purpose !== ACCOUNT_ACTIVATION_PURPOSE) {
      throw new AppError("This setup link is not valid.", StatusCodes.BAD_REQUEST);
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
        ? "This setup link has expired. Please contact an administrator for a new invitation."
        : "This setup link is not valid.",
      StatusCodes.BAD_REQUEST,
      error,
    );
  }
}
