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
  buildDepartmentCandidates,
} from "../../shared/data/departments.js";
import {
  mapReportStatusInputToPersisted,
  toAdminReportResponse,
  toOfficeAdminResponse,
  toAdminUserResponse,
  toTransferRequestResponse,
} from "./admin.mapper.js";
import { notificationsRepository } from "./notifications/notifications.repository.js";
import { logger } from "../../config/logger.js";
import { getStatusNotificationContent } from "../../shared/data/reportStatusNotifications.js";
import { departmentsService } from "../departments/departments.service.js";

const MANILA_TIME_ZONE = "Asia/Manila";
const REPORT_STATUS_KEYS = ["pending", "in_review", "resolved", "rejected"];
const REPORT_STATUS_LABELS = Object.freeze({
  pending: "Pending",
  in_review: "In Progress",
  resolved: "Resolved",
  rejected: "Unresolved",
});

function normalizeDashboardLimit(limit) {
  const normalizedLimit = Number(limit);
  if (!Number.isFinite(normalizedLimit)) {
    return 5;
  }

  return Math.max(1, Math.min(20, Math.trunc(normalizedLimit)));
}

function buildDateParts(value, timeZone = MANILA_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return {
    year,
    month,
    day,
    key: `${year}-${month}-${day}`,
  };
}

function buildWeekdayLabel(value, timeZone = MANILA_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(new Date(value));
}

function normalizeReportStatus(status) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  return REPORT_STATUS_KEYS.includes(normalizedStatus)
    ? normalizedStatus
    : "pending";
}

function filterOfficeAdminsByScope(rows = [], actor) {
  if (isSuperadmin(actor?.role)) {
    return rows;
  }

  const actorCandidates = buildDepartmentCandidates({
    departmentId: actor?.departmentId,
    departmentLabel: actor?.departmentLabel,
  });

  if (actorCandidates.length === 0) {
    return [];
  }

  const normalizedActorCandidates = new Set(
    actorCandidates.map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    ),
  );

  return rows.filter((row) => {
    const rowCandidates = buildDepartmentCandidates({
      departmentId: row?.department_id,
      departmentLabel: row?.department_label,
    }).map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    );

    return rowCandidates.some((candidate) =>
      normalizedActorCandidates.has(candidate),
    );
  });
}

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

function buildDepartmentLookup(departments = []) {
  const lookup = new Map();

  departments.forEach((department) => {
    const slugKey = String(department?.slug || department?.id || "")
      .trim()
      .toLowerCase();
    const nameKey = String(department?.name || department?.label || "")
      .trim()
      .toLowerCase();

    if (slugKey) {
      lookup.set(slugKey, department);
    }

    if (nameKey) {
      lookup.set(nameKey, department);
    }
  });

  return lookup;
}

function applyDepartmentMetadataToReportRow(reportRow, departmentLookup) {
  const issueTypeKey = String(reportRow?.issue_type || "")
    .trim()
    .toLowerCase();

  if (!issueTypeKey || !departmentLookup.has(issueTypeKey)) {
    return reportRow;
  }

  const department = departmentLookup.get(issueTypeKey);

  return {
    ...reportRow,
    department_slug: department?.slug || department?.id || reportRow?.issue_type,
    department_name: department?.name || department?.label || reportRow?.issue_type,
  };
}

