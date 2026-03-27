import test from "node:test";
import assert from "node:assert/strict";
import {
  mapReportStatusInputToPersisted,
  toAdminReportResponse,
  toAdminUserResponse,
  toTransferRequestResponse,
} from "./admin.mapper.js";

test("mapReportStatusInputToPersisted maps UI labels to stored values", () => {
  assert.equal(mapReportStatusInputToPersisted("In Progress"), "in_review");
  assert.equal(mapReportStatusInputToPersisted("Resolved"), "resolved");
  assert.equal(mapReportStatusInputToPersisted("Unresolved"), "rejected");
  assert.equal(mapReportStatusInputToPersisted("Pending"), "pending");
});

test("toAdminReportResponse enriches report data for the admin website", () => {
  const response = toAdminReportResponse({
    reportRow: {
      id: "report-1",
      issue_type: "City Treasury Office",
      description: "Delayed payment confirmation",
      location: "Treasury Building",
      status: "in_review",
      sentiment_label: "urgent",
      attachment_url: null,
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-02T00:00:00.000Z",
      user_id: "citizen-1",
    },
    reporterProfile: {
      email: "citizen@example.com",
      full_name: "Citizen One",
    },
  });

  assert.equal(response.departmentId, "cto");
  assert.equal(response.departmentLabel, "City Treasury Office");
  assert.equal(response.status, "in_review");
  assert.equal(response.statusLabel, "In Progress");
  assert.equal(response.urgency, "Urgent");
  assert.equal(response.reporter.fullName, "Citizen One");
});

test("toTransferRequestResponse matches frontend transfer request shape", () => {
  const response = toTransferRequestResponse({
    id: "transfer-1",
    admin_user_id: "admin-1",
    admin_name: "Office Admin",
    current_department_id: "bplo",
    current_department_label: "Business Permits and Licensing Office (BPLO)",
    requested_department_id: "cto",
    requested_department_label: "City Treasury Office",
    reason: "Operational reassignment",
    status: "approved",
    created_at: "2026-03-01T00:00:00.000Z",
    reviewed_at: "2026-03-02T00:00:00.000Z",
    reviewed_by_user_id: "super-1",
    reviewed_by_name: "Super Admin",
    review_notes: "Approved by superadmin",
  });

  assert.equal(response.adminId, "admin-1");
  assert.equal(response.requestedDepartmentId, "cto");
  assert.equal(response.status, "approved");
  assert.equal(response.reviewerId, "super-1");
  assert.equal(response.reviewNotes, "Approved by superadmin");
});

test("toAdminUserResponse maps profile data for active users", () => {
  const response = toAdminUserResponse({
    profile: {
      user_id: "user-1",
      email: "user@example.com",
      username: "user_one",
      full_name: "User One",
      phone_number: "639171234567",
      account_type: "citizen",
      role: null,
      department_id: "bplo",
      department_label: "Business Permits and Licensing Office (BPLO)",
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-02T00:00:00.000Z",
    },
    activeBan: null,
  });

  assert.equal(response.id, "user-1");
  assert.equal(response.fullName, "User One");
  assert.equal(response.status, "active");
  assert.equal(response.ban, null);
});

test("toAdminUserResponse marks banned users with ban metadata", () => {
  const response = toAdminUserResponse({
    profile: {
      user_id: "user-2",
      email: "banned@example.com",
      username: "banned_user",
      full_name: "Banned User",
      account_type: "citizen",
      role: null,
    },
    activeBan: {
      reason: "Terms violation",
      banned_at: "2026-03-03T00:00:00.000Z",
      banned_by_user_id: "admin-1",
    },
  });

  assert.equal(response.status, "banned");
  assert.equal(response.ban.reason, "Terms violation");
  assert.equal(response.ban.bannedByUserId, "admin-1");
});
