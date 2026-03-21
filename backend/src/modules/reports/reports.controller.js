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
      accessToken: req.accessToken,
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
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: created,
    });
  },

  async getById(req, res) {
    const result = await reportsService.getReportById({
      userId: req.user.id,
      reportId: req.params.reportId,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async update(req, res) {
    const result = await reportsService.updateReport({
      userId: req.user.id,
      reportId: req.params.reportId,
      payload: req.body,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async remove(req, res) {
    await reportsService.deleteReport({
      userId: req.user.id,
      reportId: req.params.reportId,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.NO_CONTENT).send();
  },
};
