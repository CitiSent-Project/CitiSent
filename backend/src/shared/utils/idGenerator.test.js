import test from "node:test";
import assert from "node:assert/strict";
import {
  generate6DigitId,
  isValid6DigitId,
  MIN_6_DIGIT_ID,
  MAX_6_DIGIT_ID,
} from "./idGenerator.js";

test("generate6DigitId returns a 6-digit numeric string within 100000-999999", () => {
  for (let i = 0; i < 500; i++) {
    const id = generate6DigitId();
    assert.equal(typeof id, "string", "ID must be a string");
    assert.equal(id.length, 6, `ID '${id}' must be exactly 6 characters long`);
    assert.match(id, /^[1-9]\d{5}$/, `ID '${id}' must only contain digits without leading zero`);

    const num = Number(id);
    assert.ok(num >= MIN_6_DIGIT_ID, `ID ${num} must be >= ${MIN_6_DIGIT_ID}`);
    assert.ok(num <= MAX_6_DIGIT_ID, `ID ${num} must be <= ${MAX_6_DIGIT_ID}`);
  }
});

test("generate6DigitId produces high entropy without immediate duplicates", () => {
  const generated = new Set();
  const sampleSize = 1000;
  for (let i = 0; i < sampleSize; i++) {
    generated.add(generate6DigitId());
  }
  // Across 1,000 samples out of 900,000 possibilities, duplicate rate should be near zero (< 5)
  assert.ok(
    generated.size >= sampleSize - 5,
    `Expected high uniqueness across ${sampleSize} samples, got ${generated.size}`,
  );
});

test("isValid6DigitId correctly identifies valid and invalid formats", () => {
  assert.equal(isValid6DigitId("100000"), true);
  assert.equal(isValid6DigitId("849201"), true);
  assert.equal(isValid6DigitId("999999"), true);
  assert.equal(isValid6DigitId(849201), true);

  // Invalid: leading zeros
  assert.equal(isValid6DigitId("012345"), false);
  // Invalid: length != 6
  assert.equal(isValid6DigitId("12345"), false);
  assert.equal(isValid6DigitId("1234567"), false);
  // Invalid: non-numeric
  assert.equal(isValid6DigitId("84920A"), false);
  assert.equal(isValid6DigitId("c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d"), false);
  assert.equal(isValid6DigitId(null), false);
  assert.equal(isValid6DigitId(undefined), false);
  assert.equal(isValid6DigitId(""), false);
});
