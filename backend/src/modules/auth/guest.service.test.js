import test from "node:test";
import assert from "node:assert/strict";

import { authService } from "./auth.service.js";
import { authRepository } from "./auth.repository.js";
import {
  guestEmailOtpService,
  normalizeGmailAddress,
  isValidGmailAddress,
} from "../../shared/security/guestEmailOtp.service.js";
import {
  signGuestToken,
  tryVerifyGuestToken,
} from "../../shared/security/guestTokens.js";
import { reportsService } from "../reports/reports.service.js";
import { reportsRepository } from "../reports/reports.repository.js";
import { departmentsService } from "../departments/departments.service.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import { reportsSentimentClient } from "../reports/reports.sentiment.js";
import { mailerService } from "../../shared/email/mailer.js";
import { toAdminReportResponse } from "../admin/admin.mapper.js";

// Stub sentiment client to avoid external HTTP requests and timeouts
reportsSentimentClient.analyzeReport = async () => ({
  urgency: "Medium",
  emotion: "Neutral",
  summary: "Test report summary",
});

// Helper to reset stores between test runs
function resetGuestStores() {
  guestEmailOtpService.clearAll();
}

test("1. Guest can obtain a guest session with unverified initial state", async () => {
  resetGuestStores();

  const session = await authService.createGuestSession();
  assert.ok(session.token, "Guest session must provide a token");
  assert.equal(session.user.role, "guest");
  assert.equal(session.user.isGuest, true);
  assert.equal(session.user.isVerified, false);

  const verifiedPayload = tryVerifyGuestToken(session.token);
  assert.ok(verifiedPayload);
  assert.equal(verifiedPayload.isGuest, true);
  assert.equal(verifiedPayload.isVerified, false);
});

test("2. Gmail address normalization and non-Gmail rejection", () => {
  // Valid Gmail addresses normalized to lowercase trimmed
  assert.equal(normalizeGmailAddress("User@gmail.com"), "user@gmail.com");
  assert.equal(normalizeGmailAddress("  john.doe@GMAIL.COM  "), "john.doe@gmail.com");
  assert.equal(normalizeGmailAddress("citizen123@gmail.com"), "citizen123@gmail.com");

  assert.equal(isValidGmailAddress("test@gmail.com"), true);
  assert.equal(isValidGmailAddress("test@GMAIL.COM"), true);

  // Reject non-Gmail providers as required
  assert.throws(() => normalizeGmailAddress("example@yahoo.com"), /Guest verification currently requires a Gmail address/);
  assert.throws(() => normalizeGmailAddress("example@hotmail.com"), /Guest verification currently requires a Gmail address/);
  assert.throws(() => normalizeGmailAddress("example@outlook.com"), /Guest verification currently requires a Gmail address/);
  assert.throws(() => normalizeGmailAddress("example@proton.me"), /Guest verification currently requires a Gmail address/);
  assert.throws(() => normalizeGmailAddress("example@company.com"), /Guest verification currently requires a Gmail address/);
  assert.throws(() => normalizeGmailAddress("invalid-email"), /Please enter a valid Gmail address/);

  assert.equal(isValidGmailAddress("user@yahoo.com"), false);
  assert.equal(isValidGmailAddress("user@outlook.com"), false);
  assert.equal(isValidGmailAddress("notanemail"), false);
});

test("3. Guest can request an OTP dispatched via Gmail mailer", async (t) => {
  resetGuestStores();

  const email = "citizen.reporter@gmail.com";
  let capturedOtp = null;
  let capturedRecipient = null;

  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async ({ toEmail, otp }) => {
    capturedRecipient = toEmail;
    capturedOtp = otp;
    return { success: true };
  };
  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  const result = await authService.sendGuestOtp(email);
  assert.equal(result.sent, true);
  assert.equal(result.email, "citizen.reporter@gmail.com");
  assert.equal(result.cooldownSeconds, 60);

  // Mailer was called with 6-digit OTP
  assert.equal(capturedRecipient, "citizen.reporter@gmail.com");
  assert.ok(capturedOtp);
  assert.match(capturedOtp, /^\d{6}$/);

  // Ensure plain OTP was NOT returned in the API response
  assert.equal(result.otp, undefined);
});

