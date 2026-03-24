import { StatusCodes } from "http-status-codes";
import { adminRepository } from "./admin.repository.js";
import {
  canSubmitTransferRequest,
  isSuperadmin,
} from "../../shared/auth/roleAccess.js";
import { AppError } from "../../shared/errors/appError.js";
import {
  resolveDepartmentId,
  resolveDepartmentLabel,
} from "../../shared/data/departments.js";
import {
  mapReportStatusInputToPersisted,
  toAdminReportResponse,
  toOfficeAdminResponse,
  toTransferRequestResponse,
} from "./admin.mapper.js";

export const adminService = {
  async listReports({ actor, accessToken, limit, offset, status }) {
    const result = await adminRepository.listReports({
      actor,
      accessToken,
      limit,
      offset,
      status,
    });

    return {
      data: result.rows.map((row) =>
        toAdminReportResponse({
          reportRow: row,
          reporterProfile: result.reporterProfilesByUserId[row.user_id] || null,
        }),
      ),
      pagination: {
        total: result.count,
        limit,
        offset,
      },
    };
  },

  async getReportById({ actor, accessToken, reportId }) {
    const result = await adminRepository.getReportById({
      actor,
      accessToken,
      reportId,
    });

    if (!result) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    return toAdminReportResponse({
      reportRow: result.row,
      reporterProfile: result.reporterProfile,
    });
  },

  async updateReportStatus({ actor, accessToken, reportId, status }) {
    const result = await adminRepository.updateReportById({
      actor,
      accessToken,
      reportId,
      payload: {
        status: mapReportStatusInputToPersisted(status),
      },
    });

    if (!result) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    return toAdminReportResponse({
      reportRow: result.row,
      reporterProfile: result.reporterProfile,
    });
  },

  async listOfficeAdmins({ accessToken }) {
    const profiles = await adminRepository.listOfficeAdmins({
      accessToken,
    });

    return profiles.map(toOfficeAdminResponse);
  },

  async assignOfficeAdminDepartment({
    accessToken,
    adminUserId,
    departmentId,
    departmentLabel,
  }) {
    const officeAdmin = await adminRepository.getOfficeAdminByUserId({
      accessToken,
      adminUserId,
    });

    if (!officeAdmin) {
      throw new AppError("Office admin not found", StatusCodes.NOT_FOUND);
    }

    const resolvedDepartmentId = resolveDepartmentId(departmentId || departmentLabel);
    const resolvedDepartmentLabel = resolveDepartmentLabel(
      departmentLabel || departmentId,
    );

    const updatedOfficeAdmin = await adminRepository.updateOfficeAdminDepartment({
      accessToken,
      adminUserId,
      departmentId: resolvedDepartmentId || departmentId,
      departmentLabel: resolvedDepartmentLabel || departmentLabel,
    });

    if (!updatedOfficeAdmin) {
      throw new AppError("Office admin not found", StatusCodes.NOT_FOUND);
    }

    return toOfficeAdminResponse(updatedOfficeAdmin);
  },

  async listTransferRequests({ actor, accessToken }) {
    const rows = await adminRepository.listTransferRequests({
      actor,
      accessToken,
    });

    return rows.map(toTransferRequestResponse);
  },

  async createTransferRequest({
    actor,
    accessToken,
    requestedDepartmentId,
    requestedDepartmentLabel,
    reason,
  }) {
    if (!canSubmitTransferRequest(actor?.role)) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    const existingPendingRequest =
      await adminRepository.getPendingTransferRequestForAdmin({
        accessToken,
        adminUserId: actor.id,
      });

    if (existingPendingRequest) {
      throw new AppError(
        "You already have a pending transfer request.",
        StatusCodes.CONFLICT,
      );
    }

    const resolvedDepartmentId = resolveDepartmentId(
      requestedDepartmentId || requestedDepartmentLabel,
    );
    const resolvedDepartmentLabel = resolveDepartmentLabel(
      requestedDepartmentLabel || requestedDepartmentId,
    );

    const createdRequest = await adminRepository.createTransferRequest({
      accessToken,
      payload: {
        admin_user_id: actor.id,
        admin_name: actor.fullName || actor.email || "Office Admin",
        current_department_id: actor.departmentId,
        current_department_label: actor.departmentLabel,
        requested_department_id: resolvedDepartmentId || requestedDepartmentId,
        requested_department_label:
          resolvedDepartmentLabel || requestedDepartmentLabel,
        reason,
        status: "pending",
      },
    });

    return toTransferRequestResponse(createdRequest);
  },

  async approveTransferRequest({ actor, accessToken, requestId, reviewNotes }) {
    if (!isSuperadmin(actor?.role)) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    const request = await adminRepository.getTransferRequestById({
      accessToken,
      requestId,
    });

    if (!request) {
      throw new AppError("Transfer request not found", StatusCodes.NOT_FOUND);
    }

    if (request.status !== "pending") {
      throw new AppError(
        "The selected request is no longer pending.",
        StatusCodes.CONFLICT,
      );
    }

    await adminRepository.updateOfficeAdminDepartment({
      accessToken,
      adminUserId: request.admin_user_id,
      departmentId: request.requested_department_id,
      departmentLabel: request.requested_department_label,
    });

    const reviewedRequest = await adminRepository.updateTransferRequestReview({
      accessToken,
      requestId,
      status: "approved",
      reviewerId: actor.id,
      reviewerName: actor.fullName || actor.email || "Superadmin",
      reviewNotes: reviewNotes || "Approved by superadmin.",
    });

    return toTransferRequestResponse(reviewedRequest);
  },

  async rejectTransferRequest({ actor, accessToken, requestId, reviewNotes }) {
    if (!isSuperadmin(actor?.role)) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    const request = await adminRepository.getTransferRequestById({
      accessToken,
      requestId,
    });

    if (!request) {
      throw new AppError("Transfer request not found", StatusCodes.NOT_FOUND);
    }

    if (request.status !== "pending") {
      throw new AppError(
        "The selected request is no longer pending.",
        StatusCodes.CONFLICT,
      );
    }

    const reviewedRequest = await adminRepository.updateTransferRequestReview({
      accessToken,
      requestId,
      status: "rejected",
      reviewerId: actor.id,
      reviewerName: actor.fullName || actor.email || "Superadmin",
      reviewNotes,
    });

    return toTransferRequestResponse(reviewedRequest);
  },
};
