import { env } from "../config/env.js";

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildBaseUrl() {
  const raw = String(process.env.CHAT_SMOKE_BASE_URL || "").trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }

  return `http://localhost:${env.PORT}`;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await readJson(response);
  return { response, body };
}

function assertOk(response, body, expectedStatuses, label) {
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${label} failed with status ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`,
    );
  }
}

async function main() {
  const accessToken = requireEnv("CHAT_SMOKE_ACCESS_TOKEN");
  const reportId = requireEnv("CHAT_SMOKE_REPORT_ID");
  const baseUrl = buildBaseUrl();
  const reportMessagesBase = `${baseUrl}${env.API_PREFIX}/reports/${reportId}/messages`;
  const uniqueSuffix = Date.now().toString(36);
  const smokeMessage = `Chat smoke test ${uniqueSuffix}`;

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Testing report: ${reportId}`);

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const listResult = await requestJson(reportMessagesBase, { headers });
  assertOk(listResult.response, listResult.body, [200], "GET /messages");
  console.log("GET /messages ok");

  const createResult = await requestJson(reportMessagesBase, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: smokeMessage }),
  });
  assertOk(createResult.response, createResult.body, [200, 201], "POST /messages");
  console.log("POST /messages ok");

  const createdMessageId = createResult.body?.data?.id;
  if (!createdMessageId) {
    throw new Error("POST /messages did not return a message id");
  }

  const markReadResult = await requestJson(`${reportMessagesBase}/read`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ messageIds: [createdMessageId] }),
  });
  assertOk(markReadResult.response, markReadResult.body, [200], "PATCH /messages/read");
  console.log("PATCH /messages/read ok");

  console.log("Chat smoke test completed successfully");
}

main().catch((error) => {
  console.error("Chat smoke test failed");
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