test("4. OTP requests are rate limited (cooldown and max requests)", async (t) => {
  resetGuestStores();

  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async () => ({ success: true });
  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  const email = "rate.limited@gmail.com";
  await authService.sendGuestOtp(email);

  // Immediate second request within 60s cooldown must be rejected with 429
  await assert.rejects(
    () => authService.sendGuestOtp(email),
    (err) => {
      assert.equal(err.statusCode, 429);
      assert.match(err.message, /Please wait/);
      return true;
    },
  );
});

test("5. Incorrect OTP is rejected with remaining attempts counter", async (t) => {
  resetGuestStores();

  let generatedOtp = null;
  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async ({ otp }) => {
    generatedOtp = otp;
    return { success: true };
  };
  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  const email = "incorrect.otp@gmail.com";
  await authService.sendGuestOtp(email);

  await assert.rejects(
    () => authService.verifyGuestOtp(email, "000000"),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Incorrect verification code/);
      assert.match(err.message, /4 attempt\(s\) remaining/);
      return true;
    },
  );
});

test("6. OTP is invalidated after maximum incorrect attempts (5)", async (t) => {
  resetGuestStores();

  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async () => ({ success: true });
  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  const email = "five.attempts@gmail.com";
  await authService.sendGuestOtp(email);

  for (let i = 0; i < 4; i++) {
    await assert.rejects(() => authService.verifyGuestOtp(email, "000000"));
  }

  // 5th attempt invalidates
  await assert.rejects(
    () => authService.verifyGuestOtp(email, "000000"),
    (err) => {
      assert.match(err.message, /Too many attempts/);
      return true;
    },
  );

  // Subsequent attempt fails as expired/invalid
  await assert.rejects(
    () => authService.verifyGuestOtp(email, "000000"),
    (err) => {
      assert.match(err.message, /This verification code has expired/);
      return true;
    },
  );
});

test("7. Correct OTP verifies guest and returns verified token", async (t) => {
  resetGuestStores();

  let capturedOtp = null;
  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async ({ otp }) => {
    capturedOtp = otp;
    return { success: true };
  };
  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  const email = "verified.user@gmail.com";
  await authService.sendGuestOtp(email);
  assert.ok(capturedOtp);

  const verifyResult = await authService.verifyGuestOtp(email, capturedOtp);
  assert.equal(verifyResult.verified, true);
  assert.equal(verifyResult.user.isGuest, true);
  assert.equal(verifyResult.user.isVerified, true);
  assert.equal(verifyResult.user.email, "verified.user@gmail.com");

  const verifiedJwt = tryVerifyGuestToken(verifyResult.token);
  assert.ok(verifiedJwt);
  assert.equal(verifiedJwt.isGuest, true);
  assert.equal(verifiedJwt.isVerified, true);
  assert.equal(verifiedJwt.email, "verified.user@gmail.com");
});

test("8. Single-use: OTP cannot be reused after verification", async (t) => {
  resetGuestStores();

  let capturedOtp = null;
  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async ({ otp }) => {
    capturedOtp = otp;
    return { success: true };
  };
  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  const email = "single.use@gmail.com";
  await authService.sendGuestOtp(email);
  await authService.verifyGuestOtp(email, capturedOtp);

  // Trying to use the same OTP again must fail
  await assert.rejects(
    () => authService.verifyGuestOtp(email, capturedOtp),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /This verification code has expired/);
      return true;
    },
  );
});

