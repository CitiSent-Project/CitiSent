import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimitHandler } from "./rateLimiter.js";

test("createRateLimitHandler sends 429 JSON response with Retry-After header", () => {
  const handler = createRateLimitHandler(
    ({ retryAfterMinutes }) =>
      `Too many failed attempts. Wait ${retryAfterMinutes} minute(s).`,
  );

  const headers = {};
  let responseStatusCode = null;
  let responseJson = null;

  const req = {
    requestId: "req-test-123",
    rateLimit: {
      resetTime: new Date(Date.now() + 120_000), // 2 minutes from now
    },
  };

  const res = {
    setHeader(key, value) {
      headers[key] = value;
    },
    status(code) {
      responseStatusCode = code;
      return this;
    },
    json(body) {
      responseJson = body;
      return this;
    },
  };

  const options = {
    statusCode: 429,
    windowMs: 900_000,
  };

  handler(req, res, () => {}, options);

  assert.equal(responseStatusCode, 429);
  assert.equal(responseJson.success, false);
  assert.equal(responseJson.code, "TOO_MANY_REQUESTS");
  assert.match(responseJson.message, /Too many failed attempts\. Wait 2 minute\(s\)\./);
  assert.ok(responseJson.retryAfterSeconds >= 115 && responseJson.retryAfterSeconds <= 120);
  assert.ok(headers["Retry-After"] >= "115");
});

test("createRateLimitHandler handles fallback when resetTime is missing", () => {
  const handler = createRateLimitHandler("Rate limit reached. Try again later.");

  let responseStatusCode = null;
  let responseJson = null;

  const req = {
    requestId: "req-test-456",
  };

  const res = {
    setHeader() {},
    status(code) {
      responseStatusCode = code;
      return this;
    },
    json(body) {
      responseJson = body;
      return this;
    },
  };

  const options = {
    statusCode: 429,
    windowMs: 60_000, // 60s
  };

  handler(req, res, () => {}, options);

  assert.equal(responseStatusCode, 429);
  assert.equal(responseJson.message, "Rate limit reached. Try again later.");
  assert.equal(responseJson.retryAfterSeconds, 60);
});
