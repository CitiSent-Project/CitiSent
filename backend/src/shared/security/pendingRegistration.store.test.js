import test from "node:test";
import assert from "node:assert/strict";
import { pendingRegistrationStore } from "./pendingRegistration.store.js";

test("pendingRegistrationStore: create and verify OTP lifecycle", () => {
  pendingRegistrationStore.clearAll();

  const payload = {
    username: "johndoe",
    email: "john@example.com",
    phoneNumber: "+639171234567",
  };

  const created = pendingRegistrationStore.createPendingRegistration({
    registrationPayload: payload,
    phoneNumber: "+639171234567",
    localPhoneNumber: "09171234567",
    email: "john@example.com",
    username: "johndoe",
    expirySeconds: 300,
    cooldownSeconds: 60,
  });

  assert.ok(created.registrationToken);
  assert.match(created.plainOtp, /^\d{6}$/);
  assert.equal(created.expiresInSeconds, 300);
  assert.equal(created.resendCooldownSeconds, 60);

  // Stored entry has hash, never plaintext OTP
  const entry = pendingRegistrationStore.getPendingRegistration(created.registrationToken);
  assert.ok(entry);
  assert.ok(entry.otpHash);
  assert.equal(entry.plainOtp, undefined);

  // Attempt with wrong OTP
  assert.throws(
    () => pendingRegistrationStore.verifyOtp(created.registrationToken, "000000"),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /4 attempt\(s\) remaining/);
      return true;
    },
  );

  // Correct OTP verification
  const verifyRes = pendingRegistrationStore.verifyOtp(
    created.registrationToken,
    created.plainOtp,
  );
  assert.equal(verifyRes.verified, true);

  // OTP hash is cleared after success (single-use)
  const verifiedEntry = pendingRegistrationStore.getPendingRegistration(created.registrationToken);
  assert.equal(verifiedEntry.verified, true);
  assert.equal(verifiedEntry.otpHash, null);

  // Re-verification must fail (prevent replay attacks)
  assert.throws(
    () => pendingRegistrationStore.verifyOtp(created.registrationToken, created.plainOtp),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /already been verified/i);
      return true;
    },
  );
});

test("pendingRegistrationStore: max attempts invalidates session", () => {
  pendingRegistrationStore.clearAll();

  const created = pendingRegistrationStore.createPendingRegistration({
    registrationPayload: { username: "alice" },
    phoneNumber: "+639181234567",
    localPhoneNumber: "09181234567",
    email: "alice@example.com",
    username: "alice",
  });

  // Fail 5 times
  for (let i = 1; i <= 4; i++) {
    assert.throws(
      () => pendingRegistrationStore.verifyOtp(created.registrationToken, "111111"),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  }

  // 5th failed attempt should invalidate the session
  assert.throws(
    () => pendingRegistrationStore.verifyOtp(created.registrationToken, "111111"),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /session has been invalidated/i);
      return true;
    },
  );

  // Subsequent check shows session is deleted
  assert.equal(
    pendingRegistrationStore.getPendingRegistration(created.registrationToken),
    null,
  );
});

test("pendingRegistrationStore: resend invalidates old OTP and enforces cooldown", async () => {
  pendingRegistrationStore.clearAll();

  const created = pendingRegistrationStore.createPendingRegistration({
    registrationPayload: { username: "bob" },
    phoneNumber: "+639191234567",
    localPhoneNumber: "09191234567",
    email: "bob@example.com",
    username: "bob",
    cooldownSeconds: 2, // 2s cooldown for testing
  });

  const oldOtp = created.plainOtp;

  // Attempting resend immediately triggers 429 cooldown error
  assert.throws(
    () => pendingRegistrationStore.resendOtp(created.registrationToken),
    (err) => {
      assert.equal(err.statusCode, 429);
      assert.match(err.message, /Please wait \d+ second\(s\)/i);
      return true;
    },
  );

  // Wait for cooldown to expire
  await new Promise((r) => setTimeout(r, 2100));

  // Resend succeeds
  const resent = pendingRegistrationStore.resendOtp(created.registrationToken, {
    cooldownSeconds: 60,
  });
  assert.ok(resent.plainOtp);
  assert.match(resent.plainOtp, /^\d{6}$/);

  // Old OTP can no longer be used!
  if (oldOtp !== resent.plainOtp) {
    assert.throws(
      () => pendingRegistrationStore.verifyOtp(created.registrationToken, oldOtp),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /incorrect verification code/i);
        return true;
      },
    );
  }

  // New OTP succeeds
  const verifyRes = pendingRegistrationStore.verifyOtp(
    created.registrationToken,
    resent.plainOtp,
  );
  assert.equal(verifyRes.verified, true);
});

test("pendingRegistrationStore: expired OTP is rejected", () => {
  pendingRegistrationStore.clearAll();

  const created = pendingRegistrationStore.createPendingRegistration({
    registrationPayload: { username: "charlie" },
    phoneNumber: "+639201234567",
    localPhoneNumber: "09201234567",
    email: "charlie@example.com",
    username: "charlie",
    expirySeconds: -1, // already expired
  });

  assert.throws(
    () => pendingRegistrationStore.verifyOtp(created.registrationToken, created.plainOtp),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /expired/i);
      return true;
    },
  );
});

test("pendingRegistrationStore: completion lock prevents race conditions", () => {
  pendingRegistrationStore.clearAll();
  const token = "mock-token-xyz";

  assert.equal(pendingRegistrationStore.acquireCompletionLock(token), true);
  // Second concurrent attempt is locked out
  assert.equal(pendingRegistrationStore.acquireCompletionLock(token), false);

  pendingRegistrationStore.releaseCompletionLock(token);
  assert.equal(pendingRegistrationStore.acquireCompletionLock(token), true);
});
