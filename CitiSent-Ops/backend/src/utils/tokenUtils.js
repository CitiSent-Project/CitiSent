import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ACCOUNT_ACTIVATION_PURPOSE = "account_activation";
const ACTIVATION_TOKEN_TTL = "24h";

export function hashInvitationTokenId(tokenId) {
  return crypto.createHash("sha256").update(String(tokenId)).digest("hex");
}

export function createSuperadminActivationToken({ userId, email }) {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    {
      email,
      purpose: ACCOUNT_ACTIVATION_PURPOSE,
      jti: tokenId,
    },
    env.INVITATION_JWT_SECRET,
    {
      subject: userId,
      expiresIn: ACTIVATION_TOKEN_TTL,
    }
  );

  return {
    token,
    tokenId,
    tokenHash: hashInvitationTokenId(tokenId),
  };
}
