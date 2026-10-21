import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhilippinePhoneNumber,
  isValidPhilippineMobile,
  maskPhoneNumber,
} from "./phoneUtils.js";

test("phoneUtils: normalizePhilippinePhoneNumber handles valid formats", () => {
  const cases = [
    "+639171234567",
    "639171234567",
    "09171234567",
    "9171234567",
    "+63 917 123 4567",
    "0917-123-4567",
    "(+63) 917-123-4567",
  ];

  for (const c of cases) {
    const res = normalizePhilippinePhoneNumber(c);
    assert.equal(res.isValid, true, `Expected ${c} to be valid`);
    assert.equal(res.local, "09171234567");
    assert.equal(res.e164, "+639171234567");
    assert.equal(res.digits, "639171234567");
    assert.equal(res.tenDigits, "9171234567");
    assert.equal(isValidPhilippineMobile(c), true);
  }
});

test("phoneUtils: normalizePhilippinePhoneNumber rejects invalid numbers", () => {
  const invalidCases = [
    "",
    null,
    undefined,
    "12345",
    "+14155552671",      // US number
    "08171234567",       // doesn't start with 9
    "0917123456",        // 1 digit too short
    "091712345678",      // 1 digit too long
    "+638123456789",     // doesn't start with 9
    "abcdefghijk",
  ];

  for (const c of invalidCases) {
    const res = normalizePhilippinePhoneNumber(c);
    assert.equal(res.isValid, false, `Expected ${c} to be invalid`);
    assert.equal(res.local, null);
    assert.equal(res.e164, null);
    assert.equal(isValidPhilippineMobile(c), false);
  }
});

test("phoneUtils: maskPhoneNumber correctly masks phone number", () => {
  assert.equal(maskPhoneNumber("+639171234567"), "+63 9•• ••• 4567");
  assert.equal(maskPhoneNumber("09171234567"), "+63 9•• ••• 4567");
  assert.equal(maskPhoneNumber("09987654321"), "+63 9•• ••• 4321");
  assert.equal(maskPhoneNumber("invalid"), "••••alid");
});
