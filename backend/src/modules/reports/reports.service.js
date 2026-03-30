import { reportsRepository } from "./reports.repository.js";
import { toReportResponse } from "./reports.mapper.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import { AppError } from "../../shared/errors/appError.js";
import { StatusCodes } from "http-status-codes";
import {
  buildReportsListCacheKey,
  buildReportsUserCachePrefix,
} from "./reports.cache.js";

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
    sentimentLabel,
    accessToken,
  }) {
    // Use correct snake_case keys for DB insert
    const created = await reportsRepository.create(
      {
        user_id: userId,
        issue_type: issueType,
        description,
        location,
        // Only include attachment_url if present
        ...(attachmentUrl ? { attachment_url: attachmentUrl } : {}),
        ...(sentimentLabel ? { sentiment_label: sentimentLabel } : {}),
        status: "pending",
      },
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
    const updatePayload = {
      ...(payload.issueType !== undefined
        ? { issue_type: payload.issueType }
        : {}),
      ...(payload.description !== undefined
        ? { description: payload.description }
        : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...(payload.attachmentUrl !== undefined
        ? { attachment_url: payload.attachmentUrl }
        : {}),
      ...(payload.sentimentLabel !== undefined
        ? { sentiment_label: payload.sentimentLabel }
        : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    };

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
