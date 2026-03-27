import { StatusCodes } from "http-status-codes";
import { adminRepository } from "./admin.repository.js";
import {
  canSubmitTransferRequest,
  isSuperadmin,
  normalizeAccountType,
  normalizeUserRole,
  USER_ROLES,
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
  toAdminUserResponse,
  toTransferRequestResponse,
} from "./admin.mapper.js";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeOptionalString(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || null;
}

function buildUsername({ username, fullName, email }) {
  const provided = normalizeOptionalString(username);
  if (provided) {
    return provided.toLowerCase();
  }

  const fullNameCandidate = String(fullName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const emailCandidate = String(email || "")
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return (fullNameCandidate || emailCandidate || "user").slice(0, 40);
}

function buildTemporaryPassword() {
  return `Temp#${Math.random().toString(36).slice(2, 10)}A1`;
}

function assertSuperadmin(actor) {
  if (!isSuperadmin(actor?.role)) {
    throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
  }
}

export const adminService = {
  async listUsers({ actor, accessToken, limit, offset, search, status }) {
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

    const result = await adminRepository.listUsers({
      actor,
      accessToken,
      limit: normalizedLimit,
      offset: normalizedOffset,
      search,
      status,
    });

    return {
      data: result.rows.map((profile) =>
        toAdminUserResponse({
          profile,
          activeBan: result.activeBansByUserId[profile.user_id] || null,
        }),
      ),
      pagination: {
        total: result.count,
        limit: normalizedLimit,
        offset: normalizedOffset,
      },
    };
  },

  async getUserById({ actor, accessToken, userId }) {
    const result = await adminRepository.getUserById({
      actor,
      accessToken,
      userId,
    });

    if (!result) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    return toAdminUserResponse({
      profile: result.profile,
      activeBan: result.activeBan,
    });
  },

  async createUser({ actor, accessToken, payload }) {
    assertSuperadmin(actor);

    const normalizedEmail = normalizeEmail(payload.email);
    const normalizedPhoneNumber = payload.phoneNumber
      ? normalizePhoneNumber(payload.phoneNumber)
      : null;
    const normalizedAccountType = normalizeAccountType(
      payload.accountType,
      payload.role,
    );
    const normalizedRole =
      normalizedAccountType === "admin"
        ? normalizeUserRole(payload.role || USER_ROLES.OFFICE_ADMIN)
        : "";
    const username = buildUsername({
      username: payload.username,
      fullName: payload.fullName,
      email: normalizedEmail,
    });
    const temporaryPassword = buildTemporaryPassword();

    const createdAuthUser = await adminRepository.createAuthUser({
      email: normalizedEmail,
      password: temporaryPassword,
      userMetadata: {
        username,
        fullName: payload.fullName,
        phoneNumber: normalizedPhoneNumber,
      },
    });

    if (!createdAuthUser?.id) {
      throw new AppError(
        "Failed to create authentication account",
        StatusCodes.BAD_GATEWAY,
      );
    }

    let createdProfile = null;

    try {
      createdProfile = await adminRepository.createUserProfile({
        accessToken,
        userId: createdAuthUser.id,
        payload: {
          email: normalizedEmail,
          username,
          full_name: payload.fullName,
          phone_number: normalizedPhoneNumber,
          address: normalizeOptionalString(payload.address),
          account_type: normalizedAccountType,
          role: normalizedRole || null,
          department_id: normalizeOptionalString(payload.departmentId),
          department_label: normalizeOptionalString(payload.departmentLabel),
        },
      });
    } catch (error) {
      await adminRepository.deleteAuthUserById({ userId: createdAuthUser.id });
      throw error;
    }

    if (!createdProfile) {
      await adminRepository.deleteAuthUserById({ userId: createdAuthUser.id });
      throw new AppError("Failed to create user profile", StatusCodes.BAD_GATEWAY);
    }

    if (payload.status === "banned") {
      await adminRepository.banUser({
        accessToken,
        actorId: actor.id,
        userId: createdProfile.user_id,
        reason: "Banned on account creation",
      });
    }

    const result = await adminRepository.getUserById({
      actor,
      accessToken,
      userId: createdProfile.user_id,
    });

    return {
      ...toAdminUserResponse({
        profile: result?.profile || createdProfile,
        activeBan: result?.activeBan || null,
      }),
      temporaryPassword,
    };
  },

  async updateUser({ actor, accessToken, userId, payload }) {
    if (payload.role !== undefined && !isSuperadmin(actor?.role)) {
      throw new AppError(
        "Only superadmins can modify user roles",
        StatusCodes.FORBIDDEN,
      );
    }

    const existingUser = await adminRepository.getUserById({
      actor,
      accessToken,
      userId,
    });

    if (!existingUser) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    const normalizedRole =
      payload.role !== undefined ? normalizeUserRole(payload.role) || null : undefined;
    const normalizedPhoneNumber =
      payload.phoneNumber !== undefined
        ? payload.phoneNumber
          ? normalizePhoneNumber(payload.phoneNumber)
          : null
        : undefined;

    const profilePayload = {
      ...(payload.fullName !== undefined ? { full_name: payload.fullName } : {}),
      ...(payload.username !== undefined ? { username: payload.username } : {}),
      ...(normalizedPhoneNumber !== undefined
        ? { phone_number: normalizedPhoneNumber }
        : {}),
      ...(payload.address !== undefined
        ? { address: normalizeOptionalString(payload.address) }
        : {}),
      ...(normalizedRole !== undefined ? { role: normalizedRole } : {}),
      ...(payload.departmentId !== undefined
        ? { department_id: normalizeOptionalString(payload.departmentId) }
        : {}),
      ...(payload.departmentLabel !== undefined
        ? { department_label: normalizeOptionalString(payload.departmentLabel) }
        : {}),
    };

    let updatedProfile = existingUser.profile;
    if (Object.keys(profilePayload).length > 0) {
      updatedProfile = await adminRepository.updateUserProfile({
        accessToken,
        userId,
        payload: profilePayload,
      });
    }

    if (payload.status === "banned") {
      await adminRepository.banUser({
        accessToken,
        actorId: actor.id,
        userId,
        reason: "Banned by admin",
      });
    }

    if (payload.status === "active") {
      await adminRepository.unbanUser({
        accessToken,
        actorId: actor.id,
        userId,
      });
    }

    const result = await adminRepository.getUserById({
      actor,
      accessToken,
      userId,
    });

    if (!result) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    return toAdminUserResponse({
      profile: result.profile || updatedProfile,
      activeBan: result.activeBan,
    });
  },

  async banUser({ actor, accessToken, userId, reason }) {
    assertSuperadmin(actor);

    const existingUser = await adminRepository.getUserById({
      actor,
      accessToken,
      userId,
    });

    if (!existingUser) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    await adminRepository.banUser({
      accessToken,
      actorId: actor.id,
      userId,
      reason,
    });

    const result = await adminRepository.getUserById({
      actor,
      accessToken,
      userId,
    });

    return toAdminUserResponse({
      profile: result?.profile || existingUser.profile,
      activeBan: result?.activeBan || null,
    });
  },

  async unbanUser({ actor, accessToken, userId }) {
    assertSuperadmin(actor);

    const existingUser = await adminRepository.getUserById({
      actor,
      accessToken,
      userId,
    });

    if (!existingUser) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    await adminRepository.unbanUser({
      accessToken,
      actorId: actor.id,
      userId,
    });

    const result = await adminRepository.getUserById({
      actor,
      accessToken,
      userId,
    });

    return toAdminUserResponse({
      profile: result?.profile || existingUser.profile,
      activeBan: result?.activeBan || null,
    });
  },

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
