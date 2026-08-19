import { StatusCodes } from "http-status-codes";
import { reportMessagesService } from "./messages.service.js";

export const reportMessagesController = {
  async getConversation(req, res) {
    const result = await reportMessagesService.getConversation({
      actor: req.user,
      reportId: req.params.reportId,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      before: req.query.before || null,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  },

  async sendMessage(req, res) {
    const result = await reportMessagesService.sendMessage({
      actor: req.user,
      reportId: req.params.reportId,
      message: req.body.message,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  },

  async markRead(req, res) {
    const result = await reportMessagesService.markConversationRead({
      actor: req.user,
      reportId: req.params.reportId,
      messageIds: req.body.messageIds,
      accessToken: req.accessToken,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async getSuggestions(req, res) {
    const result = await reportMessagesService.getChatSuggestions({
      actor: req.user,
      reportId: req.params.reportId,
      accessToken: req.accessToken,
      forceRegenerate: req.query.forceRegenerate,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },
};
