import { StatusCodes } from "http-status-codes";
import { reportsService } from "./reports.service.js";

export const reportsController = {
  async list(req, res) {
    const { limit, offset, status } = req.query;

    const result = await reportsService.listReports({
      userId: req.user.id,
      limit,
      offset,
      status,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  },

  async create(req, res) {
    const created = await reportsService.createReport({
      userId: req.user.id,
      ...req.body,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: created,
    });
  },
};
