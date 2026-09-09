import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

/**
 * Pluggable SMS Provider abstraction for CitiSent.
 * Supports:
 * - 'mock': In development/test mode, logs OTP safely (dev only) and returns mock delivery.
 * - 'semaphore': Semaphore SMS gateway (popular in the Philippines, https://semaphore.co).
 * - 'twilio': Twilio Programmable Messaging API.
 */

class MockSmsProvider {
  constructor() {
    this.sentMessages = [];
  }

  async sendOtp({ phoneNumber, otp }) {
    this.sentMessages.push({ phoneNumber, otp, timestamp: Date.now() });

    if (!env.isProduction) {
      logger.info(`[SMS MOCK] Verification code for ${phoneNumber}: ${otp}`);
    }

    return {
      success: true,
      provider: "mock",
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  getLastMessageFor(phoneNumber) {
    return this.sentMessages
      .slice()
      .reverse()
      .find((msg) => msg.phoneNumber === phoneNumber);
  }

  clear() {
    this.sentMessages = [];
  }
}

class SemaphoreSmsProvider {
  constructor({ apiKey, senderName }) {
    this.apiKey = apiKey;
    this.senderName = senderName || "CitiSent";
  }

  async sendOtp({ phoneNumber, otp }) {
    if (!this.apiKey) {
      throw new Error("Semaphore API key is not configured");
    }

    const message = `Your CitiSent verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: this.apiKey,
        number: phoneNumber,
        message,
        sendername: this.senderName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Semaphore SMS failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      provider: "semaphore",
      data,
    };
  }
}

class TwilioSmsProvider {
  constructor({ accountSid, authToken, fromNumber }) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendOtp({ phoneNumber, otp }) {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error("Twilio SMS credentials are not fully configured");
    }

    const message = `Your CitiSent verification code is: ${otp}. Valid for 5 minutes.`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To: phoneNumber,
      From: this.fromNumber,
      Body: message,
    });

    const credentials = Buffer.from(
      `${this.accountSid}:${this.authToken}`,
    ).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio SMS failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      provider: "twilio",
      messageId: data.sid,
    };
  }
}

export const mockSmsProvider = new MockSmsProvider();

export function getSmsProvider() {
  const providerType = (env.SMS_PROVIDER || "mock").toLowerCase().trim();

  switch (providerType) {
    case "semaphore":
      return new SemaphoreSmsProvider({
        apiKey: env.SEMAPHORE_API_KEY,
        senderName: env.SEMAPHORE_SENDER_NAME,
      });

    case "twilio":
      return new TwilioSmsProvider({
        accountSid: env.TWILIO_ACCOUNT_SID,
        authToken: env.TWILIO_AUTH_TOKEN,
        fromNumber: env.TWILIO_PHONE_NUMBER,
      });

    case "mock":
    default:
      return mockSmsProvider;
  }
}

export const smsProvider = {
  async sendOtp(params) {
    const provider = getSmsProvider();
    return provider.sendOtp(params);
  },
};