async function resolveActiveDepartmentOrThrow({ accessToken, value, fieldName }) {
  const department = await departmentsService.getActiveDepartmentByValue({
    accessToken,
    value,
  });

  if (!department) {
    throw new AppError(
      `Invalid or inactive ${fieldName}.`,
      StatusCodes.BAD_REQUEST,
    );
  }

  return department;
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

async function createCitizenStatusNotification({
  accessToken,
  reportRow,
  nextStatus,
}) {
  const notificationContent = getStatusNotificationContent(nextStatus);

  if (!notificationContent || !reportRow?.user_id) {
    return;
  }

  await notificationsRepository.createNotification({
    accessToken,
    userId: reportRow.user_id,
    type: "status",
    title: notificationContent.title,
    message: notificationContent.message,
    reportId: reportRow.id,
  });

  // Push integration will use this deterministic event marker.
  logger.info("Citizen report-status notification created", {
    reportId: reportRow.id,
    userId: reportRow.user_id,
    status: notificationContent.statusCode,
    eventType: notificationContent.eventType,
  });
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
    const requestedDepartmentValue =
      payload.departmentId || payload.departmentLabel;
    const normalizedDepartmentValue = String(requestedDepartmentValue || "").trim();

    const matchedDepartment = normalizedDepartmentValue
      ? await resolveActiveDepartmentOrThrow({
          accessToken,
          value: normalizedDepartmentValue,
          fieldName: "department",
        })
      : null;

    if (normalizedAccountType === "admin" && !matchedDepartment) {
      throw new AppError(
        "Department is required for admin accounts.",
        StatusCodes.BAD_REQUEST,
      );
    }

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
          department_id:
            matchedDepartment?.slug || normalizeOptionalString(payload.departmentId),
          department_label:
            matchedDepartment?.name || normalizeOptionalString(payload.departmentLabel),
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
    const requestedDepartmentValue =
      payload.departmentId !== undefined
        ? payload.departmentId
        : payload.departmentLabel;
    const normalizedDepartmentValue = String(requestedDepartmentValue || "").trim();

    const matchedDepartment = normalizedDepartmentValue
      ? await resolveActiveDepartmentOrThrow({
          accessToken,
          value: normalizedDepartmentValue,
          fieldName: "department",
        })
      : null;

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
      ...(matchedDepartment
        ? {
            department_id: matchedDepartment.slug,
            department_label: matchedDepartment.name,
          }
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
    const [result, departmentCatalog] = await Promise.all([
      adminRepository.listReports({
        actor,
        accessToken,
        limit,
        offset,
        status,
      }),
      departmentsService.listDepartments({
        accessToken,
        includeInactive: true,
      }),
    ]);
    const departmentLookup = buildDepartmentLookup(departmentCatalog);
    const rowsWithDepartmentMeta = result.rows.map((row) =>
      applyDepartmentMetadataToReportRow(row, departmentLookup),
    );

    return {
      data: rowsWithDepartmentMeta.map((row) =>
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
    const [result, departmentCatalog] = await Promise.all([
      adminRepository.getReportById({
        actor,
        accessToken,
        reportId,
      }),
      departmentsService.listDepartments({
        accessToken,
        includeInactive: true,
      }),
    ]);

    if (!result) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    const departmentLookup = buildDepartmentLookup(departmentCatalog);
    const reportRow = applyDepartmentMetadataToReportRow(
      result.row,
      departmentLookup,
    );

    return toAdminReportResponse({
      reportRow,
      reporterProfile: result.reporterProfile,
    });
  },

  async updateReportStatus({ actor, accessToken, reportId, status }) {
    const nextStatus = mapReportStatusInputToPersisted(status);
    const existingReport = await adminRepository.getReportById({
      actor,
      accessToken,
      reportId,
    });

    if (!existingReport) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    const previousStatus = normalizeReportStatus(existingReport.row?.status);

    if (previousStatus === nextStatus) {
      const departmentCatalog = await departmentsService.listDepartments({
        accessToken,
        includeInactive: true,
      });
      const departmentLookup = buildDepartmentLookup(departmentCatalog);

      return toAdminReportResponse({
        reportRow: applyDepartmentMetadataToReportRow(
          existingReport.row,
          departmentLookup,
        ),
        reporterProfile: existingReport.reporterProfile,
      });
    }

    const result = await adminRepository.updateReportById({
      actor,
      accessToken,
      reportId,
      payload: {
        status: nextStatus,
      },
    });

    if (!result) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    try {
      await createCitizenStatusNotification({
        accessToken,
        reportRow: result.row,
        nextStatus,
      });
    } catch (error) {
      logger.warn("Failed to create citizen report-status notification", {
        reportId,
        nextStatus,
        error: error?.message || String(error),
      });
    }

    const departmentCatalog = await departmentsService.listDepartments({
      accessToken,
      includeInactive: true,
    });
    const departmentLookup = buildDepartmentLookup(departmentCatalog);

    return toAdminReportResponse({
      reportRow: applyDepartmentMetadataToReportRow(
        result.row,
        departmentLookup,
      ),
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

    const resolvedDepartment = await resolveActiveDepartmentOrThrow({
      accessToken,
      value: departmentId || departmentLabel,
      fieldName: "department",
    });

    const updatedOfficeAdmin = await adminRepository.updateOfficeAdminDepartment({
      accessToken,
      adminUserId,
      departmentId: resolvedDepartment.slug,
      departmentLabel: resolvedDepartment.name,
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

    const resolvedDepartment = await resolveActiveDepartmentOrThrow({
      accessToken,
      value: requestedDepartmentId || requestedDepartmentLabel,
      fieldName: "requested department",
    });

    const createdRequest = await adminRepository.createTransferRequest({
      accessToken,
      payload: {
        admin_user_id: actor.id,
        admin_name: actor.fullName || actor.email || "Office Admin",
        current_department_id: actor.departmentId,
        current_department_label: actor.departmentLabel,
        requested_department_id: resolvedDepartment.slug,
        requested_department_label: resolvedDepartment.name,
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

  async getDashboardSummary({ actor, accessToken }) {
    const [totalUsers, reportRows] = await Promise.all([
      adminRepository.countTotalCitizens({
        accessToken,
      }),
      adminRepository.listDashboardReports({
        actor,
        accessToken,
      }),
    ]);

    const reportTotals = reportRows.reduce(
      (accumulator, row) => {
        const status = normalizeReportStatus(row?.status);
        accumulator.totalReports += 1;
        accumulator.statusBreakdown[status] += 1;
        return accumulator;
      },
      {
        totalReports: 0,
        statusBreakdown: {
          pending: 0,
          in_review: 0,
          resolved: 0,
          rejected: 0,
        },
      },
    );

    return {
      totals: {
        totalUsers,
        ongoingReports:
          reportTotals.statusBreakdown.pending +
          reportTotals.statusBreakdown.in_review,
        reportsResolved: reportTotals.statusBreakdown.resolved,
        totalReports: reportTotals.totalReports,
      },
      scope: {
        reportMetrics: isSuperadmin(actor?.role) ? "global" : "department",
        userMetrics: "global",
      },
    };
  },

  async getDashboardReportsByStatus({ actor, accessToken }) {
    const reportRows = await adminRepository.listDashboardReports({
      actor,
      accessToken,
    });

    const statusCounts = {
      pending: 0,
      in_review: 0,
      resolved: 0,
      rejected: 0,
    };

    reportRows.forEach((row) => {
      const status = normalizeReportStatus(row?.status);
      statusCounts[status] += 1;
    });

    const breakdown = REPORT_STATUS_KEYS.map((status) => ({
      status,
      label: REPORT_STATUS_LABELS[status],
      count: statusCounts[status],
    }));

    return {
      totalReports: reportRows.length,
      breakdown,
    };
  },

  async getDashboardReportsByCategory({ actor, accessToken }) {
    const [reportRows, departmentCatalog] = await Promise.all([
      adminRepository.listDashboardReports({
        actor,
        accessToken,
      }),
      departmentsService.listDepartments({
        accessToken,
        includeInactive: true,
      }),
    ]);

    const categories = departmentCatalog.map((department) => ({
      id: department.slug,
      label: department.name,
      count: 0,
    }));

    const departmentLookup = buildDepartmentLookup(departmentCatalog);
    const categoryIndex = categories.reduce((accumulator, category, index) => {
      accumulator[category.id] = index;
      return accumulator;
    }, {});

    let unknownCount = 0;

    reportRows.forEach((row) => {
      const issueTypeKey = String(row?.issue_type || "")
        .trim()
        .toLowerCase();
      const matchedDepartment = departmentLookup.get(issueTypeKey);
      const categoryId = matchedDepartment?.slug || "";

      if (!categoryId || categoryIndex[categoryId] === undefined) {
        unknownCount += 1;
        return;
      }

      categories[categoryIndex[categoryId]].count += 1;
    });

    if (unknownCount > 0) {
      categories.push({
        id: "unknown",
        label: "Unknown",
        count: unknownCount,
      });
    }

    return {
      totalReports: reportRows.length,
      breakdown: categories,
    };
  },

  async getDashboardWeeklyTrend({ actor, accessToken }) {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const startAt = new Date(now - 7 * dayMs).toISOString();
    const endAt = new Date(now + dayMs).toISOString();

    const reportRows = await adminRepository.listDashboardReports({
      actor,
      accessToken,
      startAt,
      endAt,
    });

    const points = [];
    const countsByDateKey = {};

    for (let offset = 6; offset >= 0; offset -= 1) {
      const pointTime = now - offset * dayMs;
      const dateParts = buildDateParts(pointTime);
      const dateKey = dateParts.key;

      countsByDateKey[dateKey] = 0;
      points.push({
        dateKey,
        label: buildWeekdayLabel(pointTime),
        value: 0,
      });
    }

    reportRows.forEach((row) => {
      const createdAt = row?.created_at;
      if (!createdAt) {
        return;
      }

      const dateKey = buildDateParts(createdAt).key;
      if (countsByDateKey[dateKey] === undefined) {
        return;
      }

      countsByDateKey[dateKey] += 1;
    });

    const completedPoints = points.map((point) => ({
      ...point,
      value: countsByDateKey[point.dateKey] || 0,
    }));

    return {
      timeZone: MANILA_TIME_ZONE,
      labels: completedPoints.map((point) => point.label),
      values: completedPoints.map((point) => point.value),
      points: completedPoints,
    };
  },

  async getDashboardRecentAdmins({ actor, accessToken, limit }) {
    const normalizedLimit = normalizeDashboardLimit(limit);
    const rawRows = await adminRepository.listRecentOfficeAdmins({
      accessToken,
      limit: Math.max(20, normalizedLimit * 4),
    });

    const scopedRows = filterOfficeAdminsByScope(rawRows, actor).slice(
      0,
      normalizedLimit,
    );

    return scopedRows.map(toOfficeAdminResponse);
  },

  async getDashboardRecentUsers({ accessToken, limit }) {
    const normalizedLimit = normalizeDashboardLimit(limit);
    const rows = await adminRepository.listRecentCitizens({
      accessToken,
      limit: normalizedLimit,
    });

    return rows.map((profile) => ({
      id: profile?.user_id || "",
      username: profile?.username || "",
      fullName: profile?.full_name || profile?.username || profile?.email || "",
      email: profile?.email || null,
      joinedAt: profile?.created_at || null,
    }));
  },
};
