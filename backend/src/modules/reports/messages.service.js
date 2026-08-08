import { StatusCodes } from "http-status-codes";
import { AppError } from "../../shared/errors/appError.js";
import { reportMessagesRepository } from "./messages.repository.js";
import { toReportMessageResponse } from "./messages.mapper.js";
import { notificationsRepository } from "../admin/notifications/notifications.repository.js";
import { emitToReportRoom } from "../../realtime/socket.js";
import { reportsSentimentClient } from "./reports.sentiment.js";
import { cacheService } from "../../shared/cache/cacheService.js";

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
        return toReportMessageResponse(
          {
            ...row,
            sender_name:
              senderProfile?.fname ||
              senderProfile?.username ||
              senderProfile?.email ||
              null,
          },
          // Pass the current user's ID so isRead is resolved from the correct
          // report_message_reads join entry rather than always returning false.
          actor.id,
        );
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

    const formattedMessage = toReportMessageResponse(created);

    // Broadcast receive_message to all connected socket clients viewing this report
    try {
      emitToReportRoom(reportId, "receive_message", {
        reportId,
        message: formattedMessage,
      });
    } catch {
      // Non-critical socket broadcast fallback
    }

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
        title: "Admin replied to your report",
        message: normalizedMessage,
        reportId,
        metadata: {
          senderId: actor.id,
          reportId,
          issueType: access.report?.issue_type || null,
          reportDescription: access.report?.description || null,
        },
      });
    }

    return formattedMessage;
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

    const formattedRows = updatedRows.map((row) => toReportMessageResponse(row, actor.id));

    // Broadcast messages_read event via Socket.IO
    try {
      emitToReportRoom(reportId, "messages_read", {
        reportId,
        readerId: actor.id,
        updatedCount: updatedRows.length,
      });
    } catch {
      // Non-critical socket broadcast fallback
    }

    return {
      // Pass actor.id so the returned rows correctly reflect the reader's isRead state.
      data: formattedRows,
      updatedCount: updatedRows.length,
    };
  },

  async getChatSuggestions({ actor, reportId, accessToken, forceRegenerate = false }) {
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

    // Only LGU staff/admins should see suggested replies
    if (access.participantType === "citizen") {
      throw new AppError("Forbidden: Citizens cannot fetch suggestions.", StatusCodes.FORBIDDEN);
    }

    const conversation = await reportMessagesRepository.getConversation({ reportId, accessToken });
    const messages = conversation.rows || [];
    const citizenUserId = access.report.user_id;

    // Filter messages sent by the citizen
    const citizenMessages = messages.filter((m) => String(m.sender_id) === String(citizenUserId));

    let latestUserMessage = access.report.description || "";
    let latestCitizenMessageId = "initial_report";

    if (citizenMessages.length > 0) {
      const lastMsg = citizenMessages[citizenMessages.length - 1];
      latestUserMessage = lastMsg.message;
      latestCitizenMessageId = lastMsg.id;
    }

    const cacheKey = `chat_suggestions:report:${reportId}:msg:${latestCitizenMessageId}`;

    if (!forceRegenerate) {
      const cached = await cacheService.getJSON(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Take last 10 messages for context
    const contextLimit = 10;
    const recentMessages = messages.slice(-contextLimit);
    const conversationContext = recentMessages.map((m) => ({
      sender: String(m.sender_id) === String(citizenUserId) ? "Citizen" : "Admin",
      text: m.message || "",
    }));

    let suggestions;
    try {
      suggestions = await reportsSentimentClient.getChatSuggestions({
        latestUserMessage,
        conversationContext,
        reportCategory: access.report.issue_type || "General",
        urgency: access.report.sentiment_label || "Medium",
        detectedEmotion: access.report.emotion_level || "Neutral",
      }, { accessToken });
    } catch (error) {
      suggestions = {
        suggestedReplies: [
          { text: "Thank you for reaching out. We have received your message and are looking into it.", rank: 1 },
          { text: "Could you please provide more details or clarify your request?", rank: 2 },
          { text: "We are currently reviewing this issue and will update you as soon as possible.", rank: 3 },
          { text: "If this is an immediate emergency, please contact our direct hotline or emergency services.", rank: 4 }
        ],
        tone: "neutral",
        confidence: 0.5,
        reason: `Suggestions API request failed: ${error?.message || String(error)}`,
        triggerEmotion: access.report.emotion_level || "Neutral",
        fallbackMessage: "Thank you for reaching out. We have received your message and are looking into it."
      };
    }

    // Cache the suggestions (TTL of 5 minutes)
    await cacheService.setJSON(cacheKey, suggestions, 300);

    return suggestions;
  },
};

