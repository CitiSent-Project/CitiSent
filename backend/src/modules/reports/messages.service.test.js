import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../shared/errors/appError.js";
import { reportMessagesService } from "./messages.service.js";
import { reportMessagesRepository } from "./messages.repository.js";
import { notificationsRepository } from "../admin/notifications/notifications.repository.js";
import { adminRepository } from "../admin/admin.repository.js";


function createReport(overrides = {}) {
  return {
    id: "report-1",
    user_id: "citizen-1",
    agency_id: "agency-1",
    ...overrides,
  };
}

test("getConversation allows the report owner and returns paginated result", async () => {
  const originalGetReportById = reportMessagesRepository.getReportById;
  const originalGetConversation = reportMessagesRepository.getConversation;
  const originalIsParticipantForReport = reportMessagesRepository.isParticipantForReport;
  try {
    let capturedParams = null;
    reportMessagesRepository.isParticipantForReport = async () => ({
      report: createReport(),
      allowed: true,
      participantType: "citizen",
    });
    reportMessagesRepository.getConversation = async (params) => {
      capturedParams = params;
      return {
        rows: [{ id: "msg-1", report_id: "report-1", sender_id: "citizen-1", message: "Hello", created_at: "2026-07-24T00:00:00.000Z" }],
        count: 1,
        hasMore: false,
        nextCursor: "2026-07-24T00:00:00.000Z",
        senderProfilesByUserId: {},
      };
    };

    const result = await reportMessagesService.getConversation({
      actor: { id: "citizen-1" },
      reportId: "report-1",
      limit: 25,
      before: "2026-07-24T12:00:00.000Z",
      accessToken: "token",
    });

    assert.equal(result.data.length, 1);
    assert.equal(result.pagination.limit, 25);
    assert.equal(result.pagination.total, 1);
    assert.equal(result.pagination.hasMore, false);
    assert.equal(capturedParams.limit, 25);
    assert.equal(capturedParams.before, "2026-07-24T12:00:00.000Z");
  } finally {
    reportMessagesRepository.getReportById = originalGetReportById;
    reportMessagesRepository.getConversation = originalGetConversation;
    reportMessagesRepository.isParticipantForReport = originalIsParticipantForReport;
  }
});

test("sendMessage rejects empty messages", async () => {
  await assert.rejects(
    () =>
      reportMessagesService.sendMessage({
        actor: { id: "citizen-1" },
        reportId: "report-1",
        message: "   ",
        accessToken: "token",
      }),
    (error) => error instanceof AppError && error.statusCode === 400,
  );
});

test("sendMessage creates a notification for the other participant", async () => {
  const originalGetReportById = reportMessagesRepository.getReportById;
  const originalCreateMessage = reportMessagesRepository.createMessage;
  const originalCreateNotification = notificationsRepository.createNotification;
  const originalIsParticipantForReport = reportMessagesRepository.isParticipantForReport;
  const originalGetAgencyParticipants = reportMessagesRepository.getAgencyParticipants;
  const originalListSuperadmins = adminRepository.listSuperadmins;
  try {
    adminRepository.listSuperadmins = async () => [];
    reportMessagesRepository.isParticipantForReport = async () => ({
      report: createReport(),
      allowed: true,
      participantType: "citizen",
    });
    reportMessagesRepository.getAgencyParticipants = async () => [
      { user_id: "admin-1", role: "admin" },
    ];
    reportMessagesRepository.createMessage = async (payload) => ({
      id: "msg-1",
      report_id: payload.reportId,
      sender_id: payload.senderId,
      message: payload.message,
      created_at: "2026-07-24T00:00:00.000Z",
    });

    let notificationPayload = null;
    notificationsRepository.createNotification = async (payload) => {
      notificationPayload = payload;
      return payload;
    };

    const result = await reportMessagesService.sendMessage({
      actor: { id: "citizen-1", fullName: "Citizen User" },
      reportId: "report-1",
      message: "Need help",
      accessToken: "token",
    });

    assert.equal(result.message, "Need help");
    assert.equal(notificationPayload.userId, "admin-1");
    assert.equal(notificationPayload.reportId, "report-1");
  } finally {
    reportMessagesRepository.getReportById = originalGetReportById;
    reportMessagesRepository.createMessage = originalCreateMessage;
    notificationsRepository.createNotification = originalCreateNotification;
    reportMessagesRepository.isParticipantForReport = originalIsParticipantForReport;
    reportMessagesRepository.getAgencyParticipants = originalGetAgencyParticipants;
    adminRepository.listSuperadmins = originalListSuperadmins;
  }
});


