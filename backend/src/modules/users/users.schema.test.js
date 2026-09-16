import test from "node:test";
import assert from "node:assert/strict";
import { updateCurrentUserSchema } from "./users.schema.js";

test("updateCurrentUserSchema accepts empty string for mname and converts to null", () => {
  const result = updateCurrentUserSchema.parse({
    body: {
      mname: "",
    },
  });

  assert.equal(result.body.mname, null);
});

test("updateCurrentUserSchema accepts whitespace string for mname and converts to null", () => {
  const result = updateCurrentUserSchema.parse({
    body: {
      mname: "    ",
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

test("updateCurrentUserSchema trims valid middle name", () => {
  const result = updateCurrentUserSchema.parse({
    body: {
      mname: "   Santos   ",
    },
  });

  assert.equal(result.body.mname, "Santos");
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
