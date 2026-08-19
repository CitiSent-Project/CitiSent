import test from "node:test";
import assert from "node:assert/strict";

import { logger } from "../../config/logger.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import { reportsRepository } from "./reports.repository.js";
import {
  REPORT_URGENCY_FALLBACK,
  reportsSentimentClient,
} from "./reports.sentiment.js";
import { reportsService } from "./reports.service.js";
import { departmentsService } from "../departments/departments.service.js";
import { buildReportsUserCachePrefix } from "./reports.cache.js";

function createReportRow(overrides = {}) {
  return {
    id: "report-1",
    issue_type: "Flooding",
    description: "Water level is rising quickly near the bridge.",
    location: "Riverside",
    latitude: 14.0,
    longitude: 121.15,
    status: "pending",
    sentiment_label: "Critical",
    attachment_url: null,
    created_at: "2026-04-16T00:00:00.000Z",
    updated_at: "2026-04-16T00:00:00.000Z",
    user_id: "user-1",
    ...overrides,
  };
}

function stubCommonDependencies(t) {
  const originalAnalyzeReport = reportsSentimentClient.analyzeReport;
  const originalRepositoryCreate = reportsRepository.create;
  const originalRepositoryGetById = reportsRepository.getById;
  const originalRepositoryUpdateById = reportsRepository.updateById;
  const originalDeleteByPrefix = cacheService.deleteByPrefix;
  const originalGetActiveDepartment = departmentsService.getActiveDepartmentByValue;
  const originalLoggerWarn = logger.warn;

  departmentsService.getActiveDepartmentByValue = async () => null;

  t.after(() => {
    reportsSentimentClient.analyzeReport = originalAnalyzeReport;
    reportsRepository.create = originalRepositoryCreate;
    reportsRepository.getById = originalRepositoryGetById;
    reportsRepository.updateById = originalRepositoryUpdateById;
    cacheService.deleteByPrefix = originalDeleteByPrefix;
    departmentsService.getActiveDepartmentByValue = originalGetActiveDepartment;
    logger.warn = originalLoggerWarn;
  });
}


test("createReport stores AI-generated urgency and ignores client sentimentLabel", async (t) => {
  stubCommonDependencies(t);

  let capturedCreatePayload = null;
  let deletedPrefix = null;

  reportsSentimentClient.analyzeReport = async (payload) => {
    assert.deepEqual(payload, {
      issueType: "Flooding",
      location: "Riverside",
      description: "Water level is rising quickly near the bridge.",
    });

    return {
      urgency: "Critical",
      confidence: 0.97,
    };
  };

  reportsRepository.create = async (payload) => {
    capturedCreatePayload = payload;
    return createReportRow({
      sentiment_label: payload.sentiment_label,
      attachment_url: payload.attachment_url || null,
    });
  };

  cacheService.deleteByPrefix = async (prefix) => {
    deletedPrefix = prefix;
  };

  const result = await reportsService.createReport({
    userId: "user-1",
    issueType: "Flooding",
    location: "Riverside",
    latitude: 14.0,
    longitude: 121.15,
    description: "Water level is rising quickly near the bridge.",
    attachmentUrl: "https://example.com/report.jpg",
    sentimentLabel: "Low",
    accessToken: "token-123",
  });

  assert.equal(capturedCreatePayload.sentiment_label, "Critical");
  assert.equal(capturedCreatePayload.attachment_url, "https://example.com/report.jpg");
  assert.ok(!("sentimentLabel" in capturedCreatePayload));
  assert.equal(result.sentimentLabel, "Critical");
  assert.equal(deletedPrefix, buildReportsUserCachePrefix("user-1"));
});

test("createReport falls back to Moderate when sentiment analysis fails", async (t) => {
  stubCommonDependencies(t);

  let capturedCreatePayload = null;
  let warningMeta = null;

  reportsSentimentClient.analyzeReport = async () => {
    throw new Error("sidecar unavailable");
  };

  logger.warn = (_message, meta) => {
    warningMeta = meta;
  };

  reportsRepository.create = async (payload) => {
    capturedCreatePayload = payload;
    return createReportRow({
      sentiment_label: payload.sentiment_label,
    });
  };

  cacheService.deleteByPrefix = async () => {};

  const result = await reportsService.createReport({
    userId: "user-1",
    issueType: "Streetlight",
    location: "Main Avenue",
    latitude: 14.0,
    longitude: 121.15,
    description: "The streetlight has been out for three days already.",
    accessToken: "token-123",
  });

  assert.equal(capturedCreatePayload.sentiment_label, REPORT_URGENCY_FALLBACK);
  assert.equal(result.sentimentLabel, REPORT_URGENCY_FALLBACK);
  assert.equal(warningMeta.fallbackUrgency, REPORT_URGENCY_FALLBACK);
});

test("updateReport reclassifies urgency when report text changes", async (t) => {
  stubCommonDependencies(t);

  let capturedUpdatePayload = null;
  let deletedPrefix = null;

  reportsRepository.getById = async () => createReportRow();

  reportsSentimentClient.analyzeReport = async (payload) => {
    assert.deepEqual(payload, {
      issueType: "Flooding",
      location: "Riverside",
      description: "Flood water is already entering nearby homes.",
    });

    return {
      urgency: "Critical",
      confidence: 0.99,
    };
  };

  reportsRepository.updateById = async ({ payload }) => {
    capturedUpdatePayload = payload;
    return createReportRow({
      description: payload.description,
      sentiment_label: payload.sentiment_label,
    });
  };

  cacheService.deleteByPrefix = async (prefix) => {
    deletedPrefix = prefix;
  };

  const result = await reportsService.updateReport({
    userId: "user-1",
    reportId: "report-1",
    payload: {
      description: "Flood water is already entering nearby homes.",
      sentimentLabel: "Low",
    },
    accessToken: "token-123",
  });

  assert.equal(
    capturedUpdatePayload.description,
    "Flood water is already entering nearby homes.",
  );
  assert.equal(capturedUpdatePayload.sentiment_label, "Critical");
  assert.ok(!("sentimentLabel" in capturedUpdatePayload));
  assert.equal(result.sentimentLabel, "Critical");
  assert.equal(deletedPrefix, buildReportsUserCachePrefix("user-1"));
});

test("updateReport keeps the existing urgency when only non-text fields change", async (t) => {
  stubCommonDependencies(t);

  let analyzeCalls = 0;
  let capturedUpdatePayload = null;

  reportsRepository.getById = async () =>
    createReportRow({
      sentiment_label: "High",
    });

  reportsSentimentClient.analyzeReport = async () => {
    analyzeCalls += 1;
    return {
      urgency: "Critical",
      confidence: 0.99,
    };
  };

  reportsRepository.updateById = async ({ payload }) => {
    capturedUpdatePayload = payload;
    return createReportRow({
      attachment_url: payload.attachment_url,
      sentiment_label: "High",
    });
  };

  cacheService.deleteByPrefix = async () => {};

  const result = await reportsService.updateReport({
    userId: "user-1",
    reportId: "report-1",
    payload: {
      attachmentUrl: "https://example.com/updated.jpg",
    },
    accessToken: "token-123",
  });

  assert.equal(analyzeCalls, 0);
  assert.equal(capturedUpdatePayload.attachment_url, "https://example.com/updated.jpg");
  assert.ok(!("sentiment_label" in capturedUpdatePayload));
  assert.equal(result.sentimentLabel, "High");
});
