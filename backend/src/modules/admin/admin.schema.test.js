import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminUserSchema,
  deleteAdminUserSchema,
  getAdminUserByIdSchema,
  bulkBanUsersSchema,
  bulkUnbanUsersSchema,
} from "./admin.schema.js";

function createPayload(overrides = {}) {
  return {
    body: {
      email: "jane.doe@example.com",
      fname: "Jane",
      lname: "Doe",
      username: "jane_doe",
      barangay: "San Isidro Norte",
      ...overrides,
    },
    params: {},
    query: {},
  };
}

test("createAdminUserSchema requires a mobile-login username", () => {
  const payload = createPayload();
  delete payload.body.username;

  assert.throws(() => createAdminUserSchema.parse(payload));
});

test("createAdminUserSchema accepts a valid username", () => {
  const parsed = createAdminUserSchema.parse(createPayload());

  assert.equal(parsed.body.username, "jane_doe");
});

test("createAdminUserSchema requires a department for office-admin invitations", () => {
  assert.throws(() =>
    createAdminUserSchema.parse(
      createPayload({ accountType: "admin", role: "Office Admin" }),
    ),
  );

  const parsed = createAdminUserSchema.parse(
    createPayload({
      accountType: "admin",
      role: "Office Admin",
      departmentId: "bplo",
    }),
  );

  assert.equal(parsed.body.departmentId, "bplo");
});

test("deleteAdminUserSchema requires a valid user id", () => {
  assert.throws(() =>
    deleteAdminUserSchema.parse({
      params: { userId: "not-a-uuid" },
      query: {},
      body: {},
    }),
  );

  const parsed = deleteAdminUserSchema.parse({
    params: { userId: "bfbb6c4b-5e4c-4185-b0f1-7857944c2fed" },
    query: {},
    body: {},
  });

  assert.equal(parsed.params.userId, "bfbb6c4b-5e4c-4185-b0f1-7857944c2fed");
});

test("bulkBanUsersSchema requires an array of valid UUIDs", () => {
  assert.throws(() =>
    bulkBanUsersSchema.parse({
      params: {},
      query: {},
      body: { userIds: [] },
    }),
  );

  assert.throws(() =>
    bulkBanUsersSchema.parse({
      params: {},
      query: {},
      body: { userIds: ["invalid-uuid"] },
    }),
  );

  const parsed = bulkBanUsersSchema.parse({
    params: {},
    query: {},
    body: {
      userIds: ["bfbb6c4b-5e4c-4185-b0f1-7857944c2fed", "92d6fb5f-933a-4b65-b375-4d6b31fddce2"],
      reason: "Policy violation",
    },
  });

  assert.equal(parsed.body.userIds.length, 2);
  assert.equal(parsed.body.reason, "Policy violation");
});

test("bulkUnbanUsersSchema requires an array of valid UUIDs", () => {
  assert.throws(() =>
    bulkUnbanUsersSchema.parse({
      params: {},
      query: {},
      body: { userIds: [] },
    }),
  );

  const parsed = bulkUnbanUsersSchema.parse({
    params: {},
    query: {},
    body: {
      userIds: ["bfbb6c4b-5e4c-4185-b0f1-7857944c2fed"],
    },
  });

  assert.equal(parsed.body.userIds.length, 1);
});

test("getAdminUserByIdSchema accepts either a UUID or a 6-digit User ID", () => {
  assert.doesNotThrow(() =>
    getAdminUserByIdSchema.parse({
      params: { userId: "c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d" },
    }),
  );

  assert.doesNotThrow(() =>
    getAdminUserByIdSchema.parse({
      params: { userId: "849201" },
    }),
  );

  assert.throws(() =>
    getAdminUserByIdSchema.parse({
      params: { userId: "not-a-valid-id" },
    }),
  );
});
