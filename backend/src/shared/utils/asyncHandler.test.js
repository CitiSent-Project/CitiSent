import test from "node:test";
import assert from "node:assert/strict";
import { asyncHandler } from "./asyncHandler.js";
import { requestContext } from "../../middlewares/requestContext.js";

test("asyncHandler passes errors to next when headers have not been sent", async () => {
  let passedError = null;
  const expectedError = new Error("Database connection lost");

  const req = {};
  const res = { headersSent: false };
  const next = (err) => {
    passedError = err;
  };

  const wrapped = asyncHandler(async () => {
    throw expectedError;
  });

  await wrapped(req, res, next);
  assert.equal(passedError, expectedError);
});

test("asyncHandler suppresses errors when res.headersSent is true", async () => {
  let nextCalled = false;

  const req = {};
  const res = { headersSent: true };
  const next = () => {
    nextCalled = true;
  };

  const wrapped = asyncHandler(async () => {
    throw new Error("ERR_HTTP_HEADERS_SENT simulation");
  });

  await wrapped(req, res, next);
  assert.equal(nextCalled, false, "next() should not be called when headersSent is true");
});

test("requestContext safe json/send wrapper prevents throwing when headersSent is true", () => {
  let originalJsonCalled = false;
  let originalSendCalled = false;

  const req = { method: "GET", originalUrl: "/test" };
  const res = {
    headersSent: false,
    setHeader: () => {},
    on: () => {},
    writeHead: () => {},
    json(data) {
      originalJsonCalled = true;
      return this;
    },
    send(data) {
      originalSendCalled = true;
      return this;
    },
  };

  requestContext(req, res, () => {});

  // Test 1: When headersSent is false, original methods are invoked
  res.json({ ok: true });
  assert.equal(originalJsonCalled, true);
  res.send("ok");
  assert.equal(originalSendCalled, true);

  // Test 2: When headersSent is true, safe wrappers return res without calling originals
  originalJsonCalled = false;
  originalSendCalled = false;
  res.headersSent = true;

  const jsonResult = res.json({ ok: false });
  assert.equal(originalJsonCalled, false, "Original json should not be called after headers are sent");
  assert.equal(jsonResult, res, "res.json should return res for chaining");

  const sendResult = res.send("late data");
  assert.equal(originalSendCalled, false, "Original send should not be called after headers are sent");
  assert.equal(sendResult, res, "res.send should return res for chaining");
});
