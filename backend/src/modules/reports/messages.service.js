import { StatusCodes } from "http-status-codes";
import { AppError } from "../../shared/errors/appError.js";
import { reportMessagesRepository } from "./messages.repository.js";
import { toReportMessageResponse } from "./messages.mapper.js";
import { notificationsRepository } from "../admin/notifications/notifications.repository.js";

function normalizeMessageInput(message) {
  return String(message || "").trim();
}

function pickNotificationRecipient(participants = [], senderId) {
  const sender = String(senderId || "");
  const candidates = participants.filter((participant) => String(participant.user_id || "") !== sender);

  if (!candidates.length) {
    return null;
  }

  const adminCandidate = candidates.find((participant) => String(participant.role || "").toLowerCase() === "admin");
  return adminCandidate || candidates[0];
}

export const reportMessagesService = {
  async getConversation({ actor, reportId, accessToken }) {
    const access = await reportMessagesRepository.isParticipantForReport({
      reportId,
      userId: actor.id,
      accessToken,
    });

    if (!access.report) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    if (!access.allowed) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    const result = await reportMessagesRepository.getConversation({ reportId, accessToken });

    return {
      data: result.rows.map((row) => {
        const senderProfile = result.senderProfilesByUserId[row.sender_id];
        return toReportMessageResponse({
          ...row,
          sender_name:
            senderProfile?.fname ||
            senderProfile?.username ||
            senderProfile?.email ||
            null,
        });
      }),
      conversation: {
        reportId,
        total: result.count,
        ownerId: access.report.user_id,
        agencyId: access.report.agency_id || null,
        participantType: access.participantType || null,
      },
    };
  },

  async sendMessage({ actor, reportId, message, accessToken }) {
    const normalizedMessage = normalizeMessageInput(message);
    if (!normalizedMessage) {
      throw new AppError("Message content is required.", StatusCodes.BAD_REQUEST);
    }

    const access = await reportMessagesRepository.isParticipantForReport({
      reportId,
      userId: actor.id,
      accessToken,
    });

    if (!access.report) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    if (!access.allowed) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    const created = await reportMessagesRepository.createMessage({
      reportId,
      senderId: actor.id,
      message: normalizedMessage,
      accessToken,
    });

    const participants = await reportMessagesRepository.getAgencyParticipants({
      agencyId: access.report.agency_id,
      accessToken,
      excludeUserId: actor.id,
    });
    const recipient = pickNotificationRecipient(participants, actor.id);

    if (recipient?.user_id) {
      await notificationsRepository.createNotification({
        accessToken,
        userId: recipient.user_id,
        type: "message",
        title: "New report message",
        message: normalizedMessage,
        reportId,
        metadata: { senderId: actor.id },
      });
    }

    return toReportMessageResponse(created);
  },

  async markConversationRead({ actor, reportId, messageIds = null, accessToken }) {
    const access = await reportMessagesRepository.isParticipantForReport({
      reportId,
      userId: actor.id,
      accessToken,
    });

    if (!access.report) {
      throw new AppError("Report not found", StatusCodes.NOT_FOUND);
    }

    if (!access.allowed) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    const updatedRows = await reportMessagesRepository.markMessagesRead({
      reportId,
      readerId: actor.id,
      accessToken,
      messageIds,
    });

    return {
      data: updatedRows.map(toReportMessageResponse),
      updatedCount: updatedRows.length,
    };
  },
};
