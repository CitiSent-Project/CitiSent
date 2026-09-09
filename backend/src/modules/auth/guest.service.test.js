import test from "node:test";
import assert from "node:assert/strict";

import { authService } from "./auth.service.js";
import {
  guestOtpService,
  normalizePhilippinePhoneNumber,
  isValidPhilippinePhoneNumber,
} from "../../shared/security/guestOtp.service.js";
import {
  signGuestToken,
  tryVerifyGuestToken,
} from "../../shared/security/guestTokens.js";
import { smsProvider, mockSmsProvider } from "../../shared/sms/smsProvider.js";
import { reportsService } from "../reports/reports.service.js";
import { reportsRepository } from "../reports/reports.repository.js";
import { departmentsService } from "../departments/departments.service.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import { reportsSentimentClient } from "../reports/reports.sentiment.js";

// Stub sentiment client to avoid external HTTP requests and timeouts
reportsSentimentClient.analyzeReport = async () => ({
  urgency: "Medium",
  emotion: "Neutral",
  summary: "Test report summary",
});

// Helper to reset stores between test runs
function resetGuestStores() {
  guestOtpService.clearAll();
  mockSmsProvider.clear();
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

test("2. Philippine phone number normalization", () => {
  assert.equal(normalizePhilippinePhoneNumber("09171234567"), "+639171234567");
  assert.equal(normalizePhilippinePhoneNumber("9171234567"), "+639171234567");
  assert.equal(normalizePhilippinePhoneNumber("+639171234567"), "+639171234567");
  assert.equal(normalizePhilippinePhoneNumber("639171234567"), "+639171234567");
  assert.equal(normalizePhilippinePhoneNumber("0917-123-4567"), "+639171234567");
  assert.equal(normalizePhilippinePhoneNumber("0917 123 4567"), "+639171234567");

  // Rejections
  assert.throws(() => normalizePhilippinePhoneNumber("028123456")); // landline
  assert.throws(() => normalizePhilippinePhoneNumber("12345")); // too short
  assert.throws(() => normalizePhilippinePhoneNumber("+14155552671")); // US number
  assert.equal(isValidPhilippinePhoneNumber("09181234567"), true);
  assert.equal(isValidPhilippinePhoneNumber("08123456789"), false);
});

test("3. Guest can request an OTP dispatched via SMS provider", async () => {
  resetGuestStores();

  const phone = "09171234567";
  const result = await authService.sendGuestOtp(phone);
  assert.equal(result.sent, true);
  assert.equal(result.phoneNumber, "+639171234567");
  assert.equal(result.cooldownSeconds, 60);

  // Verify mock SMS provider captured the code
  const lastMsg = mockSmsProvider.getLastMessageFor("+639171234567");
  assert.ok(lastMsg);
  assert.match(lastMsg.otp, /^\d{6}$/);

  // Ensure plain OTP was NOT returned in response
  assert.equal(result.otp, undefined);
});

test("4. OTP requests are rate limited (cooldown and max requests)", async () => {
  resetGuestStores();

  const phone = "09171234567";
  await authService.sendGuestOtp(phone);

  // Immediate second request within 60s cooldown must be rejected
  await assert.rejects(
    () => authService.sendGuestOtp(phone),
    (err) => {
      assert.equal(err.statusCode, 429);
      assert.match(err.message, /Please wait/);
      return true;
    },
  );
});

test("5. Incorrect OTP is rejected with remaining attempts counter", async () => {
  resetGuestStores();

  const phone = "09171234567";
  await authService.sendGuestOtp(phone);

  await assert.rejects(
    () => authService.verifyGuestOtp(phone, "000000"),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Incorrect verification code/);
      assert.match(err.message, /4 attempt\(s\) remaining/);
      return true;
    },
  );
});

test("6. OTP is invalidated after maximum incorrect attempts (5)", async () => {
  resetGuestStores();

  const phone = "09171234567";
  await authService.sendGuestOtp(phone);

  for (let i = 0; i < 4; i++) {
    await assert.rejects(() => authService.verifyGuestOtp(phone, "000000"));
  }

  // 5th attempt invalidates
  await assert.rejects(
    () => authService.verifyGuestOtp(phone, "000000"),
    (err) => {
      assert.match(err.message, /Too many failed attempts/);
      return true;
    },
  );

  // Subsequent attempt fails as expired/invalid
  await assert.rejects(
    () => authService.verifyGuestOtp(phone, "000000"),
    (err) => {
      assert.match(err.message, /No verification code found/);
      return true;
    },
  );
});

test("7. Correct OTP verifies guest and returns verified token", async () => {
  resetGuestStores();

  const phone = "09171234567";
  await authService.sendGuestOtp(phone);

  const lastMsg = mockSmsProvider.getLastMessageFor("+639171234567");
  assert.ok(lastMsg);

  const verifyResult = await authService.verifyGuestOtp(phone, lastMsg.otp);
  assert.equal(verifyResult.verified, true);
  assert.equal(verifyResult.user.isGuest, true);
  assert.equal(verifyResult.user.isVerified, true);
  assert.equal(verifyResult.user.phoneNumber, "+639171234567");

  const verifiedJwt = tryVerifyGuestToken(verifyResult.token);
  assert.ok(verifiedJwt);
  assert.equal(verifiedJwt.isGuest, true);
  assert.equal(verifiedJwt.isVerified, true);
});

test("8. Single-use: OTP cannot be reused after verification", async () => {
  resetGuestStores();

  const phone = "09171234567";
  await authService.sendGuestOtp(phone);

  const lastMsg = mockSmsProvider.getLastMessageFor("+639171234567");
  await authService.verifyGuestOtp(phone, lastMsg.otp);

  // Trying to use the same OTP again must fail
  await assert.rejects(
    () => authService.verifyGuestOtp(phone, lastMsg.otp),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /No verification code found/);
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
    phoneNumber: "+639171234567",
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

test("13. SMS provider failures are handled gracefully with friendly error", async (t) => {
  resetGuestStores();

  const origSend = mockSmsProvider.sendOtp;
  mockSmsProvider.sendOtp = async () => {
    throw new Error("Carrier network timeout");
  };

  t.after(() => {
    mockSmsProvider.sendOtp = origSend;
  });

  await assert.rejects(
    () => authService.sendGuestOtp("09171234567"),
    (err) => {
      assert.equal(err.statusCode, 502);
      assert.match(err.message, /Failed to deliver verification SMS/);
      return true;
    },
  );
});



