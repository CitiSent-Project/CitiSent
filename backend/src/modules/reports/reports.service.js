import { reportsRepository } from "./reports.repository.js";
import { toReportResponse } from "./reports.mapper.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import { AppError } from "../../shared/errors/appError.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "../../config/logger.js";
import {
  buildReportsListCacheKey,
  buildReportsUserCachePrefix,
} from "./reports.cache.js";
import {
  reportsSentimentClient,
  REPORT_URGENCY_FALLBACK,
  REPORT_EMOTION_FALLBACK,
} from "./reports.sentiment.js";
import { departmentsService } from "../departments/departments.service.js";

function buildReportCreatePayload({
  userId,
  issueType,
  description,
  location,
  attachmentUrl,
  urgency,
  emotionLevel,
  aiSummary,
}) {
  return {
    user_id: userId,
    issue_type: issueType,
    description,
    location,
    ...(attachmentUrl ? { attachment_url: attachmentUrl } : {}),
    sentiment_label: urgency,
    ...(emotionLevel != null ? { emotion_level: emotionLevel } : {}),
    ...(aiSummary != null ? { ai_summary: aiSummary } : {}),
    status: "pending",
  };
}

function buildReportUpdatePayload(payload) {
  return {
    ...(payload.issueType !== undefined ? { issue_type: payload.issueType } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.location !== undefined ? { location: payload.location } : {}),
    ...(payload.attachmentUrl !== undefined
      ? { attachment_url: payload.attachmentUrl }
      : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
  };
}

function shouldReclassifyReport(payload) {
  return (
    payload.issueType !== undefined ||
    payload.description !== undefined ||
    payload.location !== undefined
  );
}

function buildAnalysisInput(payload, existingReport = {}) {
  return {
    issueType: payload.issueType ?? existingReport.issue_type ?? "",
    description: payload.description ?? existingReport.description ?? "",
    location: payload.location ?? existingReport.location ?? "",
  };
}

async function resolveAnalysisWithFallback({
  issueType,
  location,
  description,
  reportId = null,
}) {
  try {
    const analysis = await reportsSentimentClient.analyzeReport({
      issueType,
      location,
      description,
    });

    return {
      urgency: analysis.urgency,
      emotionLevel: analysis.emotion ?? REPORT_EMOTION_FALLBACK,
      aiSummary: analysis.summary ?? null,
    };
  } catch (error) {
    logger.warn("Sentiment analysis failed. Using fallback urgency.", {
      reportId,
      issueType,
      fallbackUrgency: REPORT_URGENCY_FALLBACK,
      message: error?.message || String(error),
    });

    return { urgency: REPORT_URGENCY_FALLBACK, emotionLevel: REPORT_EMOTION_FALLBACK, aiSummary: null };
  }
}

async function resolveActiveDepartment({ accessToken, value }) {
  return departmentsService.getActiveDepartmentByValue({
    accessToken,
    value,
  });
}

export const reportsService = {
  async listReports({ userId, limit, offset, status, accessToken }) {
    const cacheKey = buildReportsListCacheKey({
      userId,
      limit,
      offset,
      status,
    });

    const cached = await cacheService.getJSON(cacheKey);
    if (cached) return cached;

    const result = await reportsRepository.list({
      userId,
      limit,
      offset,
      status,
      accessToken,
    });

    const response = {
      data: result.rows.map(toReportResponse),
      pagination: {
        total: result.count,
        limit,
        offset,
      },
    };

    await cacheService.setJSON(cacheKey, response);

    return response;
  },

  async createReport({
    userId,
    issueType,
    description,
    location,
    attachmentUrl,
    accessToken,
  }) {
    const department = await resolveActiveDepartment({
      accessToken,
      value: issueType,
    });

    const { urgency, emotionLevel, aiSummary } = await resolveAnalysisWithFallback({
      issueType: department?.name || issueType,
      description,
      location,
    });

    const created = await reportsRepository.create(
      buildReportCreatePayload({
        userId,
        issueType: department?.slug || issueType,
        description,
        location,
        attachmentUrl,
        urgency,
        emotionLevel,
        aiSummary,
      }),
      accessToken,
    );

    await cacheService.deleteByPrefix(buildReportsUserCachePrefix(userId));

    return toReportResponse(created);
  },

  async getReportById({ userId, reportId, accessToken }) {
    const row = await reportsRepository.getById({
      userId,
      reportId,
      accessToken,
    });

    if (!row) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    return toReportResponse(row);
  },

  async updateReport({ userId, reportId, payload, accessToken }) {
    const existingReport = await reportsRepository.getById({
      userId,
      reportId,
      accessToken,
    });

    if (!existingReport) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    const updatePayload = buildReportUpdatePayload(payload);
    let resolvedDepartment = null;

    if (payload.issueType !== undefined) {
      resolvedDepartment = await resolveActiveDepartment({
        accessToken,
        value: payload.issueType,
      });
      updatePayload.issue_type = resolvedDepartment?.slug || payload.issueType;
    }

    if (shouldReclassifyReport(payload)) {
      const nextAnalysisInput = buildAnalysisInput(
        {
          ...payload,
          issueType: resolvedDepartment?.name || payload.issueType,
        },
        existingReport,
      );
      const { urgency: nextUrgency, emotionLevel: nextEmotion, aiSummary: nextSummary } =
        await resolveAnalysisWithFallback({
          reportId,
          ...nextAnalysisInput,
        });
      updatePayload.sentiment_label = nextUrgency;
      updatePayload.emotion_level = nextEmotion;
      if (nextSummary != null) {
        updatePayload.ai_summary = nextSummary;
      }
    }

    const updated = await reportsRepository.updateById({
      userId,
      reportId,
      payload: updatePayload,
      accessToken,
    });

    if (!updated) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    await cacheService.deleteByPrefix(buildReportsUserCachePrefix(userId));

    return toReportResponse(updated);
  },

  async deleteReport({ userId, reportId, accessToken }) {
    const deleted = await reportsRepository.deleteById({
      userId,
      reportId,
      accessToken,
    });

    if (!deleted) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    await cacheService.deleteByPrefix(buildReportsUserCachePrefix(userId));
  },
};
