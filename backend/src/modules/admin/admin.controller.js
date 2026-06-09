import { StatusCodes } from "http-status-codes";
import { adminService } from "./admin.service.js";

export const adminController = {
  async listUsers(req, res) {
    const result = await adminService.listUsers({
      actor: req.actor,
      accessToken: req.accessToken,
      limit: req.query.limit,
      offset: req.query.offset,
      search: req.query.search,
      status: req.query.status,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  },

  async getUserById(req, res) {
    const result = await adminService.getUserById({
      actor: req.actor,
      accessToken: req.accessToken,
      userId: req.params.userId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async createUser(req, res) {
    const result = await adminService.createUser({
      actor: req.actor,
      accessToken: req.accessToken,
      payload: req.body,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  },

  async updateUser(req, res) {
    const result = await adminService.updateUser({
      actor: req.actor,
      accessToken: req.accessToken,
      userId: req.params.userId,
      payload: req.body,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async banUser(req, res) {
    const result = await adminService.banUser({
      actor: req.actor,
      accessToken: req.accessToken,
      userId: req.params.userId,
      reason: req.body.reason,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async unbanUser(req, res) {
    const result = await adminService.unbanUser({
      actor: req.actor,
      accessToken: req.accessToken,
      userId: req.params.userId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async listReports(req, res) {
    const result = await adminService.listReports({
      actor: req.actor,
      accessToken: req.accessToken,
      limit: req.query.limit,
      offset: req.query.offset,
      status: req.query.status,
      userId: req.query.userId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  },

  async getReportById(req, res) {
    const result = await adminService.getReportById({
      actor: req.actor,
      accessToken: req.accessToken,
      reportId: req.params.reportId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async updateReport(req, res) {
    const result = await adminService.updateReportStatus({
      actor: req.actor,
      accessToken: req.accessToken,
      reportId: req.params.reportId,
      status: req.body.status,
      adminMessage: req.body.adminMessage,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async listOfficeAdmins(req, res) {
    const result = await adminService.listOfficeAdmins({
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async assignOfficeDepartment(req, res) {
    const result = await adminService.assignOfficeAdminDepartment({
      accessToken: req.accessToken,
      adminUserId: req.params.adminId,
      departmentId: req.body.departmentId,
      departmentLabel: req.body.departmentLabel,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async listTransferRequests(req, res) {
    const result = await adminService.listTransferRequests({
      actor: req.actor,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async createTransferRequest(req, res) {
    const result = await adminService.createTransferRequest({
      actor: req.actor,
      accessToken: req.accessToken,
      requestedDepartmentId: req.body.requestedDepartmentId,
      requestedDepartmentLabel: req.body.requestedDepartmentLabel,
      reason: req.body.reason,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  },

  async approveTransferRequest(req, res) {
    const result = await adminService.approveTransferRequest({
      actor: req.actor,
      accessToken: req.accessToken,
      requestId: req.params.id,
      reviewNotes: req.body.reviewNotes,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async rejectTransferRequest(req, res) {
    const result = await adminService.rejectTransferRequest({
      actor: req.actor,
      accessToken: req.accessToken,
      requestId: req.params.id,
      reviewNotes: req.body.reviewNotes,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async getDashboardSummary(req, res) {
    const result = await adminService.getDashboardSummary({
      actor: req.actor,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async getDashboardReportsByStatus(req, res) {
    const result = await adminService.getDashboardReportsByStatus({
      actor: req.actor,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async getDashboardReportsByCategory(req, res) {
    const result = await adminService.getDashboardReportsByCategory({
      actor: req.actor,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async getDashboardWeeklyTrend(req, res) {
    const result = await adminService.getDashboardWeeklyTrend({
      actor: req.actor,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async getDashboardRecentAdmins(req, res) {
    const result = await adminService.getDashboardRecentAdmins({
      actor: req.actor,
      accessToken: req.accessToken,
      limit: req.query.limit,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async getDashboardRecentUsers(req, res) {
    const result = await adminService.getDashboardRecentUsers({
      actor: req.actor,
      accessToken: req.accessToken,
      limit: req.query.limit,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },
};
