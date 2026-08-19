import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminUserSchema,
  deleteAdminUserSchema,
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
