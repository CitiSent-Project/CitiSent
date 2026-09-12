import { reportsRepository } from "./reports.repository.js";
import { toReportResponse } from "./reports.mapper.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import { AppError } from "../../shared/errors/appError.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "../../config/logger.js";
import {
  buildReportsListCacheKey,
  buildReportsCountsCacheKey,
  buildReportsUnreadSummaryCacheKey,
  buildReportsUserCachePrefix,
} from "./reports.cache.js";
import {
  reportsSentimentClient,
  REPORT_URGENCY_FALLBACK,
  REPORT_EMOTION_FALLBACK,
} from "./reports.sentiment.js";
import { departmentsService } from "../departments/departments.service.js";
import { emitReportFeedChanged } from "../../realtime/reportFeedEvents.js";
import { verifyTurnstileToken } from "../../shared/security/turnstile.js";
import { authRepository } from "../auth/auth.repository.js";

const ST_LAT_MIN = 13.9796305;
const ST_LAT_MAX = 14.1473362;
const ST_LON_MIN = 121.1250228;
const ST_LON_MAX = 121.2319705;

function isWithinStoTomas(latitude, longitude) {
  if (latitude == null || longitude == null) return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    lat >= ST_LAT_MIN &&
    lat <= ST_LAT_MAX &&
    lng >= ST_LON_MIN &&
    lng <= ST_LON_MAX
  );
}

