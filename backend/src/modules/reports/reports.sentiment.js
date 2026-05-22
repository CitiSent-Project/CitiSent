import { StatusCodes } from "http-status-codes";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/appError.js";

export const SUPPORTED_REPORT_URGENCY_LEVELS = Object.freeze([
  "Critical",
  "High",
  "Medium",
  "Low",
]);

export const SUPPORTED_REPORT_EMOTION_LEVELS = Object.freeze([
  "Sad",
  "Happy",
  "Frustrated",
  "Angry",
  "Disappointed",
  "Excited",
  "Delighted",
  "Neutral",
]);

export const REPORT_URGENCY_FALLBACK = "Medium";
export const REPORT_EMOTION_FALLBACK = "Neutral";

export function normalizeReportUrgency(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  return (
    SUPPORTED_REPORT_URGENCY_LEVELS.find(
      (urgency) => urgency.toLowerCase() === normalizedValue,
    ) || null
  );
}

export function normalizeReportEmotion(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  return (
    SUPPORTED_REPORT_EMOTION_LEVELS.find(
      (emotion) => emotion.toLowerCase() === normalizedValue,
    ) || null
  );
}

export function buildSentimentAnalysisPayload({
  issueType,
  location,
  description,
}) {
  return {
    office: String(issueType || "").trim(),
    location: String(location || "").trim(),
    description: String(description || "").trim(),
  };
}

function toErrorDetails(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name || "Error",
    message: error.message || String(error),
  };
}

async function parseSentimentResponse(response) {
  try {
    return await response.json();
  } catch (error) {
    throw new AppError(
      "Sentiment service returned malformed JSON",
      StatusCodes.BAD_GATEWAY,
      toErrorDetails(error),
    );
  }
}

function toSentimentServiceError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

export const reportsSentimentClient = {
  async analyzeReport(input, options = {}) {
    const payload = buildSentimentAnalysisPayload(input);
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    const apiUrl = options.apiUrl ?? env.SENTIMENT_API_URL;
    const timeoutMs = options.timeoutMs ?? env.SENTIMENT_API_TIMEOUT_MS;

    if (typeof fetchImpl !== "function") {
      throw new AppError(
        "Sentiment service fetch is unavailable",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let response;

    try {
      response = await fetchImpl(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new AppError(
          "Sentiment service timed out",
          StatusCodes.GATEWAY_TIMEOUT,
          {
            apiUrl,
            timeoutMs,
          },
        );
      }

      throw toSentimentServiceError(
        "Sentiment service request failed",
        toErrorDetails(error),
      );
    } finally {
      clearTimeout(timeoutHandle);
    }

    const responsePayload = await parseSentimentResponse(response);

    if (!response.ok) {
      throw toSentimentServiceError("Sentiment service request failed", {
        status: response.status,
        detail:
          responsePayload?.detail ||
          responsePayload?.message ||
          "Unknown sidecar error",
      });
    }

    const urgency = normalizeReportUrgency(responsePayload?.urgency);

    if (!urgency) {
      throw toSentimentServiceError(
        "Sentiment service returned unsupported urgency",
        {
          urgency: responsePayload?.urgency ?? null,
        },
      );
    }

    const emotion = normalizeReportEmotion(responsePayload?.emotion) || REPORT_EMOTION_FALLBACK;

    return {
      urgency,
      emotion,
      confidence:
        typeof responsePayload?.confidence === "number"
          ? responsePayload.confidence
          : null,
      summary: typeof responsePayload?.summary === "string"
        ? responsePayload.summary.trim()
        : null,
    };
  },
};
