import test from "node:test";
import assert from "node:assert/strict";
import { authService } from "./auth.service.js";
import { authRepository } from "./auth.repository.js";
import { otpStore_ } from "../../shared/security/otp.store.js";
import {
  maskEmail,
  classifyAndSanitizeSmtpError,
  requireSmtpConfig,
  requireWebUrlConfig,
  mailerService,
} from "../../shared/email/mailer.js";
import { logger } from "../../config/logger.js";

test("maskEmail correctly masks local parts and preserves domains", () => {
  assert.equal(maskEmail("marcdarrenguev08@gmail.com"), "m**************8@gmail.com");
  assert.equal(maskEmail("ab@gmail.com"), "a*@gmail.com");
  assert.equal(maskEmail("a@gmail.com"), "a*@gmail.com");
  assert.equal(maskEmail("citizen.user@citisent.gov.ph"), "c**********r@citisent.gov.ph");
  assert.equal(maskEmail(""), "***");
  assert.equal(maskEmail(null), "***");
});

test("classifyAndSanitizeSmtpError accurately classifies errors without leaking secrets", () => {
  const authErr = classifyAndSanitizeSmtpError({
    code: "EAUTH",
    responseCode: 535,
    message: "535-5.7.8 Username and Password not accepted",
  });
  assert.equal(authErr.category, "AUTHENTICATION_FAILED");
  assert.ok(authErr.diagnostic.includes("Google App Password"));

  const timeoutErr = classifyAndSanitizeSmtpError({
    code: "ETIMEDOUT",
    message: "Connection timeout",
  });
  assert.equal(timeoutErr.category, "CONNECTION_TIMEOUT");

  const unreachErr = classifyAndSanitizeSmtpError({
    code: "ENETUNREACH",
    message: "connect ENETUNREACH 2404:6800:4003:c06::6d:587",
  });
  assert.equal(unreachErr.category, "NETWORK_UNREACHABLE");

  const rejectedErr = classifyAndSanitizeSmtpError({
    responseCode: 550,
    message: "550 5.1.1 User unknown",
  });
  assert.equal(rejectedErr.category, "RECIPIENT_REJECTED");
});

test("requireSmtpConfig allows sending OTP even if WEB_APP_BASE_URL is not set", () => {
  // Verifies decoupling: requireSmtpConfig only needs GMAIL_USER & GMAIL_APP_PASSWORD
  assert.doesNotThrow(() => {
    requireSmtpConfig();
  });
});

test("requestOtp returns { sent: true } on non-existent account without leaking existence", async (t) => {
  const origGetProfile = authRepository.getProfileByEmail;
  t.after(() => {
    authRepository.getProfileByEmail = origGetProfile;
  });

  authRepository.getProfileByEmail = async () => null;

  const result = await authService.requestOtp("unknown-account-123@example.com");
  assert.deepEqual(result, { sent: true });
});

test("requestOtp sends OTP email successfully for registered user", async (t) => {
  const testEmail = "registered-citizen@example.com";
  const origGetProfile = authRepository.getProfileByEmail;
  const origSendOtp = mailerService.sendOtpEmail;
  t.after(() => {
    authRepository.getProfileByEmail = origGetProfile;
    mailerService.sendOtpEmail = origSendOtp;
    otpStore_.deleteOtp(testEmail);
    otpStore_.rollbackSendRateLimit(testEmail);
  });

  let sentPayload = null;
  authRepository.getProfileByEmail = async () => ({
    user_id: "user-123-uuid",
    email: testEmail,
    fname: "Maria",
  });

  mailerService.sendOtpEmail = async (payload) => {
    sentPayload = payload;
    return { messageId: "test-msg-123" };
  };

  const result = await authService.requestOtp(testEmail);
  assert.deepEqual(result, { sent: true });
  assert.ok(sentPayload);
  assert.equal(sentPayload.toEmail, testEmail);
  assert.equal(sentPayload.recipientName, "Maria");
  assert.match(sentPayload.otp, /^\d{6}$/);
});

