import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../errors/appError.js";
import { StatusCodes } from "http-status-codes";
import { normalizePhilippinePhoneNumber, maskPhoneNumber } from "../utils/phoneUtils.js";

const DEFAULT_TIMEOUT_MS = 10_000;

export const SMS_ERROR_CODES = {
  MISSING_CREDENTIALS: "SMS_MISSING_CREDENTIALS",
  INVALID_CREDENTIALS: "SMS_INVALID_CREDENTIALS",
  INSUFFICIENT_CREDITS: "SMS_INSUFFICIENT_CREDITS",
  RATE_LIMITED: "SMS_RATE_LIMITED",
  INVALID_PHONE: "SMS_INVALID_PHONE",
  CONTENT_REJECTED: "SMS_CONTENT_REJECTED",
  NETWORK_ERROR: "SMS_NETWORK_ERROR",
  PROVIDER_UNAVAILABLE: "SMS_PROVIDER_UNAVAILABLE",
};

/**
 * Classifies an error response from iProgSMS or fetch into a standardized error object.
 */
function classifyIprogSmsError(httpStatus, responseBody, originalError = null) {
  const message = String(responseBody?.message || originalError?.message || "").toLowerCase();
  const bodyStatus = responseBody?.status;

  if (originalError?.name === "AbortError" || originalError?.code === "ETIMEDOUT") {
    return {
      code: SMS_ERROR_CODES.NETWORK_ERROR,
      status: StatusCodes.GATEWAY_TIMEOUT,
      publicMessage: "SMS service request timed out. Please try again.",
      diagnostic: "Gateway connection to iProgSMS timed out.",
    };
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    message.includes("invalid token") ||
    message.includes("unauthorized")
  ) {
    return {
      code: SMS_ERROR_CODES.INVALID_CREDENTIALS,
      status: StatusCodes.SERVICE_UNAVAILABLE,
      publicMessage: "SMS service is temporarily unavailable. Please try again later.",
      diagnostic: "iProgSMS authentication failed: Invalid or missing API token.",
    };
  }

  if (
    message.includes("credit") ||
    message.includes("insufficient") ||
    message.includes("balance") ||
    message.includes("no load")
  ) {
    return {
      code: SMS_ERROR_CODES.INSUFFICIENT_CREDITS,
      status: StatusCodes.SERVICE_UNAVAILABLE,
      publicMessage: "SMS verification is currently unavailable. Please try again later.",
      diagnostic: "iProgSMS account has insufficient SMS credits.",
    };
  }

  if (httpStatus === 429 || message.includes("too many requests") || message.includes("rate limit")) {
    return {
      code: SMS_ERROR_CODES.RATE_LIMITED,
      status: StatusCodes.TOO_MANY_REQUESTS,
      publicMessage: "Too many SMS requests sent. Please wait a while before requesting another code.",
      diagnostic: "iProgSMS rate limit reached.",
    };
  }

  if (
    message.includes("invalid phone") ||
    message.includes("format") ||
    message.includes("recipient") ||
    message.includes("phone number")
  ) {
    return {
      code: SMS_ERROR_CODES.INVALID_PHONE,
      status: StatusCodes.BAD_REQUEST,
      publicMessage: "Please enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
      diagnostic: `iProgSMS rejected recipient phone format: ${message}`,
    };
  }

  if (message.includes("suspicious") || message.includes("phishing") || message.includes("content")) {
    return {
      code: SMS_ERROR_CODES.CONTENT_REJECTED,
      status: StatusCodes.BAD_REQUEST,
      publicMessage: "Message content could not be delivered.",
      diagnostic: "iProgSMS rejected message content.",
    };
  }

  if (httpStatus >= 500 || bodyStatus >= 500) {
    return {
      code: SMS_ERROR_CODES.PROVIDER_UNAVAILABLE,
      status: StatusCodes.BAD_GATEWAY,
      publicMessage: "SMS service provider is temporarily down. Please try again shortly.",
      diagnostic: `iProgSMS server returned HTTP ${httpStatus}: ${message}`,
    };
  }

  return {
    code: SMS_ERROR_CODES.PROVIDER_UNAVAILABLE,
    status: StatusCodes.BAD_GATEWAY,
    publicMessage: "Failed to send SMS verification code. Please try again.",
    diagnostic: `iProgSMS unexpected error: HTTP ${httpStatus} - ${message}`,
  };
}

export class IprogSmsService {
  constructor({
    apiToken = env.IPROGSMS_API_TOKEN,
    apiUrl = env.IPROGSMS_API_URL,
    smsProvider = env.IPROGSMS_SMS_PROVIDER,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    customFetch = null,
  } = {}) {
    this.apiToken = apiToken;
    this.apiUrl = (apiUrl || "https://www.iprogsms.com/api/v1").replace(/\/+$/, "");
    this.smsProvider = smsProvider ?? 0;
    this.timeoutMs = timeoutMs;
    this._fetch = customFetch || globalThis.fetch;
  }

