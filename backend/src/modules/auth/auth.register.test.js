import test from "node:test";
import assert from "node:assert/strict";

import { authService } from "./auth.service.js";
import { authRepository } from "./auth.repository.js";
import { createAdminSupabaseClient, supabase } from "../../config/supabase.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../shared/errors/appError.js";
import { pendingRegistrationStore } from "../../shared/security/pendingRegistration.store.js";

const VALID_PAYLOAD = Object.freeze({
  username: "maria_santos",
  email: "Maria.Santos@Example.com",
  password: "SuperSecret123",
  fname: "Maria",
  mname: null,
  lname: "Santos",
  phoneNumber: "+639171234567",
  age: 30,
  gender: "female",
  clientType: "citizen",
  barangay: "San Isidro Norte",
});

let phoneCounter = 1000;
function getVerifiedPayload(overrides = {}) {
  phoneCounter += 1;
  const phoneNumber = overrides.phoneNumber || `+63917000${phoneCounter}`;
  const email = overrides.email || `maria.santos.${phoneCounter}@example.com`;
  const username = overrides.username || `maria_santos_${phoneCounter}`;
  const payload = { ...VALID_PAYLOAD, ...overrides, phoneNumber, email, username };
  const pending = pendingRegistrationStore.createPendingRegistration({
    registrationPayload: payload,
    phoneNumber,
    email: email.toLowerCase(),
    username,
  });
  pendingRegistrationStore.verifyOtp(pending.registrationToken, pending.plainOtp);
  return { ...payload, verificationToken: pending.registrationToken };
}

function buildRateLimitError() {
  return Object.assign(new Error("email rate limit exceeded"), {
    name: "AuthApiError",
    status: 429,
    code: "over_email_send_rate_limit",
  });
}

function captureConsole(t) {
  const calls = { error: [], log: [] };
  const origError = console.error;
  const origLog = console.log;
  console.error = (...args) => calls.error.push(args);
  console.log = (...args) => calls.log.push(args);
  t.after(() => {
    console.error = origError;
    console.log = origLog;
  });
  return calls;
}

function stubSignUp(t, impl) {
  const original = supabase.auth.signUp;
  const adminClient = createAdminSupabaseClient();
  const originalAdminCreate = adminClient?.auth?.admin?.createUser;
  const calls = [];

  supabase.auth.signUp = async (args) => {
    calls.push(args);
    return impl(args, calls.length);
  };

  if (adminClient?.auth?.admin) {
    adminClient.auth.admin.createUser = async (args) => {
      calls.push(args);
      return impl(args, calls.length);
    };
  }

  t.after(() => {
    supabase.auth.signUp = original;
    if (adminClient?.auth?.admin && originalAdminCreate) {
      adminClient.auth.admin.createUser = originalAdminCreate;
    }
  });
  return calls;
}

function stubServiceDependencies(t, overrides = {}) {
  const keys = [
    "getProfileByIdentifier",
    "registerWithEmailPassword",
    "upsertProfileByUserId",
    "upsertProfileByUserIdWithAdmin",
  ];
  const originals = Object.fromEntries(keys.map((k) => [k, authRepository[k]]));

  const calls = { register: [], upsert: [], upsertAdmin: [] };

  authRepository.getProfileByIdentifier = async () => null;
  authRepository.registerWithEmailPassword = async (args) => {
    calls.register.push(args);
    return { user: { id: "user-1", identities: [{ id: "i1" }] }, session: null };
  };
  authRepository.upsertProfileByUserId = async (...args) => {
    calls.upsert.push(args);
    return { user_id: args[0], ...args[1] };
  };
  authRepository.upsertProfileByUserIdWithAdmin = async (...args) => {
    calls.upsertAdmin.push(args);
    return { user_id: args[0], ...args[1] };
  };
  Object.assign(authRepository, overrides);

  t.after(() => Object.assign(authRepository, originals));
  return calls;
}

// ─── Repository: Supabase Auth sign-up ──────────────────────────────

test("registerWithEmailPassword returns Supabase data on success with a single signUp call", async (t) => {
  const signUpData = { user: { id: "user-1" }, session: null };
  const calls = stubSignUp(t, async () => ({ data: signUpData, error: null }));

  const result = await authRepository.registerWithEmailPassword({
    email: "a@example.com",
    password: "SuperSecret123",
    userMetadata: { username: "a" },
  });

  assert.equal(result, signUpData);
  assert.equal(calls.length, 1);
});

