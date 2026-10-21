import test from "node:test";
import assert from "node:assert/strict";
import { IprogSmsService, SMS_ERROR_CODES } from "./iprogsms.service.js";

test("iProgSMS Service: successfully sends SMS when gateway returns 200", async () => {
  let capturedUrl = null;
  let capturedBody = null;

  const mockFetch = async (url, options) => {
    capturedUrl = url;
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          status: 200,
          message: "Your SMS message has been successfully added to the queue.",
          message_id: "iSms-Test12345",
        }),
    };
  };

  const service = new IprogSmsService({
    apiToken: "valid_test_token_123",
    customFetch: mockFetch,
  });

  const res = await service.sendSms({
    to: "+639171234567",
    message: "Your CitiSent OTP is: 123456",
  });

  assert.equal(res.success, true);
  assert.equal(res.messageId, "iSms-Test12345");
  assert.equal(capturedUrl, "https://www.iprogsms.com/api/v1/sms_messages");
  assert.equal(capturedBody.phone_number, "09171234567");
  assert.equal(capturedBody.api_token, "valid_test_token_123");
});

test("iProgSMS Service: handles invalid credentials response", async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 401,
    text: async () => JSON.stringify({ status: 500, message: "Invalid Token" }),
  });

  const service = new IprogSmsService({
    apiToken: "bad_token",
    customFetch: mockFetch,
  });

  await assert.rejects(
    () => service.sendSms({ to: "09171234567", message: "Test" }),
    (err) => {
      assert.equal(err.code, SMS_ERROR_CODES.INVALID_CREDENTIALS);
      assert.equal(err.statusCode, 503);
      return true;
    },
  );
});

test("iProgSMS Service: handles insufficient credits response", async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 400,
    text: async () =>
      JSON.stringify({ status: "error", message: "Insufficient SMS credit balance" }),
  });

  const service = new IprogSmsService({
    apiToken: "valid_token",
    customFetch: mockFetch,
  });

  await assert.rejects(
    () => service.sendSms({ to: "09171234567", message: "Test" }),
    (err) => {
      assert.equal(err.code, SMS_ERROR_CODES.INSUFFICIENT_CREDITS);
      assert.equal(err.statusCode, 503);
      return true;
    },
  );
});

test("iProgSMS Service: handles rate limit 429", async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 429,
    text: async () => JSON.stringify({ message: "Too many requests" }),
  });

  const service = new IprogSmsService({
    apiToken: "valid_token",
    customFetch: mockFetch,
  });

  await assert.rejects(
    () => service.sendSms({ to: "09171234567", message: "Test" }),
    (err) => {
      assert.equal(err.code, SMS_ERROR_CODES.RATE_LIMITED);
      assert.equal(err.statusCode, 429);
      return true;
    },
  );
});

test("iProgSMS Service: handles network timeout", async () => {
  const mockFetch = async () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    throw error;
  };

  const service = new IprogSmsService({
    apiToken: "valid_token",
    customFetch: mockFetch,
  });

  await assert.rejects(
    () => service.sendSms({ to: "09171234567", message: "Test" }),
    (err) => {
      assert.equal(err.code, SMS_ERROR_CODES.NETWORK_ERROR);
      assert.equal(err.statusCode, 504);
      return true;
    },
  );
});

test("iProgSMS Service: rejects invalid phone number before making network call", async () => {
  let called = false;
  const mockFetch = async () => {
    called = true;
    return {};
  };

  const service = new IprogSmsService({
    apiToken: "valid_token",
    customFetch: mockFetch,
  });

  await assert.rejects(
    () => service.sendSms({ to: "12345", message: "Test" }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );

  assert.equal(called, false);
});

test("iProgSMS Service: simulation mode when API token is empty in dev/test", async () => {
  const service = new IprogSmsService({ apiToken: "" });
  const res = await service.sendSms({ to: "09171234567", message: "Test" });
  assert.equal(res.success, true);
  assert.equal(res.simulated, true);
});
