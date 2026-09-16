import test from "node:test";
import assert from "node:assert/strict";
import { updateCurrentUserSchema } from "./users.schema.js";

test("updateCurrentUserSchema accepts valid name fields", () => {
  const result = updateCurrentUserSchema.parse({
    body: {
      fname: "Juan Dela Cruz",
      mname: "Santos",
      lname: "Reyes",
    },
  });

  assert.equal(result.body.fname, "Juan Dela Cruz");
  assert.equal(result.body.mname, "Santos");
  assert.equal(result.body.lname, "Reyes");
});

test("updateCurrentUserSchema accepts empty string for mname and converts to null", () => {
  const result = updateCurrentUserSchema.parse({
    body: {
      mname: "",
    },
  });

  assert.equal(result.body.mname, null);
});

test("updateCurrentUserSchema accepts explicit null for mname", () => {
  const result = updateCurrentUserSchema.parse({
    body: {
      mname: null,
    },
  });

  assert.equal(result.body.mname, null);
});

test("updateCurrentUserSchema rejects whitespace-only string for mname", () => {
  assert.throws(
    () =>
      updateCurrentUserSchema.parse({
        body: {
          mname: "    ",
        },
      }),
    { message: /Middle name cannot be only spaces/ },
  );
});

test("updateCurrentUserSchema rejects leading or trailing spaces in mname", () => {
  assert.throws(
    () =>
      updateCurrentUserSchema.parse({
        body: {
          mname: " Santos",
        },
      }),
    { message: /Middle name cannot start with a space/ },
  );

  assert.throws(
    () =>
      updateCurrentUserSchema.parse({
        body: {
          mname: "Santos ",
        },
      }),
    { message: /Middle name cannot end with a space/ },
  );

  assert.throws(
    () =>
      updateCurrentUserSchema.parse({
        body: {
          mname: "   Santos   ",
        },
      }),
    { message: /Middle name cannot have leading or trailing spaces/ },
  );
});

test("updateCurrentUserSchema rejects leading or trailing spaces in fname", () => {
  assert.throws(
    () =>
      updateCurrentUserSchema.parse({
        body: {
          fname: " Juan",
        },
      }),
    { message: /First name cannot start with a space/ },
  );

  assert.throws(
    () =>
      updateCurrentUserSchema.parse({
        body: {
          fname: "Juan ",
        },
      }),
    { message: /First name cannot end with a space/ },
  );

  assert.throws(
    () =>
      updateCurrentUserSchema.parse({
        body: {
          fname: "   ",
        },
      }),
    { message: /First name cannot be only spaces/ },
  );
});

test("updateCurrentUserSchema leaves mname undefined if omitted", () => {
  const result = updateCurrentUserSchema.parse({
    body: {
      fname: "Juan",
    },
  });

  assert.equal(result.body.mname, undefined);
  assert.equal(result.body.fname, "Juan");
});
