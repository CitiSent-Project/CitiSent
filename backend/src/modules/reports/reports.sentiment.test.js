import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSentimentAnalysisPayload,
  normalizeReportUrgency,
  reportsSentimentClient,
} from "./reports.sentiment.js";

test("buildSentimentAnalysisPayload trims values before sending to the sidecar", () => {
  const payload = buildSentimentAnalysisPayload({
    issueType: "  Flooding  ",
    location: "  Riverside  ",
    description: "  Water level is rising quickly.  ",
  });

  assert.deepEqual(payload, {
    office: "Flooding",
    location: "Riverside",
    description: "Water level is rising quickly.",
  });
});

test("normalizeReportUrgency accepts the supported urgency labels", () => {
  assert.equal(normalizeReportUrgency("critical"), "Critical");
  assert.equal(normalizeReportUrgency("High"), "High");
  assert.equal(normalizeReportUrgency(" Medium "), "Medium");
  assert.equal(normalizeReportUrgency("low"), "Low");
  assert.equal(normalizeReportUrgency("emergency"), null);
});

test("reportsSentimentClient.analyzeReport posts report data to the sidecar", async () => {
  const requests = [];

  const result = await reportsSentimentClient.analyzeReport(
    {
      issueType: "  Flooding  ",
      location: "  Riverside  ",
      description: "  Water level is rising quickly.  ",
    },
    {
      apiUrl: "http://127.0.0.1:8000/analyze",
      fetchImpl: async (url, options) => {
        requests.push({
          url,
          options,
          payload: JSON.parse(options.body),
        });

        return {
          ok: true,
          json: async () => ({
            urgency: "Critical",
            confidence: 0.9731,
          }),
        };
      },
    },
  );

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "http://127.0.0.1:8000/analyze");
  assert.equal(requests[0].options.method, "POST");
  assert.deepEqual(requests[0].payload, {
    office: "Flooding",
    location: "Riverside",
    description: "Water level is rising quickly.",
  });
  assert.deepEqual(result, {
    urgency: "Critical",
    emotion: "Neutral",
    confidence: 0.9731,
    summary: null,
  });
});

test("reportsSentimentClient.analyzeReport surfaces sidecar timeouts", async () => {
  await assert.rejects(
    reportsSentimentClient.analyzeReport(
      {
        issueType: "Flooding",
        location: "Riverside",
        description: "Water level is rising quickly.",
      },
      {
        timeoutMs: 10,
        fetchImpl: async (_url, options) =>
          new Promise((_, reject) => {
            options.signal.addEventListener("abort", () => {
              const error = new Error("The operation was aborted.");
              error.name = "AbortError";
              reject(error);
            });
          }),
      },
    ),
    (error) => {
      assert.equal(error.message, "Sentiment service timed out");
      assert.equal(error.statusCode, 504);
      return true;
    },
  );
});

test("reportsSentimentClient.analyzeReport rejects malformed JSON", async () => {
  await assert.rejects(
    reportsSentimentClient.analyzeReport(
      {
        issueType: "Flooding",
        location: "Riverside",
        description: "Water level is rising quickly.",
      },
      {
        fetchImpl: async () => ({
          ok: true,
          json: async () => {
            throw new SyntaxError("Unexpected token");
          },
        }),
      },
    ),
    (error) => {
      assert.equal(error.message, "Sentiment service returned malformed JSON");
      assert.equal(error.statusCode, 502);
      return true;
    },
  );
});

test("reportsSentimentClient.analyzeReport rejects unsupported urgency labels", async () => {
  await assert.rejects(
    reportsSentimentClient.analyzeReport(
      {
        issueType: "Flooding",
        location: "Riverside",
        description: "Water level is rising quickly.",
      },
      {
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({
            urgency: "Emergency",
            confidence: 0.92,
          }),
        }),
      },
    ),
    (error) => {
      assert.equal(error.message, "Sentiment service returned unsupported urgency");
      assert.equal(error.statusCode, 502);
      return true;
    },
  );
});

test("reportsSentimentClient.getChatSuggestions posts context data and returns suggestions", async () => {
  const requests = [];

  const result = await reportsSentimentClient.getChatSuggestions(
    {
      latestUserMessage: "Need help immediately",
      conversationContext: [{ sender: "Citizen", text: "Need help immediately" }],
      reportCategory: "Flooding",
      urgency: "Critical",
      detectedEmotion: "Sad",
    },
    {
      apiUrl: "http://127.0.0.1:8000/analyze",// Hide this
      fetchImpl: async (url, options) => {
        requests.push({
          url,
          options,
          payload: JSON.parse(options.body),
        });

        return {
          ok: true,
          json: async () => ({
            suggestedReplies: [
              { text: "Reply 1", rank: 1 },
              { text: "Reply 2", rank: 2 },
              { text: "Reply 3", rank: 3 },
              { text: "Reply 4", rank: 4 }
            ],
            tone: "urgent",
            confidence: 0.95,
            reason: "Flooding urgent context",
            triggerEmotion: "Sad",
            fallbackMessage: "Help is on the way"
          }),
        };
      },
    },
  );

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "http://127.0.0.1:8000/chat/suggestions"); // Hide this
  assert.equal(requests[0].options.method, "POST");
  assert.deepEqual(requests[0].payload, {
    latestUserMessage: "Need help immediately",
    conversationContext: [{ sender: "Citizen", text: "Need help immediately" }],
    reportCategory: "Flooding",
    urgency: "Critical",
    detectedEmotion: "Sad",
  });
  assert.equal(result.suggestedReplies.length, 4);
  assert.equal(result.tone, "urgent");
});

