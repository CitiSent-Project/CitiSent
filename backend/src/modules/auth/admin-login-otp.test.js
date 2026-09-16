import test from "node:test";
import assert from "node:assert/strict";
import { authService } from "./auth.service.js";
import { authRepository } from "./auth.repository.js";
import { otpStore_ } from "../../shared/security/otp.store.js";
import { mailerService } from "../../shared/email/mailer.js";

test("admin login 2FA: rejects invalid email address format", async () => {
  await assert.rejects(
    async () => {
      await authService.initiateAdminLogin({
        identifier: "invalid-email@",
        password: "SecretPassword123!",
      });
    },
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /valid email address/i);
      return true;
    },
  );
});

test("admin login 2FA: rejects when user does not exist as an admin", async (t) => {
  const origGetProfileByEmail = authRepository.getProfileByEmail;
  t.after(() => {
    authRepository.getProfileByEmail = origGetProfileByEmail;
  });

  authRepository.getProfileByEmail = async () => null;

  await assert.rejects(
    async () => {
      await authService.initiateAdminLogin({
        email: "nonexistent.admin@citisent.gov.ph",
        password: "SecretPassword123!",
      });
    },
    (err) => {
      assert.equal(err.statusCode, 401);
      assert.equal(
        err.message,
        "This account does not exist as an office admin or super admin.",
      );
      return true;
    },
  );
});

test("admin login 2FA: rejects when account is a citizen (non-admin role)", async (t) => {
  const origGetProfileByEmail = authRepository.getProfileByEmail;
  t.after(() => {
    authRepository.getProfileByEmail = origGetProfileByEmail;
  });

  authRepository.getProfileByEmail = async () => ({
    user_id: "citizen-uuid-1",
    email: "citizen.user@example.com",
    role: "citizen",
    account_type: "citizen",
    account_status: "active",
    activation_status: "active",
  });

  await assert.rejects(
    async () => {
      await authService.initiateAdminLogin({
        email: "citizen.user@example.com",
        password: "SecretPassword123!",
      });
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(
        err.message,
        "This account does not exist as an office admin or super admin.",
      );
      return true;
    },
  );
});

test("admin login 2FA: rejects if admin account is banned", async (t) => {
  const origGetProfileByEmail = authRepository.getProfileByEmail;
  t.after(() => {
    authRepository.getProfileByEmail = origGetProfileByEmail;
  });

  authRepository.getProfileByEmail = async () => ({
    user_id: "banned-admin-uuid",
    email: "banned.admin@citisent.gov.ph",
    role: "Office Admin",
    account_type: "admin",
    account_status: "banned",
  });

  await assert.rejects(
    async () => {
      await authService.initiateAdminLogin({
        email: "banned.admin@citisent.gov.ph",
        password: "SecretPassword123!",
      });
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.match(err.message, /banned/i);
      return true;
    },
  );
});

test("admin login 2FA: rejects when password is incorrect", async (t) => {
  const origGetProfileByEmail = authRepository.getProfileByEmail;
  const origLoginWithEmailPassword = authRepository.loginWithEmailPassword;
  t.after(() => {
    authRepository.getProfileByEmail = origGetProfileByEmail;
    authRepository.loginWithEmailPassword = origLoginWithEmailPassword;
  });

  authRepository.getProfileByEmail = async () => ({
    user_id: "admin-uuid-1",
    email: "admin@citisent.gov.ph",
    role: "Office Admin",
    account_type: "admin",
    account_status: "active",
    activation_status: "active",
  });

  authRepository.loginWithEmailPassword = async () => {
    const err = new Error("Invalid login credentials");
    err.status = 400;
    throw err;
  };

  await assert.rejects(
    async () => {
      await authService.initiateAdminLogin({
        email: "admin@citisent.gov.ph",
        password: "WrongPassword!",
      });
    },
    (err) => {
      assert.equal(err.statusCode, 401);
      assert.match(err.message, /incorrect password/i);
      return true;
    },
  );
});

test("admin login 2FA: full success flow (challenge -> verify OTP -> returns session)", async (t) => {
  const testEmail = "superadmin@citisent.gov.ph";
  const origGetProfileByEmail = authRepository.getProfileByEmail;
  const origLoginWithEmailPassword = authRepository.loginWithEmailPassword;
  const origSendLoginOtp = mailerService.sendLoginOtpEmail;

  let dispatchedOtp = null;

  t.after(() => {
    authRepository.getProfileByEmail = origGetProfileByEmail;
    authRepository.loginWithEmailPassword = origLoginWithEmailPassword;
    mailerService.sendLoginOtpEmail = origSendLoginOtp;
    otpStore_.deleteOtp(testEmail);
    otpStore_.rollbackSendRateLimit(testEmail);
  });

  authRepository.getProfileByEmail = async () => ({
    user_id: "superadmin-uuid-1",
    email: testEmail,
    role: "Superadmin",
    account_type: "admin",
    account_status: "active",
    activation_status: "active",
    fname: "Super",
    lname: "Admin",
  });

  authRepository.loginWithEmailPassword = async () => ({
    user: { id: "superadmin-uuid-1", email: testEmail },
    session: { access_token: "mock-supabase-jwt-session-token" },
  });

  mailerService.sendLoginOtpEmail = async ({ toEmail, otp }) => {
    dispatchedOtp = otp;
    return { sent: true };
  };

  // Step 1: Challenge
  const challengeResult = await authService.initiateAdminLogin({
    email: testEmail,
    password: "CorrectPassword123!",
  });

  assert.equal(challengeResult.requireOtp, true);
  assert.ok(challengeResult.tempToken);
  assert.equal(challengeResult.email, testEmail);
  assert.match(dispatchedOtp, /^\d{6}$/);

  // Step 2: Failed OTP verification attempt
  await assert.rejects(
    async () => {
      await authService.verifyAdminLoginOtp({
        tempToken: challengeResult.tempToken,
        otp: "000000",
      });
    },
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /incorrect otp/i);
      return true;
    },
  );

  // Step 3: Resend OTP
  const resendResult = await authService.resendAdminLoginOtp({
    tempToken: challengeResult.tempToken,
  });
  assert.equal(resendResult.sent, true);
  assert.equal(resendResult.resendCooldownSeconds, 60);

  // Step 4: Correct OTP verification
  const verifyResult = await authService.verifyAdminLoginOtp({
    tempToken: challengeResult.tempToken,
    otp: dispatchedOtp,
  });

  assert.equal(verifyResult.token, "mock-supabase-jwt-session-token");
  assert.equal(verifyResult.user.email, testEmail);
  assert.equal(verifyResult.user.role, "Superadmin");
  assert.equal(verifyResult.user.accountType, "admin");
});