function buildReportCreatePayload({
  userId,
  issueType,
  description,
  location,
  latitude,
  longitude,
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
    latitude,
    longitude,
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
    ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
    ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
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

  async getReportCounts({ userId, accessToken }) {
    const cacheKey = buildReportsCountsCacheKey(userId);
    const cached = await cacheService.getJSON(cacheKey);
    if (cached) return cached;

    const counts = await reportsRepository.getCountsByStatus({ userId, accessToken });
    await cacheService.setJSON(cacheKey, counts, 60);
    return counts;
  },

  async getUnreadSummary({ userId, accessToken }) {
    const cacheKey = buildReportsUnreadSummaryCacheKey(userId);
    const cached = await cacheService.getJSON(cacheKey);
    if (cached) return cached;

    const summary = await reportsRepository.getUnreadSummary({ userId, accessToken });
    await cacheService.setJSON(cacheKey, summary, 30);
    return summary;
  },

  async createReport({
    userId,
    actor,
    issueType,
    description,
    location,
    latitude,
    longitude,
    attachmentUrl,
    accessToken,
    turnstileToken,
    remoteIp,
  }) {
    // ── Guest CAPTCHA verification (Cloudflare Turnstile) ───────────────────────
    // The backend determines guest status from the verified JWT (actor.isGuest).
    // We never trust is_guest from the request body.
    if (actor?.isGuest) {
      if (!turnstileToken || typeof turnstileToken !== "string" || !turnstileToken.trim()) {
        const error = new AppError(
          "Please complete the verification before submitting your report.",
          StatusCodes.FORBIDDEN,
        );
        error.code = "CAPTCHA_REQUIRED";
        throw error;
      }

      let turnstileResult;
      try {
        turnstileResult = await verifyTurnstileToken(turnstileToken, remoteIp);
      } catch {
        const error = new AppError(
          "We couldn't verify your request right now. Please try again.",
          StatusCodes.BAD_GATEWAY,
        );
        error.code = "CAPTCHA_SERVICE_ERROR";
        throw error;
      }

      if (!turnstileResult.success) {
        const errorCodes = turnstileResult.errorCodes || [];
        const isNetworkError = errorCodes.includes("cloudflare-network-error");
        const isMissingKey = errorCodes.includes("missing-secret-key");

        if (isNetworkError || isMissingKey) {
          const error = new AppError(
            "We couldn't verify your request right now. Please try again.",
            StatusCodes.BAD_GATEWAY,
          );
          error.code = "CAPTCHA_SERVICE_ERROR";
          throw error;
        }

        const error = new AppError(
          "Verification failed. Please try again.",
          StatusCodes.FORBIDDEN,
        );
        error.code = "CAPTCHA_INVALID";
        throw error;
      }

      // Anti-spam duplicate check: reject exact same report from guest within 60s
      const duplicateKey = `guest:report:dupe:${actor.id}:${issueType}:${location}:${description}`.slice(0, 150);
      const isDuplicate = await cacheService.getJSON(duplicateKey);
      if (isDuplicate) {
        throw new AppError(
          "Duplicate report detected. Please wait a moment before submitting again.",
          StatusCodes.TOO_MANY_REQUESTS,
        );
      }
      await cacheService.setJSON(duplicateKey, true, 60);
    }

    if (latitude === undefined || longitude === undefined) {
      throw new AppError("Location coordinates (latitude and longitude) are required.", StatusCodes.BAD_REQUEST);
    }
    if (!isWithinStoTomas(latitude, longitude)) {
      throw new AppError("The selected location is outside Sto. Tomas City, Batangas.", StatusCodes.BAD_REQUEST);
    }

    const department = await resolveActiveDepartment({
      accessToken,
      value: issueType,
    });

    const { urgency, emotionLevel, aiSummary } = await resolveAnalysisWithFallback({
      issueType: department?.name || issueType,
      description,
      location,
    });

    // ── Ensure Guest Database Identity ─────────────────────────────────────────
    // If the reporter is a guest, ensure their user_id exists in auth.users and profiles
    // so the foreign-key constraint reports_user_id_fkey is always satisfied.
    let resolvedUserId = userId;
    if (actor?.isGuest) {
      const guestIdentity = await authRepository.ensureGuestUser(userId);
      if (guestIdentity?.id) {
        resolvedUserId = guestIdentity.id;
      }
    }

    const created = await reportsRepository.create(
      buildReportCreatePayload({
        userId: resolvedUserId,
        issueType: department?.slug || issueType,
        description,
        location,
        latitude,
        longitude,
        attachmentUrl,
        urgency,
        emotionLevel,
        aiSummary,
      }),
      accessToken,
    );

    await Promise.all([
      cacheService.deleteByPrefix(buildReportsUserCachePrefix(resolvedUserId)),
      cacheService.deleteByPrefix("admin:reports:"),
    ]);

    const response = toReportResponse(created);

    // Emit report feed event after successful persistence.
    emitReportFeedChanged({
      reportId: response.id,
      changeType: "created",
      userId: resolvedUserId,
      departmentId: department?.slug || issueType,
    });

    return response;
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

    if (existingReport.status && existingReport.status.toLowerCase() !== "pending") {
      throw new AppError("This report can no longer be edited because it has already been reviewed by an administrator.", StatusCodes.FORBIDDEN);
    }

    if (payload.latitude !== undefined || payload.longitude !== undefined || payload.location !== undefined) {
      const lat = payload.latitude !== undefined ? payload.latitude : existingReport.latitude;
      const lng = payload.longitude !== undefined ? payload.longitude : existingReport.longitude;
      
      if (lat === null || lng === null || lat === undefined || lng === undefined) {
        throw new AppError("Location coordinates (latitude and longitude) are required.", StatusCodes.BAD_REQUEST);
      }
      if (!isWithinStoTomas(lat, lng)) {
        throw new AppError("The selected location is outside Sto. Tomas City, Batangas.", StatusCodes.BAD_REQUEST);
      }
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

    await Promise.all([
      cacheService.deleteByPrefix(buildReportsUserCachePrefix(userId)),
      cacheService.deleteByPrefix("admin:reports:"),
    ]);

    const response = toReportResponse(updated);

    // Emit report feed event after successful persistence.
    emitReportFeedChanged({
      reportId: response.id,
      changeType: "updated",
      userId,
      departmentId: updated.issue_type || null,
    });

    return response;
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

    await Promise.all([
      cacheService.deleteByPrefix(buildReportsUserCachePrefix(userId)),
      cacheService.deleteByPrefix("admin:reports:"),
    ]);

    // Emit report feed event after successful deletion.
    emitReportFeedChanged({
      reportId,
      changeType: "deleted",
      userId,
      departmentId: deleted.issue_type || null,
    });
  },
};
