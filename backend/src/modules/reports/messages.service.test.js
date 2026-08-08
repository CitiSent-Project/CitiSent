import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../shared/errors/appError.js";
import { reportMessagesService } from "./messages.service.js";
import { reportMessagesRepository } from "./messages.repository.js";
import { notificationsRepository } from "../admin/notifications/notifications.repository.js";
import { reportsSentimentClient } from "./reports.sentiment.js";

function createReport(overrides = {}) {
  return {
    id: "report-1",
    user_id: "citizen-1",
    agency_id: "agency-1",
    ...overrides,
  };
}

test("getConversation allows the report owner", async () => {
  const originalGetReportById = reportMessagesRepository.getReportById;
  const originalGetConversation = reportMessagesRepository.getConversation;
  const originalIsParticipantForReport = reportMessagesRepository.isParticipantForReport;
  try {
    reportMessagesRepository.isParticipantForReport = async () => ({
      report: createReport(),
      allowed: true,
      participantType: "citizen",
    });
    reportMessagesRepository.getConversation = async () => ({
      rows: [{ id: "msg-1", report_id: "report-1", sender_id: "citizen-1", message: "Hello", created_at: "2026-07-24T00:00:00.000Z" }],
      count: 1,
      senderProfilesByUserId: {},
    });

    const result = await reportMessagesService.getConversation({
      actor: { id: "citizen-1" },
      reportId: "report-1",
      accessToken: "token",
    });

    assert.equal(result.data.length, 1);
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
  try {
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
  }
});

test("getChatSuggestions blocks citizens from fetching suggestions", async () => {
  const originalIsParticipantForReport = reportMessagesRepository.isParticipantForReport;
  try {
    reportMessagesRepository.isParticipantForReport = async () => ({
      report: createReport(),
      allowed: true,
      participantType: "citizen",
    });

    await assert.rejects(
      () =>
        reportMessagesService.getChatSuggestions({
          actor: { id: "citizen-1" },
          reportId: "report-1",
          accessToken: "token",
        }),
      (error) => error instanceof AppError && error.statusCode === 403,
    );
  } finally {
    reportMessagesRepository.isParticipantForReport = originalIsParticipantForReport;
  }
});

test("getChatSuggestions orchestrates call to sentiment client for suggestions", async () => {
  const originalIsParticipantForReport = reportMessagesRepository.isParticipantForReport;
  const originalGetConversation = reportMessagesRepository.getConversation;
  const originalGetChatSuggestions = reportsSentimentClient.getChatSuggestions;
  try {
    reportMessagesRepository.isParticipantForReport = async () => ({
      report: createReport({ description: "Citizen report description", issue_type: "Flooding", sentiment_label: "High", emotion_level: "Angry" }),
      allowed: true,
      participantType: "admin",
    });

    reportMessagesRepository.getConversation = async () => ({
      rows: [
        { id: "msg-1", sender_id: "citizen-1", message: "Citizen first message", created_at: "2026-07-24T00:00:00.000Z" },
        { id: "msg-2", sender_id: "admin-1", message: "Admin response", created_at: "2026-07-24T00:01:00.000Z" }
      ],
      count: 2,
    });

    let clientPayload = null;
    reportsSentimentClient.getChatSuggestions = async (payload) => {
      clientPayload = payload;
      return {
        suggestedReplies: [
          { text: "Reply A", rank: 1 },
          { text: "Reply B", rank: 2 },
          { text: "Reply C", rank: 3 },
          { text: "Reply D", rank: 4 }
        ],
        tone: "professional",
      };
    };

    const result = await reportMessagesService.getChatSuggestions({
      actor: { id: "admin-1" },
      reportId: "report-1",
      accessToken: "token",
    });

    assert.equal(result.suggestedReplies.length, 4);
    assert.equal(clientPayload.latestUserMessage, "Citizen first message");
    assert.deepEqual(clientPayload.conversationContext, [
      { sender: "Citizen", text: "Citizen first message" },
      { sender: "Admin", text: "Admin response" }
    ]);
    assert.equal(clientPayload.reportCategory, "Flooding");
    assert.equal(clientPayload.urgency, "High");
    assert.equal(clientPayload.detectedEmotion, "Angry");
  } finally {
    reportMessagesRepository.isParticipantForReport = originalIsParticipantForReport;
    reportMessagesRepository.getConversation = originalGetConversation;
    reportsSentimentClient.getChatSuggestions = originalGetChatSuggestions;
  }
});

