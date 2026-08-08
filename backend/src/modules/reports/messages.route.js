import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { reportMessagesController } from "./messages.controller.js";
import {
  listReportMessagesSchema,
  markReportMessagesReadSchema,
  sendReportMessageSchema,
  getReportMessagesSuggestionsSchema,
} from "./messages.schema.js";

const reportMessagesRouter = Router({ mergeParams: true });

reportMessagesRouter.get(
  "/",
  requireAuth,
  validateRequest(listReportMessagesSchema),
  asyncHandler(reportMessagesController.getConversation),
);

reportMessagesRouter.get(
  "/suggestions",
  requireAuth,
  validateRequest(getReportMessagesSuggestionsSchema),
  asyncHandler(reportMessagesController.getSuggestions),
);

reportMessagesRouter.post(
  "/",
  requireAuth,
  validateRequest(sendReportMessageSchema),
  asyncHandler(reportMessagesController.sendMessage),
);

reportMessagesRouter.patch(
  "/read",
  requireAuth,
  validateRequest(markReportMessagesReadSchema),
  asyncHandler(reportMessagesController.markRead),
);

export { reportMessagesRouter };