test("requestOtp handles provider timeout with sanitized log, rate limit rollback, and 503 AppError", async (t) => {
  const testEmail = "timeout-test@example.com";
  const origGetProfile = authRepository.getProfileByEmail;
  const origSendOtp = mailerService.sendOtpEmail;
  const origLoggerError = logger.error;

  let loggedError = null;
  logger.error = (msg, meta) => {
    loggedError = { msg, meta };
  };

  t.after(() => {
    authRepository.getProfileByEmail = origGetProfile;
    mailerService.sendOtpEmail = origSendOtp;
    logger.error = origLoggerError;
    otpStore_.deleteOtp(testEmail);
    otpStore_.rollbackSendRateLimit(testEmail);
  });

  authRepository.getProfileByEmail = async () => ({
    user_id: "user-timeout-test",
    email: testEmail,
    fname: "Timeout",
  });

  mailerService.sendOtpEmail = async () => {
    const err = new Error("Connection timeout");
    err.code = "ETIMEDOUT";
    throw err;
  };

  await assert.rejects(
    async () => {
      await authService.requestOtp(testEmail);
    },
    (err) => {
      assert.equal(err.statusCode, 503);
      assert.equal(err.message, "Failed to deliver verification code email. Please try again.");
      return true;
    },
  );

  assert.ok(loggedError);
  assert.equal(loggedError.meta.category, "CONNECTION_TIMEOUT");
  assert.ok(!loggedError.meta.recipient.includes("timeout-test")); // verifies email is masked
});

test("requestOtp handles provider authentication failure with sanitized log and 503 AppError", async (t) => {
  const testEmail = "auth-fail@example.com";
  const origGetProfile = authRepository.getProfileByEmail;
  const origSendOtp = mailerService.sendOtpEmail;
  const origLoggerError = logger.error;

  let loggedError = null;
  logger.error = (msg, meta) => {
    loggedError = { msg, meta };
  };

  t.after(() => {
    authRepository.getProfileByEmail = origGetProfile;
    mailerService.sendOtpEmail = origSendOtp;
    logger.error = origLoggerError;
    otpStore_.deleteOtp(testEmail);
    otpStore_.rollbackSendRateLimit(testEmail);
  });

  authRepository.getProfileByEmail = async () => ({
    user_id: "user-auth-fail",
    email: testEmail,
    fname: "AuthFail",
  });

  mailerService.sendOtpEmail = async () => {
    const err = new Error("535-5.7.8 Username and Password not accepted");
    err.code = "EAUTH";
    err.responseCode = 535;
    throw err;
  };

  await assert.rejects(
    async () => {
      await authService.requestOtp(testEmail);
    },
    (err) => {
      assert.equal(err.statusCode, 503);
      assert.equal(err.message, "Failed to deliver verification code email. Please try again.");
      return true;
    },
  );

  assert.ok(loggedError);
  assert.equal(loggedError.meta.category, "AUTHENTICATION_FAILED");
});

test("requestOtp enforces rate limits and returns 429", async (t) => {
  const testEmail = "rate-limited@example.com";
  const origGetProfile = authRepository.getProfileByEmail;
  const origSendOtp = mailerService.sendOtpEmail;

  t.after(() => {
    authRepository.getProfileByEmail = origGetProfile;
    mailerService.sendOtpEmail = origSendOtp;
    otpStore_.deleteOtp(testEmail);
    otpStore_.rollbackSendRateLimit(testEmail);
  });

  authRepository.getProfileByEmail = async () => ({
    user_id: "user-ratelimit",
    email: testEmail,
    fname: "RateLimit",
  });

  mailerService.sendOtpEmail = async () => ({ messageId: "test-ok" });

  // Send up to SEND_RATE_MAX (3) requests
  await authService.requestOtp(testEmail);
  await authService.requestOtp(testEmail);
  await authService.requestOtp(testEmail);

  // 4th request exceeds the SEND_RATE_MAX limit and must fail with 429
  await assert.rejects(
    async () => {
      await authService.requestOtp(testEmail);
    },
    (err) => {
      assert.equal(err.statusCode, 429);
      assert.ok(err.message.toLowerCase().includes("please wait"));
      return true;
    },
  );
});