test("9. Unverified guest CANNOT submit a report (403 GUEST_VERIFICATION_REQUIRED)", async (t) => {
  const origAnalyze = departmentsService.getActiveDepartmentByValue;
  departmentsService.getActiveDepartmentByValue = async () => null;
  t.after(() => {
    departmentsService.getActiveDepartmentByValue = origAnalyze;
  });

  const unverifiedActor = {
    id: "guest-test-1",
    role: "guest",
    isGuest: true,
    isVerified: false,
  };

  await assert.rejects(
    () =>
      reportsService.createReport({
        userId: unverifiedActor.id,
        actor: unverifiedActor,
        issueType: "Flooding",
        description: "Severe flooding blocking the street completely.",
        location: "Sto. Tomas Public Market",
        latitude: 14.05,
        longitude: 121.16,
      }),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, "GUEST_VERIFICATION_REQUIRED");
      assert.match(err.message, /Guest verification required/);
      return true;
    },
  );
});

test("10. Verified guest CAN submit a report", async (t) => {
  const origCreate = reportsRepository.create;
  const origDept = departmentsService.getActiveDepartmentByValue;
  const origDeleteByPrefix = cacheService.deleteByPrefix;

  departmentsService.getActiveDepartmentByValue = async () => null;
  cacheService.deleteByPrefix = async () => {};

  let repositoryCalled = false;
  reportsRepository.create = async (payload) => {
    repositoryCalled = true;
    return {
      id: "report-verified-guest-1",
      report_number: "REP-001",
      issue_type: payload.issue_type,
      description: payload.description,
      location: payload.location,
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: payload.user_id,
    };
  };

  t.after(() => {
    reportsRepository.create = origCreate;
    departmentsService.getActiveDepartmentByValue = origDept;
    cacheService.deleteByPrefix = origDeleteByPrefix;
  });

  const verifiedActor = {
    id: `guest-test-verified-${Date.now()}`,
    role: "guest",
    isGuest: true,
    isVerified: true,
    email: "verified.guest@gmail.com",
  };

  const created = await reportsService.createReport({
    userId: verifiedActor.id,
    actor: verifiedActor,
    issueType: "Road Hazard",
    description: "Deep pothole causing vehicle damage on the road.",
    location: "Poblacion 1, Sto. Tomas",
    latitude: 14.05,
    longitude: 121.16,
  });

  assert.ok(repositoryCalled, "Report must be saved to repository");
  assert.equal(created.issueType, "Road Hazard");
  assert.equal(created.status, "pending");
});

test("11. Registered users submit reports without OTP check", async (t) => {
  const origCreate = reportsRepository.create;
  const origDept = departmentsService.getActiveDepartmentByValue;
  const origDeleteByPrefix = cacheService.deleteByPrefix;

  departmentsService.getActiveDepartmentByValue = async () => null;
  cacheService.deleteByPrefix = async () => {};

  let repositoryCalled = false;
  reportsRepository.create = async (payload) => {
    repositoryCalled = true;
    return {
      id: "report-registered-user-1",
      report_number: "REP-002",
      issue_type: payload.issue_type,
      description: payload.description,
      location: payload.location,
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: payload.user_id,
    };
  };

  t.after(() => {
    reportsRepository.create = origCreate;
    departmentsService.getActiveDepartmentByValue = origDept;
    cacheService.deleteByPrefix = origDeleteByPrefix;
  });

  const citizenActor = {
    id: "citizen-user-1",
    role: "citizen",
    isGuest: false,
  };

  const created = await reportsService.createReport({
    userId: citizenActor.id,
    actor: citizenActor,
    issueType: "Streetlight Outage",
    description: "Broken streetlight causing pitch black intersection.",
    location: "San Roque, Sto. Tomas",
    latitude: 14.05,
    longitude: 121.16,
  });

  assert.ok(repositoryCalled);
  assert.equal(created.issueType, "Streetlight Outage");
});