test("registerWithEmailPassword maps over_email_send_rate_limit to a safe 429 without retrying", async (t) => {
  const consoleCalls = captureConsole(t);
  const calls = stubSignUp(t, async () => ({
    data: { user: null, session: null },
    error: buildRateLimitError(),
  }));

  await assert.rejects(
    () =>
      authRepository.registerWithEmailPassword({
        email: "a@example.com",
        password: "SuperSecret123",
        userMetadata: {},
      }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 429);
      assert.equal(err.code, "EMAIL_RATE_LIMITED");
      assert.equal(err.publicCode, "EMAIL_RATE_LIMITED");
      assert.ok(err.retryAfterSeconds > 0);
      // Raw Supabase error must not travel with the response.
      assert.equal(err.details, null);
      assert.ok(!/over_email_send_rate_limit/i.test(err.message));
      assert.ok(!/SuperSecret123/.test(JSON.stringify(err)));
      return true;
    },
  );

  // No automatic retry, no reconciliation/second email.
  assert.equal(calls.length, 1);
  // The repository must not log (errorHandler logs once, centrally).
  assert.equal(consoleCalls.error.length, 0);
  assert.equal(consoleCalls.log.length, 0);
});

test("registerWithEmailPassword recognises a 429 'email rate limit exceeded' without an error code", async (t) => {
  stubSignUp(t, async () => ({
    data: null,
    error: Object.assign(new Error("email rate limit exceeded"), { status: 429 }),
  }));

  await assert.rejects(
    () =>
      authRepository.registerWithEmailPassword({
        email: "a@example.com",
        password: "SuperSecret123",
        userMetadata: {},
      }),
    (err) => err.statusCode === 429 && err.code === "EMAIL_RATE_LIMITED",
  );
});

test("registerWithEmailPassword does not bypass email verification when Supabase mail sending fails", async (t) => {
  captureConsole(t);
  const calls = stubSignUp(t, async () => ({
    data: null,
    error: Object.assign(new Error("Error sending confirmation email"), {
      status: 500,
      code: "unexpected_failure",
    }),
  }));

  await assert.rejects(
    () =>
      authRepository.registerWithEmailPassword({
        email: "a@example.com",
        password: "SuperSecret123",
        userMetadata: {},
      }),
    (err) => err.statusCode === 502,
  );

  // Failed once and surfaced as an error: no admin createUser(email_confirm) fallback.
  assert.equal(calls.length, 1);
});

// ─── Service: registration orchestration ────────────────────────────

test("authService.register succeeds and stores a normalized profile", async (t) => {
  const calls = stubServiceDependencies(t);

  const payload = getVerifiedPayload({
    email: "maria.santos@example.com",
    username: "maria_santos",
  });
  const result = await authService.register(payload);

  assert.equal(calls.register.length, 1);
  assert.equal(calls.register[0].email, "maria.santos@example.com");
  assert.equal(calls.upsertAdmin.length, 1);
  assert.equal(calls.upsertAdmin[0][1].username, "maria_santos");
  // Email verification still required: no session is issued at sign-up.
  assert.equal(result.token, null);
  assert.equal(result.user.id, "user-1");
});

test("authService.register propagates the email rate limit and creates no profile", async (t) => {
  const rateLimited = new AppError("rate limited", 429);
  const calls = stubServiceDependencies(t, {
    registerWithEmailPassword: async () => {
      throw rateLimited;
    },
  });

  await assert.rejects(
    () => authService.register(getVerifiedPayload()),
    (err) => err === rateLimited && err.statusCode === 429,
  );

  assert.equal(calls.upsert.length, 0);
  assert.equal(calls.upsertAdmin.length, 0);
});

test("authService.register strictly requires phone verification for citizens", async () => {
  await assert.rejects(
    () => authService.register({ ...VALID_PAYLOAD }),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.ok(err.message.includes("Phone number verification required"));
      return true;
    },
  );
});

test("authService.register rejects a duplicate submission while one is in flight", async (t) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let registerCalls = 0;

  stubServiceDependencies(t, {
    registerWithEmailPassword: async () => {
      registerCalls += 1;
      await gate;
      return { user: { id: "user-1", identities: [{ id: "i1" }] }, session: null };
    },
  });

  const verified1 = getVerifiedPayload({ email: "maria.santos@example.com" });
  const verified2 = getVerifiedPayload({ email: "  MARIA.SANTOS@example.com " });

  const first = authService.register(verified1);
  // Same email with different casing/whitespace is still the same registration.
  const second = authService.register(verified2);

  await assert.rejects(second, (err) => err.statusCode === 409);

  release();
  await first;

  // Only the first request reached Supabase Auth.
  assert.equal(registerCalls, 1);

  // The lock is released afterwards, so a later attempt is accepted.
  const verified3 = getVerifiedPayload({ email: "maria.santos@example.com" });
  await authService.register(verified3);
  assert.equal(registerCalls, 2);
});

