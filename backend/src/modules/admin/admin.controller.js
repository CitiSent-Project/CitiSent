import { StatusCodes } from "http-status-codes";
import { adminService } from "./admin.service.js";

export const adminController = {
  async listReports(req, res) {
    const result = await adminService.listReports({
      actor: req.actor,
      accessToken: req.accessToken,
      limit: req.query.limit,
      offset: req.query.offset,
      status: req.query.status,
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
};
