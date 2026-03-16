import { reportsRepository } from "./reports.repository.js";
import { toReportResponse } from "./reports.mapper.js";

export const reportsService = {
  async listReports({ userId, limit, offset, status }) {
    const result = await reportsRepository.list({
      userId,
      limit,
      offset,
      status,
    });

    return {
      data: result.rows.map(toReportResponse),
      pagination: {
        total: result.count,
        limit,
        offset,
      },
    };
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

    return toReportResponse(created);
  },
};