  /**
   * Checks whether iProgSMS credentials are configured.
   */
  isConfigured() {
    return Boolean(this.apiToken && this.apiToken.trim().length > 0);
  }

  /**
   * Sends an SMS message using iProgSMS official REST endpoint.
   *
   * @param {Object} options
   * @param {string} options.to - Recipient Philippine mobile number
   * @param {string} options.message - SMS message text
   * @returns {Promise<{ success: boolean, messageId?: string, message: string }>}
   */
  async sendSms({ to, message }) {
    const norm = normalizePhilippinePhoneNumber(to);
    if (!norm.isValid) {
      throw new AppError(
        "Invalid Philippine phone number. Please provide a valid 11-digit mobile number.",
        StatusCodes.BAD_REQUEST,
      );
    }

    if (!this.isConfigured()) {
      // In development or test without credentials, log a warning and return mock result
      if (env.isDev || env.NODE_ENV === "test") {
        logger.warn(
          `[iProgSMS] API token not configured. Simulating SMS dispatch to ${maskPhoneNumber(to)} in ${env.NODE_ENV} mode.`,
        );
        return {
          success: true,
          simulated: true,
          messageId: `mock-sms-${Date.now()}`,
          message: "SMS simulated (no IPROGSMS_API_TOKEN set)",
        };
      }

      logger.error("[iProgSMS] Cannot send SMS: IPROGSMS_API_TOKEN is not configured.");
      throw new AppError(
        "SMS gateway is not configured on the server. Please contact system support.",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const endpoint = this.apiUrl.endsWith("/sms_messages")
      ? this.apiUrl
      : `${this.apiUrl}/sms_messages`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    // iProgSMS documentation specifies recipient as 09XXXXXXXXX or +639XXXXXXXXX
    // Using local 09XXXXXXXXX format is the most universally accepted by local PH carriers
    const recipient = norm.local;

    const requestPayload = {
      api_token: this.apiToken,
      phone_number: recipient,
      message,
      sms_provider: this.smsProvider,
    };

    try {
      const response = await this._fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const rawText = await response.text();
      let responseBody = null;
      try {
        responseBody = JSON.parse(rawText);
      } catch {
        responseBody = { message: rawText };
      }

      // Check for success: iProgSMS returns status: 200 or status: "success"
      const isSuccess =
        response.ok &&
        (responseBody?.status === 200 ||
          responseBody?.status === "success" ||
          responseBody?.status === "200" ||
          Boolean(responseBody?.message_id));

      if (!isSuccess) {
        const classified = classifyIprogSmsError(response.status, responseBody);
        logger.error("[iProgSMS] SMS dispatch rejected by gateway", {
          recipient: maskPhoneNumber(to),
          code: classified.code,
          diagnostic: classified.diagnostic,
          httpStatus: response.status,
        });

        const appError = new AppError(classified.publicMessage, classified.status);
        appError.code = classified.code;
        throw appError;
      }

      const messageId = responseBody?.message_id || responseBody?.data?.message_id || null;

      logger.info("[iProgSMS] SMS successfully queued for delivery", {
        recipient: maskPhoneNumber(to),
        messageId,
      });

      return {
        success: true,
        messageId,
        message: responseBody?.message || "SMS message added to queue.",
      };
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof AppError) {
        throw err;
      }

      const classified = classifyIprogSmsError(0, null, err);
      logger.error("[iProgSMS] Network error while calling SMS gateway", {
        recipient: maskPhoneNumber(to),
        diagnostic: classified.diagnostic,
        originalError: err.message,
      });

      const appError = new AppError(classified.publicMessage, classified.status);
      appError.code = classified.code;
      throw appError;
    }
  }

  /**
   * Formats and sends an OTP verification code via SMS.
   *
   * @param {Object} options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.otp - 6-digit OTP string
   * @param {number} [options.expiryMinutes=5] - Validity duration in minutes
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendOtp({ to, otp, expiryMinutes = 5 }) {
    const text = `Your CitiSent verification code is: ${otp}. It is valid for ${expiryMinutes} minute(s). Never share this code with anyone.`;
    return this.sendSms({ to, message: text });
  }

  /**
   * Checks current SMS credit balance from iProgSMS.
   * Endpoint: GET /api/v1/account/sms_credits?api_token=...
   */
  async checkCredits() {
    if (!this.isConfigured()) {
      return { configured: false, loadBalance: 0 };
    }

    const endpoint = `${this.apiUrl}/account/sms_credits?api_token=${encodeURIComponent(this.apiToken)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this._fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);

      const data = await response.json();
      return {
        configured: true,
        loadBalance: data?.data?.load_balance ?? null,
        status: data?.status,
        message: data?.message,
      };
    } catch (err) {
      clearTimeout(timer);
      logger.error("[iProgSMS] Failed to query SMS credits", { error: err.message });
      throw classifyIprogSmsError(0, null, err);
    }
  }
}

export const iprogsmsService = new IprogSmsService();
