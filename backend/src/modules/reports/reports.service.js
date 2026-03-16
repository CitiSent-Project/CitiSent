import { reportsRepository } from "./reports.repository.js";
import { toReportResponse } from "./reports.mapper.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import {
  buildReportsListCacheKey,
  buildReportsUserCachePrefix,
} from "./reports.cache.js";

export const reportsService = {
  async listReports({ userId, limit, offset, status }) {
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
  }) {
    const created = await reportsRepository.create({
      user_id: userId,
      issue_type: issueType,
      description,
      location,
      attachment_url: attachmentUrl ?? null,
      sentiment_label: sentimentLabel ?? null,
      status: "pending",
    });

    await cacheService.deleteByPrefix(buildReportsUserCachePrefix(userId));

    return toReportResponse(created);
  },
};
