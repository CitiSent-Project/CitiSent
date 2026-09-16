import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "./auth.schema.js";

const baseValidBody = {
  username: "juandelacruz",
  email: "juan@example.com",
  password: "Password123!",
  fname: "Juan",
  mname: "Pedro",
  lname: "Dela Cruz",
  phoneNumber: "+639123456789",
};

test("registerSchema accepts valid names", () => {
  const result = registerSchema.parse({
    body: {
      ...baseValidBody,
      fname: "Juan Dela Cruz",
      mname: "Pedro",
      lname: "Santos",
    },
  });

  assert.equal(result.body.fname, "Juan Dela Cruz");
  assert.equal(result.body.mname, "Pedro");
  assert.equal(result.body.lname, "Santos");
});

test("registerSchema accepts empty string for optional mname and normalizes to null", () => {
  const result = registerSchema.parse({
    body: {
      ...baseValidBody,
      mname: "",
    },
  });

  assert.equal(result.body.mname, null);
});

test("registerSchema accepts null for optional mname", () => {
  const result = registerSchema.parse({
    body: {
      ...baseValidBody,
      mname: null,
    },
  });

  assert.equal(result.body.mname, null);
});

test("registerSchema rejects leading space in fname", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        body: {
          ...baseValidBody,
          fname: " Juan",
        },
      }),
    { message: /First name cannot start with a space/ },
  );
});

test("registerSchema rejects trailing space in fname", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        body: {
          ...baseValidBody,
          fname: "Juan ",
        },
      }),
    { message: /First name cannot end with a space/ },
  );
});

test("registerSchema rejects whitespace-only in fname", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        body: {
          ...baseValidBody,
          fname: "   ",
        },
      }),
    { message: /First name cannot be only spaces/ },
  );
});

test("registerSchema rejects whitespace-only in mname", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        body: {
          ...baseValidBody,
          mname: "   ",
        },
      }),
    { message: /Middle name cannot be only spaces/ },
  );
});

test("registerSchema rejects leading space in mname", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        body: {
          ...baseValidBody,
          mname: " Pedro",
        },
      }),
    { message: /Middle name cannot start with a space/ },
  );
});

test("registerSchema rejects trailing space in lname", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        body: {
          ...baseValidBody,
          lname: "Dela Cruz ",
        },
      }),
    { message: /Last name cannot end with a space/ },
  );
});
