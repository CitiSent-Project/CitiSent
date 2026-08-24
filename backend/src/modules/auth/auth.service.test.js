import test from "node:test";
import assert from "node:assert/strict";

import { authService } from "./auth.service.js";
import { authRepository } from "./auth.repository.js";
import { cacheService } from "../../shared/cache/cacheService.js";

function stubAuthDependencies(t) {
  const origLogin = authRepository.loginWithEmailPassword;
  const origGetProfileByIdentifier = authRepository.getProfileByIdentifier;
  const origCheckActiveBan = authRepository.checkActiveBanByUserId;
  const origGetProfileByUserId = authRepository.getProfileByUserId;
  const origSetJSON = cacheService.setJSON;
  const origGetJSON = cacheService.getJSON;

  t.after(() => {
    authRepository.loginWithEmailPassword = origLogin;
    authRepository.getProfileByIdentifier = origGetProfileByIdentifier;
    authRepository.checkActiveBanByUserId = origCheckActiveBan;
    authRepository.getProfileByUserId = origGetProfileByUserId;
    cacheService.setJSON = origSetJSON;
    cacheService.getJSON = origGetJSON;
  });
}

test("authService.login executes parallel lookups and returns user response on valid credentials", async (t) => {
  stubAuthDependencies(t);

  let cachedProfileKey = null;
  let cachedProfileVal = null;

  cacheService.setJSON = async (key, val) => {
    cachedProfileKey = key;
    cachedProfileVal = val;
  };

  const sampleProfile = {
    user_id: "user-abc-123",
    email: "citizen@example.com",
    username: "citizendemo",
    role: "citizen",
    account_type: "citizen",
    account_status: "active",
    activation_status: "active",
    fname: "Maria",
    lname: "Santos",
  };

  authRepository.getProfileByIdentifier = async (id) => {
    assert.equal(id, "citizen@example.com");
    return sampleProfile;
  };

  authRepository.checkActiveBanByUserId = async () => false;

  authRepository.loginWithEmailPassword = async ({ email, password }) => {
    assert.equal(email, "citizen@example.com");
    assert.equal(password, "CorrectPassword123!");
    return {
      user: { id: "user-abc-123", email: "citizen@example.com" },
      session: { access_token: "jwt-token-xyz" },
    };
  };

  const perfStages = [];
  const result = await authService.login(
    {
      email: "citizen@example.com",
      password: "CorrectPassword123!",
    },
    {
      trackStage: async (name, fn) => {
        perfStages.push(name);
        return fn();
      },
    },
  );

  assert.equal(result.token, "jwt-token-xyz");
  assert.equal(result.user.id, "user-abc-123");
  assert.equal(result.user.email, "citizen@example.com");
  assert.equal(result.user.accountType, "citizen");
  assert.equal(cachedProfileKey, "profile:user:user-abc-123");
  assert.deepEqual(cachedProfileVal, sampleProfile);
  assert.ok(perfStages.includes("identifierLookup"));
  assert.ok(perfStages.includes("preAuthProfileLookup"));
  assert.ok(perfStages.includes("supabaseAuth"));
});

test("authService.login rejects banned user with 403 Forbidden", async (t) => {
  stubAuthDependencies(t);

  const bannedProfile = {
    user_id: "banned-user-1",
    email: "banned@example.com",
    username: "banneduser",
    role: "citizen",
    account_status: "banned",
    activation_status: "active",
  };

  authRepository.getProfileByIdentifier = async () => bannedProfile;
  authRepository.checkActiveBanByUserId = async () => true;
  authRepository.loginWithEmailPassword = async () => {
    throw new Error("Invalid credentials");
  };

  await assert.rejects(
    async () => {
      await authService.login({
        email: "banned@example.com",
        password: "any-password",
      });
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.message, "Your account has been banned.");
      return true;
    },
  );
});

test("authService.login handles username login without redundant queries", async (t) => {
  stubAuthDependencies(t);

  const usernameProfile = {
    user_id: "user-admin-99",
    email: "officer@citisent.gov.ph",
    username: "officer_pnp",
    role: "admin",
    account_type: "pnp_officer",
    account_status: "active",
    activation_status: "active",
    fname: "Juan",
    lname: "Dela Cruz",
  };

  let identifierLookupCalls = 0;
  authRepository.getProfileByIdentifier = async (id) => {
    identifierLookupCalls += 1;
    assert.equal(id, "officer_pnp");
    return usernameProfile;
  };

  authRepository.checkActiveBanByUserId = async () => false;

  authRepository.loginWithEmailPassword = async ({ email, password }) => {
    assert.equal(email, "officer@citisent.gov.ph");
    assert.equal(password, "ValidPass123");
    return {
      user: { id: "user-admin-99", email: "officer@citisent.gov.ph" },
      session: { access_token: "jwt-token-admin" },
    };
  };

  cacheService.setJSON = async () => {};

  const result = await authService.login({
    identifier: "officer_pnp",
    password: "ValidPass123",
  });

  assert.equal(result.token, "jwt-token-admin");
  assert.equal(result.user.id, "user-admin-99");
  assert.equal(result.user.email, "officer@citisent.gov.ph");
  assert.equal(identifierLookupCalls, 1);
});