test("authService.register releases the in-flight lock when registration fails", async (t) => {
  let attempts = 0;
  stubServiceDependencies(t, {
    registerWithEmailPassword: async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new AppError("rate limited", 429);
      }
      return { user: { id: "user-1", identities: [{ id: "i1" }] }, session: null };
    },
  });

  const verified1 = getVerifiedPayload({ email: "inflight-fail@example.com" });
  await assert.rejects(() => authService.register(verified1));

  const verified2 = getVerifiedPayload({ email: "inflight-fail@example.com" });
  await authService.register(verified2);
  assert.equal(attempts, 2);
});

test("authService.register still enforces username uniqueness before calling Supabase", async (t) => {
  const calls = stubServiceDependencies(t, {
    getProfileByIdentifier: async (identifier) =>
      identifier === "maria_santos" ? { username: "Maria_Santos" } : null,
  });

  await assert.rejects(
    () => authService.register(getVerifiedPayload({ username: "maria_santos" })),
    (err) => err.statusCode === 409 && err.message === "Username is already in use",
  );
  assert.equal(calls.register.length, 0);
});

test("authService.register still enforces phone number uniqueness before calling Supabase", async (t) => {
  const calls = stubServiceDependencies(t, {
    getProfileByIdentifier: async (identifier) =>
      identifier === "639171234567" ? { phone_number: "+639171234567" } : null,
  });

  await assert.rejects(
    () => authService.register(getVerifiedPayload({ phoneNumber: "+639171234567" })),
    (err) =>
      err.statusCode === 409 && err.message === "Phone number is already in use",
  );
  assert.equal(calls.register.length, 0);
});

test("authService.register does not report success when Supabase returns no user", async (t) => {
  const calls = stubServiceDependencies(t, {
    registerWithEmailPassword: async () => ({ user: null, session: null }),
  });

  await assert.rejects(
    () => authService.register(getVerifiedPayload()),
    (err) => err.statusCode === 502,
  );
  assert.equal(calls.upsertAdmin.length, 0);
});

test("authService.register treats an obfuscated already-registered user as a conflict", async (t) => {
  const calls = stubServiceDependencies(t, {
    registerWithEmailPassword: async () => ({
      user: { id: "fake-user", identities: [] },
      session: null,
    }),
  });

  await assert.rejects(
    () => authService.register(getVerifiedPayload()),
    (err) => err.statusCode === 409,
  );
  assert.equal(calls.upsertAdmin.length, 0);
});

// ─── errorHandler: safe response + single log entry ─────────────────

test("errorHandler returns a safe 429 for the email rate limit and logs exactly once", (t) => {
  const logged = [];
  const origWarn = logger.warn;
  const origError = logger.error;
  logger.warn = (...args) => logged.push(["warn", ...args]);
  logger.error = (...args) => logged.push(["error", ...args]);
  t.after(() => {
    logger.warn = origWarn;
    logger.error = origError;
  });

  const headers = {};
  let statusCode;
  let body;
  const res = {
    headersSent: false,
    setHeader: (key, value) => {
      headers[key] = value;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };

  // Build the error through the real repository path.
  stubSignUp(t, async () => ({ data: null, error: buildRateLimitError() }));

  return authRepository
    .registerWithEmailPassword({
      email: "a@example.com",
      password: "SuperSecret123",
      userMetadata: {},
    })
    .then(
      () => assert.fail("expected a rejection"),
      (err) => {
        errorHandler(err, { requestId: "req-1", method: "POST", originalUrl: "/api/v1/auth/register" }, res, () => {});

        assert.equal(statusCode, 429);
        assert.equal(body.success, false);
        assert.equal(body.code, "EMAIL_RATE_LIMITED");
        assert.ok(body.retryAfterSeconds > 0);
        assert.equal(headers["Retry-After"], String(body.retryAfterSeconds));
        assert.equal("details" in body, false);
        assert.ok(!/over_email_send_rate_limit|SuperSecret123/i.test(JSON.stringify(body)));

        assert.equal(logged.length, 1);
        assert.equal(logged[0][0], "warn");
        assert.ok(!/SuperSecret123/.test(JSON.stringify(logged)));
      },
    );
});
