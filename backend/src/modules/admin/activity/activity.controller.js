import { StatusCodes } from "http-status-codes";
import { activityService } from "./activity.service.js";

export const activityController = {
  async listActivityLog(req, res) {
    const result = await activityService.listActivityLog({
      actor: req.actor,
      accessToken: req.accessToken,
      adminId: req.query.adminId,
      limit: req.query.limit,
      offset: req.query.offset,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  },

  async createActivityLogEntry(req, res) {
    const result = await activityService.createActivityLogEntry({
      actor: req.actor,
      accessToken: req.accessToken,
      adminId: req.body.adminId,
      action: req.body.action,
      detail: req.body.detail,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  },
};
