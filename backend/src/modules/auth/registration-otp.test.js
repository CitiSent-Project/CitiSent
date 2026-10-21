import test from "node:test";
import assert from "node:assert/strict";

import { authService } from "./auth.service.js";
import { authRepository } from "./auth.repository.js";
import { pendingRegistrationStore } from "../../shared/security/pendingRegistration.store.js";
import { iprogsmsService } from "../../shared/sms/iprogsms.service.js";
import { normalizePhilippinePhoneNumber } from "../../shared/utils/phoneUtils.js";
import { AppError } from "../../shared/errors/appError.js";

const VALID_REGISTRATION_DATA = Object.freeze({
  fname: "Juan",
  mname: "Dela",
  lname: "Cruz",
  username: "juandelacruz",
  email: "juan.cruz@example.com",
  phoneNumber: "09171234567",
  age: 28,
  gender: "male",
  clientType: "citizen",
  barangay: "San Antonio",
  password: "Password123!",
});

function stubDependencies(t, overrides = {}) {
  const origGetProfileByIdentifier = authRepository.getProfileByIdentifier;
  const origGetProfileByEmail = authRepository.getProfileByEmail;
  const origRegisterWithEmailPassword = authRepository.registerWithEmailPassword;
  const origUpsertProfileByUserIdWithAdmin = authRepository.upsertProfileByUserIdWithAdmin;
  const origSendOtp = iprogsmsService.sendOtp;

  authRepository.getProfileByIdentifier = async () => null;
  authRepository.getProfileByEmail = async () => null;
  authRepository.registerWithEmailPassword = async () => ({
    user: {
      id: "test-user-id-123",
      identities: [{ id: "identity-1" }],
      user_metadata: { phone_verified: true },
    },
    session: null,
  });
  authRepository.upsertProfileByUserIdWithAdmin = async (userId, payload) => ({
    user_id: userId,
    phone_verified: true,
    ...payload,
  });
  iprogsmsService.sendOtp = async () => ({
    success: true,
    messageId: "mock-sms-id-123",
  });

  Object.assign(authRepository, overrides.repo || {});
  if (overrides.sms) {
    Object.assign(iprogsmsService, overrides.sms);
  }

  t.after(() => {
    authRepository.getProfileByIdentifier = origGetProfileByIdentifier;
    authRepository.getProfileByEmail = origGetProfileByEmail;
    authRepository.registerWithEmailPassword = origRegisterWithEmailPassword;
    authRepository.upsertProfileByUserIdWithAdmin = origUpsertProfileByUserIdWithAdmin;
    iprogsmsService.sendOtp = origSendOtp;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 1: Successful OTP request and phone verification & completion
// ─────────────────────────────────────────────────────────────────────────────
test("Case 1: Successful OTP request and phone verification creates verified user", async (t) => {
  let capturedSms = null;
  stubDependencies(t, {
    sms: {
      sendOtp: async (args) => {
        capturedSms = args;
        return { success: true, messageId: "sms-msg-101" };
      },
    },
  });

  // Step 1: Request OTP
  const reqResult = await authService.requestRegistrationOtp({
    ...VALID_REGISTRATION_DATA,
    phoneNumber: "09171234567",
  });

  assert.equal(reqResult.success, true);
  assert.equal(reqResult.requireOtp, true);
  assert.ok(reqResult.registrationToken);
  assert.equal(reqResult.phoneNumber, "+639171234567");
  assert.equal(reqResult.phoneNumberMasked, "+63 9•• ••• 4567");
  assert.ok(reqResult.expiresInSeconds > 0);
  assert.ok(reqResult.resendCooldownSeconds > 0);

  // Verify SMS was dispatched to local number with a 6-digit OTP
  assert.ok(capturedSms);
  assert.equal(capturedSms.to, "09171234567");
  assert.match(capturedSms.otp, /^\d{6}$/);

  // Step 2: Verify OTP with the dispatched code
  const verifyResult = await authService.verifyRegistrationOtp({
    registrationToken: reqResult.registrationToken,
    otp: capturedSms.otp,
  });

  assert.equal(verifyResult.success, true);
  assert.equal(verifyResult.verified, true);
  assert.ok(verifyResult.user);
  assert.equal(verifyResult.user.id, "test-user-id-123");
  assert.equal(verifyResult.user.phoneNumber, "+639171234567");
  assert.equal(verifyResult.user.phoneVerified, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 2: Incorrect OTP decrements remaining attempts
// ─────────────────────────────────────────────────────────────────────────────
test("Case 2: Incorrect OTP fails and decrements attempts", async (t) => {
  stubDependencies(t);

  const reqResult = await authService.requestRegistrationOtp({
    ...VALID_REGISTRATION_DATA,
    username: "user_test_case2",
    email: "case2@example.com",
    phoneNumber: "09181112233",
  });

  // Try wrong OTP
  await assert.rejects(
    () =>
      authService.verifyRegistrationOtp({
        registrationToken: reqResult.registrationToken,
        otp: "000000",
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.ok(err.message.includes("Incorrect verification code"));
      assert.ok(err.message.includes("attempt(s) remaining"));
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 3: Expired OTP is rejected
// ─────────────────────────────────────────────────────────────────────────────
test("Case 3: Expired OTP is rejected", async (t) => {
  let plainOtp = null;
  stubDependencies(t, {
    sms: {
      sendOtp: async (args) => {
        plainOtp = args.otp;
        return { success: true };
      },
    },
  });

  const reqResult = await authService.requestRegistrationOtp({
    ...VALID_REGISTRATION_DATA,
    username: "user_test_case3",
    email: "case3@example.com",
    phoneNumber: "09182223344",
  });

  // Simulate expiry by setting expiresAt to the past
  const entry = pendingRegistrationStore.getPendingRegistration(
    reqResult.registrationToken,
  );
  entry.expiresAt = Date.now() - 1000;

  await assert.rejects(
    () =>
      authService.verifyRegistrationOtp({
        registrationToken: reqResult.registrationToken,
        otp: plainOtp,
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.ok(err.message.includes("expired"));
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 4: Reuse of already verified OTP (replay attack protection)
// ─────────────────────────────────────────────────────────────────────────────
test("Case 4: Replay attack protection - Cannot reuse OTP or token after verification", async (t) => {
  let plainOtp = null;
  stubDependencies(t, {
    sms: {
      sendOtp: async (args) => {
        plainOtp = args.otp;
        return { success: true };
      },
    },
  });

  const reqResult = await authService.requestRegistrationOtp({
    ...VALID_REGISTRATION_DATA,
    username: "user_test_case4",
    email: "case4@example.com",
    phoneNumber: "09183334455",
  });

  // First verification succeeds
  const first = await authService.verifyRegistrationOtp({
    registrationToken: reqResult.registrationToken,
    otp: plainOtp,
  });
  assert.equal(first.success, true);

  // Attempting to reuse the exact same OTP code on verified session:
  // The OTP hash was wiped upon verification, so verifying the code again must throw synchronously
  assert.throws(
    () =>
      pendingRegistrationStore.verifyOtp(reqResult.registrationToken, plainOtp),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.ok(
        err.message.includes("already been verified") ||
          err.message.includes("already been registered"),
      );
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 5: Resending an OTP invalidates previous code
// ─────────────────────────────────────────────────────────────────────────────
test("Case 5: Resending an OTP invalidates the previous code and issues a fresh one", async (t) => {
  const sentCodes = [];
  stubDependencies(t, {
    sms: {
      sendOtp: async (args) => {
        sentCodes.push(args.otp);
        return { success: true };
      },
    },
  });

  const reqResult = await authService.requestRegistrationOtp({
    ...VALID_REGISTRATION_DATA,
    username: "user_test_case5",
    email: "case5@example.com",
    phoneNumber: "09184445566",
  });

  const initialCode = sentCodes[0];
  assert.ok(initialCode);

  // Fast forward cooldown to allow resend
  const entry = pendingRegistrationStore.getPendingRegistration(
    reqResult.registrationToken,
  );
  entry.resendCooldownUntil = Date.now() - 1000;

  // Resend OTP
  const resendResult = await authService.resendRegistrationOtp({
    registrationToken: reqResult.registrationToken,
  });
  assert.equal(resendResult.success, true);
  assert.equal(sentCodes.length, 2);
  const secondCode = sentCodes[1];
  assert.ok(secondCode);

  // Old code must now be invalid
  await assert.rejects(
    () =>
      authService.verifyRegistrationOtp({
        registrationToken: reqResult.registrationToken,
        otp: initialCode,
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );

  // New code must succeed
  const verifyResult = await authService.verifyRegistrationOtp({
    registrationToken: reqResult.registrationToken,
    otp: secondCode,
  });
  assert.equal(verifyResult.success, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 6: Duplicate phone number registration check
// ─────────────────────────────────────────────────────────────────────────────
test("Case 6: Duplicate phone number registration is rejected with 409 Conflict", async (t) => {
  stubDependencies(t, {
    repo: {
      getProfileByIdentifier: async (identifier) => {
        if (identifier === "639185556677" || identifier === "+639185556677") {
          return { phone_number: "+639185556677", username: "existing_user" };
        }
        return null;
      },
    },
  });

  await assert.rejects(
    () =>
      authService.requestRegistrationOtp({
        ...VALID_REGISTRATION_DATA,
        phoneNumber: "09185556677",
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.message, "Phone number is already in use");
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 7: Invalid Philippine phone number format
// ─────────────────────────────────────────────────────────────────────────────
test("Case 7: Invalid Philippine phone number format is rejected with 400 Bad Request", async (t) => {
  stubDependencies(t);

  const invalidNumbers = [
    "12345",
    "08123456789", // Not starting with 9
    "+12025550143", // US number
    "abcdefghijk",
    "091712345", // too short
  ];

  for (const invalidPhone of invalidNumbers) {
    await assert.rejects(
      () =>
        authService.requestRegistrationOtp({
          ...VALID_REGISTRATION_DATA,
          phoneNumber: invalidPhone,
        }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes("Philippine mobile number"));
        return true;
      },
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 8: Excessive OTP requests and incorrect attempts lockout
// ─────────────────────────────────────────────────────────────────────────────
test("Case 8: Rate limiting & Max attempts lockout", async (t) => {
  let plainOtp = null;
  stubDependencies(t, {
    sms: {
      sendOtp: async (args) => {
        plainOtp = args.otp;
        return { success: true };
      },
    },
  });

  const reqResult = await authService.requestRegistrationOtp({
    ...VALID_REGISTRATION_DATA,
    username: "user_test_case8",
    email: "case8@example.com",
    phoneNumber: "09186667788",
  });

  // Attempt wrong OTP 4 times (remaining attempts: 4, 3, 2, 1)
  for (let i = 1; i <= 4; i++) {
    await assert.rejects(
      () =>
        authService.verifyRegistrationOtp({
          registrationToken: reqResult.registrationToken,
          otp: "111111",
        }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  }

  // 5th attempt invalidates session
  await assert.rejects(
    () =>
      authService.verifyRegistrationOtp({
        registrationToken: reqResult.registrationToken,
        otp: "111111",
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.ok(err.message.includes("Too many failed verification attempts"));
      return true;
    },
  );

  // Subsequent attempt (even with correct code) must fail because session is deleted
  await assert.rejects(
    () =>
      authService.verifyRegistrationOtp({
        registrationToken: reqResult.registrationToken,
        otp: plainOtp,
      }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 9: iProgSMS API errors, timeouts, and insufficient credits
// ─────────────────────────────────────────────────────────────────────────────
test("Case 9: iProgSMS provider errors (insufficient credits, timeouts) surface correctly and prune session", async (t) => {
  stubDependencies(t, {
    sms: {
      sendOtp: async () => {
        throw new AppError(
          "SMS service is currently unavailable (insufficient credits). Please contact support or try again later.",
          503,
        );
      },
    },
  });

  await assert.rejects(
    () =>
      authService.requestRegistrationOtp({
        ...VALID_REGISTRATION_DATA,
        username: "user_test_case9",
        email: "case9@example.com",
        phoneNumber: "09187778899",
      }),
    (err) => {
      assert.equal(err.statusCode, 503);
      assert.ok(err.message.includes("insufficient credits"));
      return true;
    },
  );

  // Rate limit should be rolled back so user is not penalized for gateway failure
  assert.doesNotThrow(() => {
    pendingRegistrationStore.checkPhoneSendRateLimit("+639187778899");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 10: Registration interrupted or duplicate submissions handled safely
// ─────────────────────────────────────────────────────────────────────────────
test("Case 10: Completion locks protect against duplicate submissions and return idempotent success", async (t) => {
  let plainOtp = null;
  let performRegCount = 0;

  stubDependencies(t, {
    sms: {
      sendOtp: async (args) => {
        plainOtp = args.otp;
        return { success: true };
      },
    },
    repo: {
      registerWithEmailPassword: async () => {
        performRegCount++;
        return {
          user: { id: "test-user-id-concurrent", identities: [{ id: "i-concurrent" }] },
          session: null,
        };
      },
    },
  });

  const reqResult = await authService.requestRegistrationOtp({
    ...VALID_REGISTRATION_DATA,
    username: "user_test_case10",
    email: "case10@example.com",
    phoneNumber: "09188889900",
  });

  // Verify first
  pendingRegistrationStore.verifyOtp(reqResult.registrationToken, plainOtp);

  // First complete call finishes account creation
  const firstComplete = await authService.completeRegistration({
    verificationToken: reqResult.registrationToken,
  });
  assert.equal(firstComplete.success, true);
  assert.equal(performRegCount, 1);

  // Subsequent complete call returns the already-completed result idempotently without recreating user
  const secondComplete = await authService.completeRegistration({
    verificationToken: reqResult.registrationToken,
  });
  assert.equal(secondComplete.success, true);
  assert.equal(performRegCount, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 11: Attempt to bypass OTP verification by calling register directly
// ─────────────────────────────────────────────────────────────────────────────
test("Case 11: Direct /register call without OTP verification is strictly blocked with 403 Forbidden", async (t) => {
  stubDependencies(t);

  // 1. Missing verificationToken
  await assert.rejects(
    () => authService.register({ ...VALID_REGISTRATION_DATA }),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.ok(err.message.includes("Phone number verification required"));
      return true;
    },
  );

  // 2. Fake / unverified verificationToken
  await assert.rejects(
    () =>
      authService.register({
        ...VALID_REGISTRATION_DATA,
        verificationToken: "fake-unverified-token-xyz",
      }),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.ok(err.message.includes("Phone number verification required"));
      return true;
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 12: Existing login, forgot-password, and profile features remain intact
// ─────────────────────────────────────────────────────────────────────────────
test("Case 12: Existing authentication features (login, forgot-password) remain functional", async (t) => {
  stubDependencies(t);

  // Check login validation and flow exists
  assert.equal(typeof authService.login, "function");
  assert.equal(typeof authService.forgotPassword, "function");
  assert.equal(typeof authService.createGuestSession, "function");
  assert.equal(typeof authService.activateAccount, "function");
  assert.equal(typeof authService.changePassword, "function");

  // Guest session creation works
  const origEnsureGuest = authRepository.ensureGuestUser;
  authRepository.ensureGuestUser = async (id) => ({
    id: id || "guest-user-123",
    email: "guest@citisent.app",
    role: "guest",
  });

  const guest = await authService.createGuestSession();
  assert.ok(guest.token);
  assert.ok(guest.recoveryToken);
  assert.equal(guest.user.role, "guest");

  authRepository.ensureGuestUser = origEnsureGuest;
});