test("12. Guest cannot bypass verification by sending arbitrary request body flags", async (t) => {
  const origDept = departmentsService.getActiveDepartmentByValue;
  departmentsService.getActiveDepartmentByValue = async () => null;
  t.after(() => {
    departmentsService.getActiveDepartmentByValue = origDept;
  });

  const unverifiedActor = {
    id: "guest-test-tamper",
    role: "guest",
    isGuest: true,
    isVerified: false,
  };

  // Attempting to inject { verified: true, isVerified: true } in body
  await assert.rejects(
    () =>
      reportsService.createReport({
        userId: unverifiedActor.id,
        actor: unverifiedActor,
        issueType: "Illegal Dumping",
        description: "Trash dumped along the sidewalk blocking pedestrian walkway.",
        location: "Sto. Tomas",
        latitude: 14.05,
        longitude: 121.16,
        verified: true,
        isVerified: true,
      }),
    (err) => {
      assert.equal(err.code, "GUEST_VERIFICATION_REQUIRED");
      return true;
    },
  );
});

test("13. Email sending failures are handled gracefully with friendly error", async (t) => {
  resetGuestStores();

  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async () => {
    throw new Error("SMTP connection timeout");
  };

  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  await assert.rejects(
    () => authService.sendGuestOtp("fail.smtp@gmail.com"),
    (err) => {
      assert.equal(err.statusCode, 502);
      assert.match(err.message, /We couldn't send the verification code. Please try again./);
      return true;
    },
  );
});

test("14. Existing registered Gmail cannot request Guest OTP (409 Conflict)", async (t) => {
  resetGuestStores();

  const origIsRegistered = authRepository.isRegisteredUserEmail;
  authRepository.isRegisteredUserEmail = async (email) => {
    return email === "existinguser@gmail.com";
  };
  t.after(() => {
    authRepository.isRegisteredUserEmail = origIsRegistered;
  });

  await assert.rejects(
    () => authService.sendGuestOtp("existinguser@gmail.com"),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.message, "This email is already registered.");
      assert.match(
        err.details?.supportingText,
        /This Gmail address is already associated with an existing CitiSent account/,
      );
      return true;
    },
  );
});

test("15. Existing registered Gmail does NOT generate OTP or send email", async (t) => {
  resetGuestStores();

  let mailerCalled = false;
  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async () => {
    mailerCalled = true;
    return { success: true };
  };

  const origIsRegistered = authRepository.isRegisteredUserEmail;
  authRepository.isRegisteredUserEmail = async (email) => {
    return email === "john.doe@gmail.com";
  };

  t.after(() => {
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
    authRepository.isRegisteredUserEmail = origIsRegistered;
  });

  await assert.rejects(() => authService.sendGuestOtp("john.doe@gmail.com"));

  // Ensure mailer was never invoked
  assert.equal(mailerCalled, false, "Mailer must NOT be called for existing registered accounts");

  // Ensure verifying any OTP for this email fails with no OTP generated
  await assert.rejects(
    () => authService.verifyGuestOtp("john.doe@gmail.com", "123456"),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.message, "This email is already registered.");
      return true;
    },
  );
});

test("16. Existing registered check is case-insensitive (e.g. ExistingUser@GMAIL.COM)", async (t) => {
  resetGuestStores();

  const origIsRegistered = authRepository.isRegisteredUserEmail;
  authRepository.isRegisteredUserEmail = async (email) => {
    return email === "existinguser@gmail.com";
  };
  t.after(() => {
    authRepository.isRegisteredUserEmail = origIsRegistered;
  });

  // Uppercase input should be normalized and matched against registered email
  await assert.rejects(
    () => authService.sendGuestOtp("ExistingUser@GMAIL.COM"),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.message, "This email is already registered.");
      return true;
    },
  );
});

