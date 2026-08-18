import test from "node:test";
import assert from "node:assert/strict";
import { adminService } from "./admin.service.js";
import { adminRepository } from "./admin.repository.js";
import { reportMessagesRepository } from "../reports/messages.repository.js";
import { reportsSentimentClient } from "../reports/reports.sentiment.js";
import { cacheService } from "../../shared/cache/cacheService.js";

test("getAdminNoteSuggestions uses conversation context when it exists", async () => {
  const originals = {
    getReportById: adminRepository.getReportById,
    getConversation: reportMessagesRepository.getConversation,
    getAdminNoteSuggestions: reportsSentimentClient.getAdminNoteSuggestions,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    adminRepository.getReportById = async () => ({
      row: {
        id: "report-1", user_id: "citizen-1", status: "pending", issue_type: "Flooding",
        sentiment_label: "High", emotion_level: "Angry", description: "Water is rising near the road.",
      },
    });
    reportMessagesRepository.getConversation = async () => ({
      rows: [
        { id: "message-1", sender_id: "citizen-1", message: "The water is getting worse." },
        { id: "message-2", sender_id: "admin-1", message: "We are reviewing it." },
      ],
    });
    cacheService.getJSON = async () => null;
    cacheService.setJSON = async () => {};
    let payload;
    reportsSentimentClient.getAdminNoteSuggestions = async (input) => {
      payload = input;
      return { suggestedNotes: [{ text: "Review in progress.", rank: 1 }] };
    };

    const result = await adminService.getAdminNoteSuggestions({
      actor: { id: "admin-1" }, accessToken: "token", reportId: "report-1", status: "in_review",
    });

    assert.equal(result.suggestedNotes[0].text, "Review in progress.");
    assert.equal(payload.reportStatus, "in_review");
    assert.equal(payload.detectedEmotion, "Angry");
    assert.deepEqual(payload.conversationContext, [
      { sender: "Citizen", text: "The water is getting worse." },
      { sender: "Admin", text: "We are reviewing it." },
    ]);
  } finally {
    adminRepository.getReportById = originals.getReportById;
    reportMessagesRepository.getConversation = originals.getConversation;
    reportsSentimentClient.getAdminNoteSuggestions = originals.getAdminNoteSuggestions;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});

test("getAdminNoteSuggestions falls back to the report sentiment without a conversation", async () => {
  const originals = {
    getReportById: adminRepository.getReportById,
    getConversation: reportMessagesRepository.getConversation,
    getAdminNoteSuggestions: reportsSentimentClient.getAdminNoteSuggestions,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    adminRepository.getReportById = async () => ({
      row: { id: "report-1", user_id: "citizen-1", status: "pending", emotion_level: "Frustrated" },
    });
    reportMessagesRepository.getConversation = async () => ({ rows: [] });
    cacheService.getJSON = async () => null;
    cacheService.setJSON = async () => {};
    reportsSentimentClient.getAdminNoteSuggestions = async () => {
      throw new Error("Sidecar unavailable");
    };

    const result = await adminService.getAdminNoteSuggestions({
      actor: { id: "admin-1" }, accessToken: "token", reportId: "report-1", status: "pending",
    });

    assert.equal(result.suggestedNotes.length, 4);
    assert.equal(result.triggerEmotion, "Frustrated");
    assert.match(result.reason, /Sidecar unavailable/);
  } finally {
    adminRepository.getReportById = originals.getReportById;
    reportMessagesRepository.getConversation = originals.getConversation;
    reportsSentimentClient.getAdminNoteSuggestions = originals.getAdminNoteSuggestions;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});
