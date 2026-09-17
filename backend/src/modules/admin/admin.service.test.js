import test from "node:test";
import assert from "node:assert/strict";
import { adminService } from "./admin.service.js";
import { adminRepository } from "./admin.repository.js";
import { departmentsService } from "../departments/departments.service.js";
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

test("adminService.listReports uses Redis cache when present", async () => {
  const originals = {
    listReports: adminRepository.listReports,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    const cachedResponse = {
      data: [{ id: "cached-report-1", reportNumber: "REP-001" }],
      pagination: { total: 1, limit: 50, offset: 0 },
    };

    cacheService.getJSON = async (key) => {
      if (key.includes("admin:reports:")) {
        return cachedResponse;
      }
      return null;
    };

    let repoCalled = false;
    adminRepository.listReports = async () => {
      repoCalled = true;
      return { rows: [], count: 0, reporterProfilesByUserId: {} };
    };

    const result = await adminService.listReports({
      actor: { role: "superadmin" },
      accessToken: "token",
      limit: 50,
      offset: 0,
    });

    assert.equal(repoCalled, false);
    assert.deepEqual(result, cachedResponse);
  } finally {
    adminRepository.listReports = originals.listReports;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});

test("adminService.listReports includes resolvedAt on mapped report items", async () => {
  const originals = {
    listReports: adminRepository.listReports,
    listDepartments: departmentsService.listDepartments,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    cacheService.getJSON = async () => null;
    cacheService.setJSON = async () => {};
    departmentsService.listDepartments = async () => [];

    adminRepository.listReports = async () => ({
      rows: [
        {
          id: "rep-1",
          report_number: "bfp-0023",
          status: "resolved",
          resolved_at: "2026-09-17T04:38:40.769Z",
          user_id: "u1",
        },
      ],
      count: 1,
      reporterProfilesByUserId: {
        u1: { email: "u1@test.com" },
      },
    });

    const result = await adminService.listReports({
      actor: { role: "superadmin" },
      accessToken: "token",
      limit: 50,
      offset: 0,
    });

    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].resolvedAt, "2026-09-17T04:38:40.769Z");
  } finally {
    adminRepository.listReports = originals.listReports;
    departmentsService.listDepartments = originals.listDepartments;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});