test("17. Existing registered check trims leading and trailing whitespace", async (t) => {
  resetGuestStores();

  const origIsRegistered = authRepository.isRegisteredUserEmail;
  authRepository.isRegisteredUserEmail = async (email) => {
    return email === "existinguser@gmail.com";
  };
  t.after(() => {
    authRepository.isRegisteredUserEmail = origIsRegistered;
  });

  await assert.rejects(
    () => authService.sendGuestOtp("   existinguser@gmail.com   "),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.message, "This email is already registered.");
      return true;
    },
  );
});

test("18. Guest cannot bypass existing registered check by calling verifyGuestOtp directly", async (t) => {
  resetGuestStores();

  const origIsRegistered = authRepository.isRegisteredUserEmail;
  authRepository.isRegisteredUserEmail = async (email) => {
    return email === "existinguser@gmail.com";
  };
  t.after(() => {
    authRepository.isRegisteredUserEmail = origIsRegistered;
  });

  await assert.rejects(
    () => authService.verifyGuestOtp("ExistingUser@GMAIL.COM", "123456"),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.message, "This email is already registered.");
      return true;
    },
  );
});

test("19. Prior guest account can request OTP and is not falsely blocked as registered account", async (t) => {
  resetGuestStores();

  const origGetProfile = authRepository.getProfileByEmail;
  // Existing guest account in profiles table
  authRepository.getProfileByEmail = async (email) => {
    if (email === "prior.guest@gmail.com") {
      return {
        user_id: "prior-guest-uuid",
        email: "prior.guest@gmail.com",
        account_type: "guest",
        role: "guest",
      };
    }
    return null;
  };

  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  let sentOtp = null;
  mailerService.sendGuestVerificationOtpEmail = async ({ otp }) => {
    sentOtp = otp;
    return { success: true };
  };

  t.after(() => {
    authRepository.getProfileByEmail = origGetProfile;
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  // Verify authRepository.isRegisteredUserEmail correctly identifies this as NOT a registered user
  const isRegistered = await authRepository.isRegisteredUserEmail("prior.guest@gmail.com");
  assert.equal(isRegistered, false, "Guest account must not be flagged as registered user");

  // Guest can request OTP successfully
  const result = await authService.sendGuestOtp("prior.guest@gmail.com");
  assert.equal(result.sent, true);
  assert.ok(sentOtp);
});

test("20. Reporter identity for guest report always resolves to 'Guest'", () => {
  const mapped = toAdminReportResponse({
    reportRow: {
      id: "report-123",
      report_number: "REP-123",
      issue_type: "Pothole",
      user_id: "guest-user-uuid",
    },
    reporterProfile: {
      user_id: "guest-user-uuid",
      email: "guest.reporter@gmail.com",
      username: "guest_citizen_123",
      fname: "Guest",
      lname: "User",
      account_type: "guest",
      role: "guest",
    },
  });

  assert.equal(mapped.reporter.fullName, "Guest", "Guest reporter name must be strictly 'Guest'");
});

test("21. New unregistered Gmail can request OTP, verify, and submit report", async (t) => {
  resetGuestStores();

  const origIsRegistered = authRepository.isRegisteredUserEmail;
  authRepository.isRegisteredUserEmail = async () => false;

  let capturedOtp = null;
  const origSendEmail = mailerService.sendGuestVerificationOtpEmail;
  mailerService.sendGuestVerificationOtpEmail = async ({ otp }) => {
    capturedOtp = otp;
    return { success: true };
  };

  t.after(() => {
    authRepository.isRegisteredUserEmail = origIsRegistered;
    mailerService.sendGuestVerificationOtpEmail = origSendEmail;
  });

  const email = "brandnew.guest@gmail.com";
  const sendResult = await authService.sendGuestOtp(email);
  assert.equal(sendResult.sent, true);
  assert.ok(capturedOtp);

  const verifyResult = await authService.verifyGuestOtp(email, capturedOtp);
  assert.equal(verifyResult.verified, true);
  assert.equal(verifyResult.user.isVerified, true);
});
