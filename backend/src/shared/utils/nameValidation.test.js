import test from "node:test";
import assert from "node:assert/strict";
import {
  requiredNameSchema,
  optionalNameSchema,
} from "./nameValidation.js";

test("requiredNameSchema accepts single word and multi-word names with normal spaces", () => {
  const schema = requiredNameSchema("First name");

  assert.equal(schema.parse("Juan"), "Juan");
  assert.equal(schema.parse("Juan Dela Cruz"), "Juan Dela Cruz");
  assert.equal(schema.parse("Maria Clara"), "Maria Clara");
});

test("requiredNameSchema rejects leading spaces", () => {
  const schema = requiredNameSchema("First name");

  assert.throws(() => schema.parse(" Juan"), {
    message: /First name cannot start with a space/,
  });
  assert.throws(() => schema.parse("   Juan"), {
    message: /First name cannot start with a space/,
  });
});

test("requiredNameSchema rejects trailing spaces", () => {
  const schema = requiredNameSchema("First name");

  assert.throws(() => schema.parse("Juan "), {
    message: /First name cannot end with a space/,
  });
  assert.throws(() => schema.parse("Juan   "), {
    message: /First name cannot end with a space/,
  });
});

test("requiredNameSchema rejects leading AND trailing spaces", () => {
  const schema = requiredNameSchema("First name");

  assert.throws(() => schema.parse(" Juan "), {
    message: /First name cannot have leading or trailing spaces/,
  });
});

test("requiredNameSchema rejects whitespace-only values", () => {
  const schema = requiredNameSchema("First name");

  assert.throws(() => schema.parse("   "), {
    message: /First name cannot be only spaces/,
  });
});

test("requiredNameSchema rejects empty string", () => {
  const schema = requiredNameSchema("First name");

  assert.throws(() => schema.parse(""), {
    message: /First name is required/,
  });
});

test("requiredNameSchema rejects consecutive spaces between words", () => {
  const schema = requiredNameSchema("First name");

  assert.throws(() => schema.parse("Juan  Dela Cruz"), {
    message: /First name cannot contain consecutive spaces/,
  });
});

test("optionalNameSchema accepts empty string, null, and undefined (normalized to null)", () => {
  const schema = optionalNameSchema("Middle name");

  assert.equal(schema.parse(""), null);
  assert.equal(schema.parse(null), null);
  assert.equal(schema.parse(undefined), undefined);
});

test("optionalNameSchema accepts valid non-empty names", () => {
  const schema = optionalNameSchema("Middle name");

  assert.equal(schema.parse("Pedro"), "Pedro");
  assert.equal(schema.parse("De La"), "De La");
});

test("optionalNameSchema rejects whitespace-only string", () => {
  const schema = optionalNameSchema("Middle name");

  assert.throws(() => schema.parse("   "), {
    message: /Middle name cannot be only spaces/,
  });
});

test("optionalNameSchema rejects leading or trailing spaces", () => {
  const schema = optionalNameSchema("Middle name");

  assert.throws(() => schema.parse(" Pedro"), {
    message: /Middle name cannot start with a space/,
  });
  assert.throws(() => schema.parse("Pedro "), {
    message: /Middle name cannot end with a space/,
  });
  assert.throws(() => schema.parse(" Pedro "), {
    message: /Middle name cannot have leading or trailing spaces/,
  });
});

test("optionalNameSchema rejects consecutive spaces", () => {
  const schema = optionalNameSchema("Middle name");

  assert.throws(() => schema.parse("Pedro  Santos"), {
    message: /Middle name cannot contain consecutive spaces/,
  });
});
